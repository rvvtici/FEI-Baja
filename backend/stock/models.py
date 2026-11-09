import re
import uuid
from decimal import Decimal

from django.db import models
from django.db.models import F, Case, When, Value, CharField
from django.db.models.fields import CharField
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.conf import settings

from .label_layout import GEOMETRY_FIELDS, sheet_geometry_errors

# O código vai impresso na etiqueta e na URL do QR: só caracteres seguros
ITEM_CODE_PATTERN = re.compile(r'[A-Z0-9_-]+')
ITEM_CODE_ERROR = "O código só pode ter letras sem acento, números, hífen (-) e sublinhado (_). Ex.: MO001"


def normalize_item_code(value):
    # Usado só em códigos e prefixos NOVOS: os já cadastrados não são alterados
    code = (value or '').strip().upper()
    if code and not ITEM_CODE_PATTERN.fullmatch(code):
        raise ValidationError(ITEM_CODE_ERROR)
    return code


class Category(models.Model):
    name = models.CharField(max_length=50)
    code_prefix =  models.CharField(max_length=3, help_text="Ex: MO, CT, ELT")
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)

    def clean(self):
        super().clean()
        # Prefixo novo segue a mesma regra do código do item (os já cadastrados não são alterados)
        if self._state.adding and self.code_prefix:
            try:
                self.code_prefix = normalize_item_code(self.code_prefix)
            except ValidationError as e:
                raise ValidationError({'code_prefix': e.messages})

    def __str__(self) -> str:
        return f"{self.parent.name} > {self.name}" if self.parent else self.name

# Para filtros
class ItemManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().annotate(
            status_count=Case(
                When(qty__lte=F('minimum_qty'), then=Value('Comprar')),
                When(qty__lte=F('minimum_qty') * 1.20, then=Value('Atenção')),
                default=Value('OK'),
                output_field=CharField()
            )
        )

class Item(models.Model):
    class ItemTypes(models.TextChoices):
        TOOL = 'TOOL', 'Ferramenta'
        CONSUMABLE = 'CONSUMABLE', 'Consumível'
        MATERIAL = 'MATERIAL', 'Material'

    item_type = models.CharField(max_length=10, choices=ItemTypes.choices)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)

    qty = models.PositiveIntegerField(default=0)
    minimum_qty = models.IntegerField(default=0)
    barcode = models.CharField(max_length=50, unique = True, blank=True, null=True)

    brand = models.CharField(max_length=50, blank=True, null=True)
    expiration = models.DateField(blank=True, null=True)
    dimensions = models.CharField(max_length=50, blank=True, null=True)

    objects = ItemManager()

    def clean(self):
        super().clean()

        if self._state.adding and self.code:
            try:
                self.code = normalize_item_code(self.code)
            except ValidationError as e:
                raise ValidationError({'code': e.messages})

        if self.name and self.category:
            duplicate = Item.objects.filter(
                category = self.category,
                name__iexact = self.name
            ).exclude(pk=self.pk)

            if duplicate.exists():
                raise ValidationError(f"Já existe um item cadastrado com o nome '{self.name}' nesta categoria!")

        if self.item_type == self.ItemTypes.TOOL and not self.brand:
            raise ValidationError({
                'brand' : 'A ferramenta precisa de uma marca'
            })

        if self.item_type == self.ItemTypes.CONSUMABLE and not self.expiration:
            raise ValidationError({
                'consumable' : 'O consumível precisa de uma data de validade'
            })

        if self.item_type == self.ItemTypes.MATERIAL and not self.dimensions:
            raise ValidationError({
                'material' : 'O material precisa de dimensões'
            })


    def save(self, *args, **kwargs):
        if not self.barcode:
            self.barcode = uuid.uuid4().hex[:13].upper()  # Gera um código único de 13 caracteres

        if not self.code and self.category:
            prefix = self.category.code_prefix
            last = self.__class__.objects.filter(code__startswith=prefix).order_by('-code').first()
            num = int(last.code[len(prefix):]) + 1 if last else 1
            self.code = f"{prefix}{num:03d}"

        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"[{self.code}] {self.name} ({self.item_type})"

class ItemMovement(models.Model):  
    class ActionTypes(models.TextChoices):
        IN = 'IN', 'Entrada (+)'
        OUT = 'OUT', 'Saída (-)'

    class Reasons(models.TextChoices):
        USAGE = 'USAGE', 'Uso Interno'
        LOAN = 'LOAN', 'Empréstimo'
        LOSS = 'LOSS', 'Perda'
        BREAKAGE = 'BREAKAGE', 'Quebra'
        PURCHASE = 'PURCHASE', 'Compra / Reposição'
        RETURN = 'RETURN', 'Devolução de Empréstimo'
        MAINTENANCE = 'MAINTENANCE', 'Manutenção'

    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    action = models.CharField(max_length=3, choices=ActionTypes.choices)
    reason = models.CharField(max_length=20, choices=Reasons.choices, default=Reasons.USAGE)
    quantity = models.IntegerField()
    observations = models.TextField(blank=True, null=True)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        permissions = [("view_logs", "Pode ver os logs de movimentação")]

    def clean(self):
        if self.action == self.ActionTypes.OUT and self.quantity > self.item.qty:
            raise ValidationError("Não é possível realizar a retirada, pois a quantidade solicitada é maior do que a presente")

    #Função save() sobrescrita para atualizar o estoque do item automaticamente após uma movimentação
    def save(self, *args, **kwargs):
        is_new = self.pk is None 

        self.full_clean() # Roda a validação (quantidade de saída não pode ser maior que o estoque atual)

        super().save(*args, **kwargs)
        
        if is_new:
            if self.action == self.ActionTypes.IN:
                self.item.qty += self.quantity
            elif self.action == self.ActionTypes.OUT:
                self.item.qty -= self.quantity
            self.item.save()
        
    def __str__(self) -> str:
        return f"{self.get_action_display()} | {self.item.name} | Qtd: {self.quantity}"

def _mm(verbose_name, minimum=None, maximum=None, **kwargs):
    # Medidas em mm com 2 casas (até 9999,99)
    validators = []
    if minimum is not None:
        validators.append(MinValueValidator(Decimal(minimum)))
    if maximum is not None:
        validators.append(MaxValueValidator(Decimal(maximum)))
    return models.DecimalField(verbose_name, max_digits=6, decimal_places=2, validators=validators, **kwargs)


class LabelSheetTemplate(models.Model):
    """Modelo de folha adesiva (ex.: Pimaco). Todas as medidas em mm."""

    name = models.CharField("nome", max_length=80, unique=True)
    notes = models.CharField("observações", max_length=200, blank=True)

    page_width_mm = _mm("largura da página", "0.01", default=Decimal("210.00"))
    page_height_mm = _mm("altura da página", "0.01", default=Decimal("297.00"))
    columns = models.PositiveSmallIntegerField("colunas", validators=[MinValueValidator(1)])
    rows = models.PositiveSmallIntegerField("linhas", validators=[MinValueValidator(1)])
    label_width_mm = _mm("largura da etiqueta", "0.01")
    label_height_mm = _mm("altura da etiqueta", "0.01")
    # Da borda da folha até a borda da primeira etiqueta
    margin_top_mm = _mm("margem superior", "0")
    margin_left_mm = _mm("margem esquerda", "0")
    # Distância entre o início de uma etiqueta e o início da seguinte
    pitch_x_mm = _mm("passo horizontal", "0.01")
    pitch_y_mm = _mm("passo vertical", "0.01")
    # Calibração da impressora: positivo desloca para a direita (x) e para baixo (y). Limite de ±15 mm
    offset_x_mm = _mm("ajuste horizontal", "-15", "15", default=Decimal("0.00"))
    offset_y_mm = _mm("ajuste vertical", "-15", "15", default=Decimal("0.00"))
    inner_padding_mm = _mm("margem interna", "0", default=Decimal("1.50"))
    active = models.BooleanField("ativo", default=True)

    class Meta:
        ordering = ["name"]
        permissions = [("manage_labels", "Pode gerenciar modelos de folha e imprimir etiquetas")]

    def clean(self):
        super().clean()
        values = {field: getattr(self, field) for field in GEOMETRY_FIELDS}
        if any(value is None for value in values.values()):
            return  # o erro do campo vazio já foi apontado
        errors = sheet_geometry_errors(values)
        if errors:
            raise ValidationError(errors)

    @property
    def labels_per_sheet(self):
        return self.columns * self.rows

    def __str__(self) -> str:
        return self.name

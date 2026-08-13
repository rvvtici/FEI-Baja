import uuid

from django.db import models
from django.db.models import F, Case, When, Value, CharField
from django.db.models.fields import CharField
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User

class Pessoa(models.Model):
    nome = models.CharField(max_length=50)
    idade = models.IntegerField()

    def __str__(self) -> str:
        return self.nome

        #python3 manage.py migrate -> rodar models p/ banco de dados
        # area admin

class Category(models.Model):
    name = models.CharField(max_length=50)
    code_prefix =  models.CharField(max_length=3, help_text="Ex: MO, CT, ELT")
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)

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
    class Types(models.TextChoices):
        #PARA ICONS
        RETIRADA = 'RETIRADA', 'Retirada' #ALTERAR PARA PADRONIZAR 
        DEVOLUCAO = 'DEVOLUCAO', 'Devolução'
        EMPRESTIMO = 'EMPRESTIMO', 'Empréstimo'
        CADASTRO = 'CADASTRO', 'Cadastro'
        COMPRA = 'COMPRA', 'Compra'

    class Reasons(models.TextChoices):
        USAGE = 'USAGE', 'Uso Interno'
        LOSS = 'LOSS', 'Perda'
        BREAKAGE = 'BREAKAGE', 'Quebra'
        EXCHANGE = 'EXCHANGE', 'Troca'
        PURCHASE = 'PURCHASE', 'Compra'
        EXPIRED = 'EXPIRED', 'Vencido'

    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    type = models.CharField(max_length=15, choices=Types.choices)
    reason = models.CharField(max_length=10, choices=Reasons.choices, default=Reasons.USAGE)
    quantity = models.IntegerField()
    observations = models.TextField(blank=True, null=True)
    date = models.DateTimeField(auto_now_add=True)

    def clean(self):
        saidas = [self.Types.RETIRADA, self.Types.EMPRESTIMO]
        if self.type in saidas and self.quantity > self.item.qty:
            raise ValidationError("Não é possível realizar a saída, pois a quantidade é maior que o estoque atual.")

    #Função save() sobrescrita para atualizar o estoque do item automaticamente após uma movimentação
    def save(self, *args, **kwargs):
        is_new = self.pk is None 

        self.clean() # Roda a validação (quantidade de saída não pode ser maior que o estoque atual)

        super().save(*args, **kwargs)
        
        if is_new:
            entradas = [self.Types.DEVOLUCAO, self.Types.CADASTRO, self.Types.COMPRA]
            saidas = [self.Types.RETIRADA, self.Types.EMPRESTIMO]

            if self.type in entradas:
                self.item.qty += self.quantity
            elif self.type in saidas:
                self.item.qty -= self.quantity
            self.item.save()
        
    def __str__(self) -> str:
        return f"{self.get_type_display()} | {self.item.name} | Qtd: {self.quantity}"
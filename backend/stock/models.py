from django.db import models
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

    def __str__(self) -> str:
        return self.name

class Item(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)

    qty = models.PositiveIntegerField(default=0)
    minimum_qty = models.IntegerField(default=0)

    barcode = models.CharField(max_length=50, unique = True,blank=True, null=True)

    @property
    def status(self):
        if self.qty <= self.minimum_qty:
            return 'Comprar'
        if self.qty <= (self.minimum_qty * 1.20): # 20% a mais do mínimo (passível de alteração)
            return 'Atenção'
        return 'OK'
    
    def __str__(self) -> str:
        return self.name

class ItemMovement(models.Model):  
    class Types(models.TextChoices):
        IN = 'IN', 'Entrada'
        OUT = 'OUT', 'Saída'

    class Reasons(models.TextChoices):
        USAGE = 'USAGE', 'Uso Interno'
        LOSS = 'LOSS', 'Perda'
        BREAKAGE = 'BREAKAGE', 'Quebra'
        EXCHANGE = 'EXCHANGE', 'Troca'
        PURCHASE = 'PURCHASE', 'Compra'
        EXPIRED = 'EXPIRED', 'Vencido'

    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    type = models.CharField(max_length=3, choices=Types.choices)
    reason = models.CharField(max_length=10, choices=Reasons.choices, default=Reasons.USAGE)
    quantity = models.IntegerField()
    observations = models.TextField(blank=True, null=True)
    date = models.DateTimeField(auto_now_add=True)

    def clear(self):
        if self.type == self.Types.OUT and self.quantity > self.item.qty:
            raise ValidationError("Não é possível realizar a saída, pois a quantidade é maior que o estoque atual.")
        
    def __str__(self) -> str:
        return f"{self.get_type_display()} | {self.item.name} | Qtd: {self.quantity}"
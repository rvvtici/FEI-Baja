from django.db import models

class Pessoa(models.Model):
    nome = models.CharField(max_length=50)
    idade = models.IntegerField()

    def __str__(self) -> str:
        return self.nome

        #python3 manage.py migrate -> rodar models p/ banco de dados
        # area admin

class User(models.Model):
    username = models.CharField(max_length=50)
    email = models.EmailField()
    password = models.CharField(max_length=50)

    def __str__(self) -> str:
        return self.username
    
class Category(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self) -> str:
        return self.name

class Item(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)

    qty = models.IntegerField(default=0)
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

from django.contrib import admin
from .models import Pessoa, Category, Item, ItemMovement

admin.site.register(Pessoa)
admin.site.register(Category)
admin.site.register(Item)
admin.site.register(ItemMovement)
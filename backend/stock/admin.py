from django.contrib import admin
from .models import Pessoa, User, Category, Item

admin.site.register(Pessoa)
admin.site.register(Category)
admin.site.register(Item)
from django.contrib import admin
from .models import Category, Item, ItemMovement

admin.site.register(Category)
admin.site.register(Item)
admin.site.register(ItemMovement)
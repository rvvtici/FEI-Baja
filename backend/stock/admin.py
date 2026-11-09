from django.contrib import admin
from .models import Category, Item, ItemMovement, LabelSheetTemplate


class ItemAdmin(admin.ModelAdmin):
    # Etiquetas impressas apontam para o código: depois de criado ele não muda
    def get_readonly_fields(self, request, obj=None):
        return ('code',) if obj and obj.code else ()


admin.site.register(Category)
admin.site.register(Item, ItemAdmin)
admin.site.register(ItemMovement)
admin.site.register(LabelSheetTemplate)

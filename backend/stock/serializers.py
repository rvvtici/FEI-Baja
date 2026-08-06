from rest_framework import serializers
from .models import Item, Category, ItemMovement, User

class ItemSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField() # @property do modelo Item
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Item
        fields = ['id', 'code', 'name', 'category', 'category_name', 'qty', 'minimum_qty', 'barcode', 'status'] # Campos que o next.js vai receber do backend

class ItemMovementSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)

    class Meta:
        model = ItemMovement
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
from rest_framework import serializers
from .models import Item, Category, ItemMovement, User

class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    status = serializers.CharField(source='status_count', read_only=True)

    class Meta:
        model = Item
        fields = [
            'id', 
            'code', 
            'name', 
            'category', 
            'category_name', 
            'qty', 
            'minimum_qty', 
            'barcode', 
            'status'
            ] # Campos que o next.js vai receber do backend

class ItemMovementSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_code = serializers.CharField(source='item.code', read_only=True)
    item_category_name = serializers.CharField(source='item.category.name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)

    class Meta:
        model = ItemMovement
        fields = [
            'id', 
            'item', 
            'item_name', 
            'item_code', 
            'item_category_name',
            'user', 
            'user_name',
            'type', 
            'type_display', 
            'reason', 
            'reason_display', 
            'quantity', 
            'observations', 
            'date'
        ]

    read_only_fields = ['user']

class CategorySerializer(serializers.ModelSerializer):
    next_code = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = "__all__"

    def get_next_code(self, obj):
        last_item = Item.objects.filter(category=obj, code__startswith=obj.code_prefix).order_by('-code').first()

        if last_item:
            try:
                num = int(last_item.code[len(obj.code_prefix):]) + 1
                return f"{obj.code_prefix}{num:03d}"
            except ValueError:
                return None
        else:
            return f"{obj.code_prefix}001"

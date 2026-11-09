from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from .label_layout import GEOMETRY_FIELDS, sheet_geometry_errors
from .models import Item, Category, ItemMovement, LabelSheetTemplate, normalize_item_code

# O PDF é gerado dentro da própria requisição: limite para ela continuar rápida
MAX_LABELS_PER_REQUEST = 500

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

    def validate_code(self, value):
        current = self.instance.code if self.instance else ''

        # Etiquetas impressas apontam para o código: depois de criado ele não muda
        if current:
            if value != current:
                raise serializers.ValidationError("O código não pode ser alterado depois que o item é criado.")
            return value

        try:
            code = normalize_item_code(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.messages)

        if code:
            same_code = Item.objects.filter(code__iexact=code)
            if self.instance:
                same_code = same_code.exclude(pk=self.instance.pk)
            if same_code.exists():
                raise serializers.ValidationError(f"Já existe um item com o código {code}.")
        return code

class ItemMovementSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_code = serializers.CharField(source='item.code', read_only=True)
    item_category_name = serializers.CharField(source='item.category.name', read_only=True)
    available_qty = serializers.CharField(source='item.qty', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
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
            'action', 
            'action_display', 
            'reason', 
            'reason_display', 
            'quantity', 
            'available_qty',
            'observations', 
            'date'
        ]
        read_only_fields = ['user']  # definido no servidor a partir do usuário logado

class LabelSheetTemplateSerializer(serializers.ModelSerializer):
    labels_per_sheet = serializers.IntegerField(read_only=True)

    class Meta:
        model = LabelSheetTemplate
        fields = "__all__"

    def validate(self, attrs):
        # Em PATCH só vem parte dos campos: completa com o que já está salvo (ou com o padrão do modelo)
        values = {}
        for field in GEOMETRY_FIELDS:
            if field in attrs:
                values[field] = attrs[field]
            elif self.instance:
                values[field] = getattr(self.instance, field)
            else:
                values[field] = LabelSheetTemplate._meta.get_field(field).get_default()

        errors = sheet_geometry_errors(values)
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class LabelPdfItemSerializer(serializers.Serializer):
    item = serializers.IntegerField(min_value=1)
    copies = serializers.IntegerField(min_value=1, max_value=MAX_LABELS_PER_REQUEST, default=1)


class LabelPdfRequestSerializer(serializers.Serializer):
    template = serializers.PrimaryKeyRelatedField(queryset=LabelSheetTemplate.objects.all())
    items = LabelPdfItemSerializer(many=True, allow_empty=False)
    # Para reaproveitar uma folha já usada: 1 = primeira etiqueta, contando da esquerda
    # para a direita e de cima para baixo
    start_position = serializers.IntegerField(min_value=1, default=1)

    def validate_template(self, template):
        if not template.active:
            raise serializers.ValidationError("Este modelo de folha está inativo.")
        return template

    def validate(self, attrs):
        per_sheet = attrs["template"].labels_per_sheet
        if attrs["start_position"] > per_sheet:
            raise serializers.ValidationError(
                {"start_position": f"A posição inicial deve ficar entre 1 e {per_sheet} neste modelo de folha."}
            )

        total = sum(entry["copies"] for entry in attrs["items"])
        if total > MAX_LABELS_PER_REQUEST:
            raise serializers.ValidationError(
                {"items": f"São {total} etiquetas; o máximo por PDF é {MAX_LABELS_PER_REQUEST}. Divida em mais de um."}
            )
        return attrs


class CategorySerializer(serializers.ModelSerializer):
    next_code = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = "__all__"

    def validate_code_prefix(self, value):
        # O código automático do item é prefixo + número: o prefixo segue a mesma regra do código
        if self.instance and value == self.instance.code_prefix:
            return value
        try:
            return normalize_item_code(value)
        except DjangoValidationError:
            raise serializers.ValidationError(
                "O prefixo só pode ter letras sem acento, números, hífen (-) e sublinhado (_). Ex.: ELT"
            )

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

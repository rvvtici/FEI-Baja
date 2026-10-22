from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer

from .models import CustomUser
from .roles import ROLES


class CustomUserSerializer(ModelSerializer):
    role = serializers.CharField(read_only=True)
    is_fixed_admin = serializers.BooleanField(source="is_superuser", read_only=True)
    can_register_items = serializers.SerializerMethodField()
    can_view_logs = serializers.SerializerMethodField()
    can_manage_users = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = (
            "id", "email", "username", "first_name", "last_name", "role", "is_fixed_admin",
            "can_register_items", "can_view_logs", "can_manage_users",
        )

    def get_can_register_items(self, obj):
        return obj.has_perm("stock.add_item")

    def get_can_view_logs(self, obj):
        return obj.has_perm("stock.view_logs")

    def get_can_manage_users(self, obj):
        return obj.has_perm("users.manage_users")


class UserListSerializer(CustomUserSerializer):
    is_self = serializers.SerializerMethodField()

    class Meta(CustomUserSerializer.Meta):
        fields = CustomUserSerializer.Meta.fields + ("is_self",)

    def get_is_self(self, obj):
        return obj.pk == self.context["request"].user.pk


class UserRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=ROLES)


class RegisterUserSerializer(ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ("email", "username", "first_name", "last_name", "password")
        extra_kwargs = {
            "password": {"write_only": True},
            "first_name": {"required": True, "allow_blank": False},
            "last_name": {"required": True, "allow_blank": False},
        }
    def validate_username(self, value):
        if "@" in value:
            raise serializers.ValidationError("O username não pode conter @")
        return value
        
    def create(self, validated_data):
        return CustomUser.objects.create_user(**validated_data)


class LoginUserSerializer(serializers.Serializer):
    identifier = serializers.CharField()  # email ou username
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(
            request=self.context.get("request"),
            username=data["identifier"],
            password=data["password"],
        )
        if user is None or not user.is_active:
            raise serializers.ValidationError("Credenciais incorretas")
        data["user"] = user
        return data
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer

from .models import CustomUser


class CustomUserSerializer(ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ("id", "email", "username")


class RegisterUserSerializer(ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ("email", "username", "password")
        extra_kwargs = {"password": {"write_only": True}}

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
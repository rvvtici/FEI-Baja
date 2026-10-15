from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend


class EmailOrUsernameBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()

        # aceita authenticate(email=...) também
        identifier = username or kwargs.get("email")
        if identifier is None or password is None:
            return None

        # tenta email primeiro, depois username
        user = (
            UserModel.objects.filter(email__iexact=identifier).first()
            or UserModel.objects.filter(username__iexact=identifier).first()
        )

        if user is None:
            UserModel().set_password(password)  # evita diferença de tempo na resposta
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
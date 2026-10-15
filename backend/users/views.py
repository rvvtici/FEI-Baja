from django.conf import settings
from rest_framework import status
from rest_framework.generics import RetrieveUpdateAPIView, CreateAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework_simplejwt.views import TokenRefreshView


from .serializers import (
    CustomUserSerializer,
    RegisterUserSerializer,
    LoginUserSerializer,
)

ACCESS_MAX_AGE = 60 * 5
REFRESH_MAX_AGE = 60 * 60 * 24 * 30


def _cookie_kwargs():
    return {
        "httponly": True,
        "secure": not settings.DEBUG,
        "samesite": "Lax" if settings.DEBUG else "None",
        "path": "/",
    }


class UserInfoView(RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = CustomUserSerializer

    def get_object(self):
        return self.request.user


class UserRegistrationView(CreateAPIView):
    serializer_class = RegisterUserSerializer


class LoginView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = ()  # evita checar cookie antigo/expirado no login

    def post(self, request):
        serializer = LoginUserSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            user = serializer.validated_data["user"]
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            response = Response(
                {"user": CustomUserSerializer(user).data},
                status=status.HTTP_200_OK,
            )
            response.set_cookie("access_token", access_token, max_age=ACCESS_MAX_AGE, **_cookie_kwargs())
            response.set_cookie("refresh_token", str(refresh), max_age=REFRESH_MAX_AGE, **_cookie_kwargs())
            return response

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = ()

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass  # token já inválido/expirado: segue e limpa os cookies

        response = Response({"message": "successfully logged out"}, status=status.HTTP_200_OK)
        samesite = _cookie_kwargs()["samesite"]
        response.delete_cookie("access_token", path="/", samesite=samesite)
        response.delete_cookie("refresh_token", path="/", samesite=samesite)
        return response

class CookieTokenRefreshView(TokenRefreshView):
    authentication_classes = ()

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            return Response({"error": "refresh token not provided"}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
        except TokenError:
            return Response({"error": "invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

        response = Response({"message": "access token refreshed successfully"}, status=status.HTTP_200_OK)
        response.set_cookie("access_token", access_token, max_age=ACCESS_MAX_AGE, **_cookie_kwargs())
        return response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        token = request.COOKIES.get("access_token")
        if not token:
            return None

        try:
            validated_token = self.get_validated_token(token)
        except AuthenticationFailed as e:
            raise AuthenticationFailed(f"token auth failed: {str(e)}")

        refresh_jti = validated_token.get("refresh_jti")
        if refresh_jti and BlacklistedToken.objects.filter(token__jti=refresh_jti).exists():
            raise AuthenticationFailed("session was logged out")

        user = self.get_user(validated_token)
        return user, validated_token
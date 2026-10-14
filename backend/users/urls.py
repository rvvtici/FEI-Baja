from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserInfoView, UserRegistrationView

urlpatterns = [
    path("user-info/", UserInfoView.as_view(), name="user-info"),
    path("register/", UserRegistrationView.as_view(), name="register-user"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
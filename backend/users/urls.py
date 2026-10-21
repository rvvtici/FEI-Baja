from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    UserInfoView, UserRegistrationView, LogoutView, LoginView, CookieTokenRefreshView,
    UserListView, UserRoleUpdateView,
)

urlpatterns = [
    path("", UserListView.as_view(), name="user-list"),
    path("<int:pk>/role/", UserRoleUpdateView.as_view(), name="user-role"),
    path("user-info/", UserInfoView.as_view(), name="user-info"),
    path("register/", UserRegistrationView.as_view(), name="register-user"),
    path("token/refresh/", CookieTokenRefreshView.as_view(), name="token-refresh"),
    path("login/", LoginView.as_view(), name="user-login"),
    path("logout/", LogoutView.as_view(), name="user-logout"),
]

from django.urls import include, path
from . import views
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import ItemViewSet, ItemMovementViewSet
from django.contrib import admin

# servidor -> processa requisicoes e retorna uma response
# cliente -> request ao server


router = DefaultRouter()

router.register(r'itens', ItemViewSet, basename='item')
router.register(r'movimentacoes', ItemMovementViewSet, basename='itemmovement')
router.register(r'categorias', views.CategoryViewSet, basename='category')

urlpatterns = [
    path('ferramentas', views.view_ferramentas, name="view_ferramentas"),
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # path('admin/', admin.site.urls)

]
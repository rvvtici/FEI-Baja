from django.urls import path
from . import views
from django.contrib import admin

# servidor -> processa requisicoes e retorna uma response
# cliente -> request ao server


urlpatterns = [
    path('ferramentas', views.view_ferramentas, name="view_ferramentas"),
    # path('admin/', admin.site.urls)

]
from django.urls import path
from . import views


urlpatterns = [
    path('ferramentas', views.view_ferramentas, name="view_ferramentas")
]
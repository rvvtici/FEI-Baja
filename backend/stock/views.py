from django.shortcuts import render
from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser, IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import Item, ItemMovement, Category, User, Pessoa
from .serializers import ItemSerializer, ItemMovementSerializer, CategorySerializer

# Create your views here.

def view_ferramentas(request):
    # teste = "oi"
    # return render (request, 'produtos.html', {"teste":teste}) #(requisicao do usuario, caminho p url, context)
    # return render (request, '.../frontend/app/page.tsx', {"teste":teste}) #(requisicao do usuario, caminho p url, context)
    if request.method == "GET":
        nome = 'ravi'


        return render(request, 'produtos.html', {"nome":nome})
    elif request.method == "POST":
        nome=request.POST.get('nome')
        idade=request.POST.get('idade')

        pessoa = Pessoa(nome=nome, idade=idade) #from models
        
        pessoas = Pessoa.objects.filter(nome=nome)
        if pessoas.exists():
            return HttpResponse("user já cadastrado")
        else:
            pessoa.save()
        

        return HttpResponse(pessoas)

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status_count=status_filter)

        return queryset

class ItemMovementViewSet(viewsets.ModelViewSet):
    queryset = ItemMovement.objects.all()
    serializer_class = ItemMovement

    permisssion_classes = [IsAuthenticated]

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    permission_classes = [IsAdminUser]
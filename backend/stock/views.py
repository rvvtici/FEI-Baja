from django.shortcuts import render
from django.http import HttpResponse
from .models import Pessoa

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
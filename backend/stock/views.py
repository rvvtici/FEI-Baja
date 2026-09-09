from django.shortcuts import render
from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated, IsAuthenticatedOrReadOnly
from .models import Item, ItemMovement, Category, User
from .serializers import ItemSerializer, ItemMovementSerializer, CategorySerializer
from django.contrib.auth import authenticate
from rest_framework.views import APIView


# Create your views here.


#AllowAny somente para teste, depois mudar para IsAuthenticated/IsAdminUser
class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()

        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status_count=status_filter)

        return queryset

class ItemMovementViewSet(viewsets.ModelViewSet):
    queryset = ItemMovement.objects.all()
    serializer_class = ItemMovementSerializer

    permission_classes = [AllowAny]

#Descomentar somente quando tokens estiverem funcionando normalmente
    # def perform_create(self, serializer):
        # serializer.save(user=self.request.user)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    permission_classes = [AllowAny]


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password']
        )
        
        if user is None:
            return Response({"detail": "Credenciais inválidas"}, status=401)

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })
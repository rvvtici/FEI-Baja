from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import Item, ItemMovement, Category
from .serializers import ItemSerializer, ItemMovementSerializer, CategorySerializer


# AllowAny somente para teste, depois mudar para IsAuthenticated/IsAdminUser
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

    # Descomentar somente quando tokens estiverem funcionando normalmente
    # def perform_create(self, serializer):
    #     serializer.save(user=self.request.user)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
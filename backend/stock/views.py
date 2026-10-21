from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions

from .models import Item, ItemMovement, Category
from .serializers import ItemSerializer, ItemMovementSerializer, CategorySerializer


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    # Read livre para todos usuários, restante do CRUD exige Admin
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def get_queryset(self):
        queryset = super().get_queryset()

        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status_count=status_filter)

        code_filter = self.request.query_params.get('code', '').strip()
        if code_filter:
            queryset = queryset.filter(code__iexact=code_filter)

        return queryset


class ItemMovementViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    # Movimentações devem ser IMUTÁVEIS, caso necessidade de alterar, criar uma nova movimentação no sentido oposto.
    queryset = ItemMovement.objects.all()
    serializer_class = ItemMovementSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    # Read livre para todos usuários, restante do CRUD exige Admin
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

from django.conf import settings
from django.http import HttpResponse
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import CanManageLabels
from .label_layout import sheet_values
from .label_pdf import build_calibration_pdf, build_labels_pdf, item_label_url
from .models import Item, ItemMovement, Category, LabelSheetTemplate
from .serializers import (
    ItemSerializer, ItemMovementSerializer, CategorySerializer, LabelSheetTemplateSerializer,
    LabelPdfRequestSerializer,
)


class LabelSheetTemplateViewSet(viewsets.ModelViewSet):
    # Etiquetas são exclusivas de Admin, inclusive a leitura
    queryset = LabelSheetTemplate.objects.all()
    serializer_class = LabelSheetTemplateSerializer
    permission_classes = [IsAuthenticated, CanManageLabels]

    @action(detail=True, methods=["get"], url_path="calibracao")
    def calibration(self, request, pk=None):
        # Folha de teste: funciona também para modelo inativo, que se calibra antes de ativar
        template = self.get_object()
        pdf = build_calibration_pdf(sheet_values(template), template.name)
        return pdf_response(pdf, "calibracao.pdf")


def pdf_response(content, filename):
    response = HttpResponse(content, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename="{filename}"'
    return response


class LabelPdfView(APIView):
    """Gera o PDF de etiquetas com QR. Corpo: {template, items: [{item, copies}], start_position}."""
    permission_classes = (IsAuthenticated, CanManageLabels)

    def post(self, request):
        if not settings.FRONTEND_URL:
            return Response(
                {"error": "FRONTEND_URL não está configurada no servidor: sem ela o QR não tem para onde apontar."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        serializer = LabelPdfRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        requested = [entry["item"] for entry in data["items"]]
        items = Item.objects.in_bulk(requested)

        missing = sorted(set(requested) - set(items))
        if missing:
            return Response(
                {"error": "Itens não encontrados.", "missing_items": missing},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Sem código não há URL para o QR: recusa tudo em vez de imprimir etiqueta quebrada
        without_code = [item for item in items.values() if not (item.code or "").strip()]
        if without_code:
            return Response(
                {
                    "error": "Há itens sem código. Cadastre o código antes de imprimir a etiqueta.",
                    "items_without_code": [
                        {"id": item.pk, "name": item.name} for item in sorted(without_code, key=lambda i: i.pk)
                    ],
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        labels = []
        for entry in data["items"]:
            item = items[entry["item"]]
            label = (item_label_url(settings.FRONTEND_URL, item.code), item.code, item.name)
            labels.extend([label] * entry["copies"])

        pdf = build_labels_pdf(sheet_values(data["template"]), labels, data["start_position"])
        return pdf_response(pdf, "etiquetas.pdf")


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

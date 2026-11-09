import re
from decimal import Decimal
from importlib import import_module
from unittest.mock import patch

from django.apps import apps as django_apps
from django.core.exceptions import ValidationError
from django.contrib.auth.models import Group
from django.test import SimpleTestCase, TestCase, override_settings
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate
from rest_framework.views import APIView

from users.models import CustomUser
from users.permissions import CanViewLogs
from users.roles import ADMIN, MEMBER, set_role
from .label_layout import label_slots, pdf_bottom_mm
from .label_pdf import fit_label_text, item_label_url, label_boxes, qr_matrix
from .models import Category, Item, ItemMovement, LabelSheetTemplate


class LogsProbeView(APIView):
    # Ainda não existe endpoint de logs: testa a regra que ele vai usar
    permission_classes = (IsAuthenticated, CanViewLogs)

    def get(self, request):
        return Response({"ok": True})


class AccessTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.fixed_admin = CustomUser.objects.create_superuser("root@baja.com", "senha123", username="root")
        self.admin = CustomUser.objects.create_user("admin@baja.com", "senha123", username="admin")
        self.member = CustomUser.objects.create_user("membro@baja.com", "senha123", username="membro")
        set_role(self.admin, ADMIN, acting_user=self.fixed_admin)

        self.category = Category.objects.create(name="Mecânica", code_prefix="MO")
        self.item = Item.objects.create(
            item_type="MATERIAL", name="Chapa", category=self.category, qty=10, dimensions="1x1",
        )

    def new_item(self, name="Tubo"):
        return {"item_type": "MATERIAL", "name": name, "category": self.category.pk, "dimensions": "2x2"}

    def new_movement(self, **extra):
        return {"item": self.item.pk, "action": "OUT", "reason": "USAGE", "quantity": 1, **extra}

    def logs_status(self, user):
        request = APIRequestFactory().get("/logs/")
        force_authenticate(request, user=user)
        return LogsProbeView.as_view()(request).status_code

    def test_anonymous_gets_401_everywhere(self):
        item_url = f"/api/itens/{self.item.pk}/"
        category_url = f"/api/categorias/{self.category.pk}/"
        requests = [
            ("get", "/api/", None),
            ("get", "/api/itens/", None),
            ("post", "/api/itens/", self.new_item()),
            ("get", item_url, None),
            ("patch", item_url, {"name": "X"}),
            ("delete", item_url, None),
            ("get", "/api/categorias/", None),
            ("post", "/api/categorias/", {"name": "Elétrica", "code_prefix": "ELT"}),
            ("get", category_url, None),
            ("patch", category_url, {"name": "X"}),
            ("delete", category_url, None),
            ("get", "/api/movimentacoes/", None),
            ("post", "/api/movimentacoes/", self.new_movement()),
            ("get", "/api/users/", None),
            ("patch", f"/api/users/{self.member.pk}/role/", {"role": ADMIN}),
            ("get", "/api/users/user-info/", None),
        ]
        for method, url, body in requests:
            with self.subTest(method=method, url=url):
                resp = getattr(self.client, method)(url, body, format="json")
                self.assertEqual(resp.status_code, 401)

        request = APIRequestFactory().get("/logs/")
        self.assertEqual(LogsProbeView.as_view()(request).status_code, 401)

    def test_simplejwt_token_endpoints_stay_public(self):
        resp = self.client.post("/api/token/", {"email": "membro@baja.com", "password": "senha123"})
        self.assertEqual(resp.status_code, 200)
        resp = self.client.post("/api/token/refresh/", {"refresh": resp.json()["refresh"]})
        self.assertEqual(resp.status_code, 200)

    def test_public_auth_endpoints_work_without_session(self):
        resp = self.client.post("/api/users/register/", {
            "email": "novo@baja.com", "username": "novo", "password": "senha123",
        })
        self.assertEqual(resp.status_code, 201)

        resp = self.client.post("/api/users/login/", {"identifier": "novo", "password": "senha123"})
        self.assertEqual(resp.status_code, 200)
        self.assertIn("refresh_token", resp.cookies)

        # só o cookie de refresh, sem access válido
        self.client.cookies.pop("access_token")
        self.assertEqual(self.client.post("/api/users/token/refresh/").status_code, 200)
        self.assertEqual(self.client.get("/api/users/user-info/").status_code, 200)

        self.assertEqual(self.client.post("/api/users/logout/").status_code, 200)

    def test_item_lookup_by_code(self):
        self.client.force_authenticate(self.member)
        Item.objects.create(item_type="MATERIAL", name="Tubo", category=self.category, dimensions="2x2")

        for value in (self.item.code, self.item.code.lower(), f" {self.item.code} "):
            with self.subTest(value=value):
                resp = self.client.get("/api/itens/", {"code": value})
                self.assertEqual([i["id"] for i in resp.json()], [self.item.pk])

        self.assertEqual(self.client.get("/api/itens/", {"code": "NAOEXISTE"}).json(), [])

    def test_member_permissions(self):
        self.client.force_authenticate(self.member)

        for url in ("/api/itens/", "/api/categorias/", "/api/movimentacoes/", "/api/users/user-info/"):
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 200)
        self.assertEqual(self.client.post("/api/movimentacoes/", self.new_movement(), format="json").status_code, 201)

        forbidden = [
            ("post", "/api/itens/", self.new_item()),
            ("patch", f"/api/itens/{self.item.pk}/", {"name": "X"}),
            ("delete", f"/api/itens/{self.item.pk}/", None),
            ("post", "/api/categorias/", {"name": "Elétrica", "code_prefix": "ELT"}),
            ("patch", f"/api/categorias/{self.category.pk}/", {"name": "X"}),
            ("delete", f"/api/categorias/{self.category.pk}/", None),
            ("get", "/api/users/", None),
            ("patch", f"/api/users/{self.admin.pk}/role/", {"role": "Membro"}),
        ]
        for method, url, body in forbidden:
            with self.subTest(method=method, url=url):
                resp = getattr(self.client, method)(url, body, format="json")
                self.assertEqual(resp.status_code, 403)

        self.assertEqual(self.logs_status(self.member), 403)

    def test_admin_permissions(self):
        self.client.force_authenticate(self.admin)

        for url in ("/api/itens/", "/api/categorias/", "/api/movimentacoes/", "/api/users/"):
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 200)
        self.assertEqual(self.client.post("/api/movimentacoes/", self.new_movement(), format="json").status_code, 201)

        self.assertEqual(self.client.post("/api/itens/", self.new_item(), format="json").status_code, 201)
        self.assertEqual(self.client.patch(f"/api/itens/{self.item.pk}/", {"name": "Chapa 2"}).status_code, 200)
        resp = self.client.post("/api/categorias/", {"name": "Elétrica", "code_prefix": "ELT"})
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(self.client.patch(f"/api/categorias/{resp.json()['id']}/", {"name": "Elet"}).status_code, 200)
        self.assertEqual(self.client.delete(f"/api/categorias/{resp.json()['id']}/").status_code, 204)
        self.assertEqual(self.client.patch(f"/api/users/{self.member.pk}/role/", {"role": ADMIN}).status_code, 200)

        self.assertEqual(self.logs_status(self.admin), 200)

    def test_movements_are_immutable(self):
        movement = ItemMovement.objects.create(item=self.item, user=self.member, action="OUT", quantity=2)
        url = f"/api/movimentacoes/{movement.pk}/"

        for user in (self.member, self.admin, self.fixed_admin):
            self.client.force_authenticate(user)
            self.assertEqual(self.client.get(url).status_code, 200)
            for method in ("put", "patch", "delete"):
                with self.subTest(user=user.username, method=method):
                    resp = getattr(self.client, method)(url, {"quantity": 1}, format="json")
                    self.assertEqual(resp.status_code, 405)

        movement.refresh_from_db()
        self.item.refresh_from_db()
        self.assertEqual(movement.quantity, 2)
        self.assertEqual(self.item.qty, 8)

    def test_correction_is_an_opposite_movement(self):
        self.client.force_authenticate(self.member)
        self.client.post("/api/movimentacoes/", self.new_movement(quantity=3), format="json")
        resp = self.client.post("/api/movimentacoes/", self.new_movement(action="IN", quantity=3), format="json")
        self.assertEqual(resp.status_code, 201)
        self.item.refresh_from_db()
        self.assertEqual(self.item.qty, 10)
        self.assertEqual(ItemMovement.objects.count(), 2)

    def test_new_code_is_normalized(self):
        self.client.force_authenticate(self.admin)
        resp = self.client.post("/api/itens/", {**self.new_item(), "code": "  elt-01_a "}, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()["code"], "ELT-01_A")

        # sem código: continua sendo gerado pelo prefixo da categoria
        resp = self.client.post("/api/itens/", self.new_item("Barra"), format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()["code"], "MO002")

    def test_category_prefix_is_normalized(self):
        self.client.force_authenticate(self.admin)
        resp = self.client.post("/api/categorias/", {"name": "Elétrica", "code_prefix": "elt"}, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()["code_prefix"], "ELT")

        # item sem código nessa categoria nasce com o prefixo em maiúsculas
        item = {**self.new_item("Fio"), "category": resp.json()["id"]}
        self.assertEqual(self.client.post("/api/itens/", item, format="json").json()["code"], "ELT001")

        resp = self.client.post("/api/categorias/", {"name": "Outra", "code_prefix": "a b"}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("code_prefix", resp.json())

        # prefixo antigo fora do padrão não impede editar o resto da categoria
        Category.objects.filter(pk=self.category.pk).update(code_prefix="mo")
        url = f"/api/categorias/{self.category.pk}/"
        self.assertEqual(self.client.patch(url, {"name": "Mec", "code_prefix": "mo"}, format="json").status_code, 200)
        self.assertEqual(self.client.patch(url, {"code_prefix": "m?"}, format="json").status_code, 400)

    def test_new_code_with_invalid_characters_is_refused(self):
        self.client.force_authenticate(self.admin)
        for code in ("MO 01", "MO/01", "MO&01", "MOÇ01", "MO.01"):
            with self.subTest(code=code):
                resp = self.client.post("/api/itens/", {**self.new_item(), "code": code}, format="json")
                self.assertEqual(resp.status_code, 400)
                self.assertIn("code", resp.json())
        self.assertEqual(Item.objects.count(), 1)

    def test_new_code_cannot_differ_only_by_case(self):
        self.client.force_authenticate(self.admin)
        Item.objects.filter(pk=self.item.pk).update(code="mo001")  # código antigo, em minúsculas
        resp = self.client.post("/api/itens/", {**self.new_item(), "code": "MO001"}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("code", resp.json())

    def test_code_is_locked_after_creation(self):
        self.client.force_authenticate(self.admin)
        url = f"/api/itens/{self.item.pk}/"
        original = self.item.code

        for code in ("MO999", original.lower(), ""):
            with self.subTest(code=code):
                resp = self.client.patch(url, {"code": code}, format="json")
                self.assertEqual(resp.status_code, 400)
                self.assertIn("code", resp.json())

        # reenviar o mesmo código (ex.: PUT do objeto inteiro) não é mudança
        resp = self.client.patch(url, {"code": original, "name": "Chapa 3"}, format="json")
        self.assertEqual(resp.status_code, 200)

        self.item.refresh_from_db()
        self.assertEqual(self.item.code, original)
        self.assertEqual(self.item.name, "Chapa 3")

    def test_existing_odd_code_stays_untouched_on_update(self):
        self.client.force_authenticate(self.admin)
        Item.objects.filter(pk=self.item.pk).update(code="mo 1")
        resp = self.client.patch(f"/api/itens/{self.item.pk}/", {"name": "Chapa 4", "code": "mo 1"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.code, "mo 1")

    def test_movement_user_comes_from_session(self):
        self.client.force_authenticate(self.member)
        resp = self.client.post("/api/movimentacoes/", self.new_movement(user=self.admin.pk), format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()["user"], self.member.pk)
        self.assertEqual(ItemMovement.objects.get(pk=resp.json()["id"]).user, self.member)


class LabelSheetTemplateTests(TestCase):
    URL = "/api/etiquetas/modelos/"

    def setUp(self):
        self.client = APIClient()
        self.fixed_admin = CustomUser.objects.create_superuser("root@baja.com", "senha123", username="root")
        self.admin = CustomUser.objects.create_user("admin@baja.com", "senha123", username="admin")
        self.member = CustomUser.objects.create_user("membro@baja.com", "senha123", username="membro")
        set_role(self.admin, ADMIN, acting_user=self.fixed_admin)
        self.template = LabelSheetTemplate.objects.get(name__startswith="Pimaco A4256")

    def new_template(self, **extra):
        return {
            "name": "Teste 2x3", "columns": 2, "rows": 3,
            "label_width_mm": "90.00", "label_height_mm": "50.00",
            "margin_top_mm": "10.00", "margin_left_mm": "10.00",
            "pitch_x_mm": "95.00", "pitch_y_mm": "55.00",
            **extra,
        }

    def all_requests(self):
        detail = f"{self.URL}{self.template.pk}/"
        return [
            ("get", self.URL, None),
            ("post", self.URL, self.new_template()),
            ("get", detail, None),
            ("put", detail, self.new_template()),
            ("patch", detail, {"offset_x_mm": "1.00"}),
            ("delete", detail, None),
        ]

    def test_admin_group_has_manage_labels_after_migrate(self):
        admin_group = Group.objects.get(name=ADMIN)
        self.assertTrue(
            admin_group.permissions.filter(content_type__app_label="stock", codename="manage_labels").exists()
        )
        self.assertFalse(Group.objects.get(name=MEMBER).permissions.exists())
        self.assertTrue(self.admin.has_perm("stock.manage_labels"))
        self.assertTrue(self.fixed_admin.has_perm("stock.manage_labels"))
        self.assertFalse(self.member.has_perm("stock.manage_labels"))

    def test_member_gets_403_everywhere(self):
        self.client.force_authenticate(self.member)
        for method, url, body in self.all_requests():
            with self.subTest(method=method, url=url):
                self.assertEqual(getattr(self.client, method)(url, body, format="json").status_code, 403)

        self.template.refresh_from_db()
        self.assertEqual(self.template.offset_x_mm, 0)
        self.assertEqual(LabelSheetTemplate.objects.count(), 2)

    def test_anonymous_gets_401_everywhere(self):
        for method, url, body in self.all_requests():
            with self.subTest(method=method, url=url):
                self.assertEqual(getattr(self.client, method)(url, body, format="json").status_code, 401)

    def test_user_info_flag(self):
        for user, expected in ((self.member, False), (self.admin, True), (self.fixed_admin, True)):
            self.client.force_authenticate(user)
            self.assertEqual(self.client.get("/api/users/user-info/").json()["can_manage_labels"], expected)

    def test_seed_templates(self):
        self.client.force_authenticate(self.admin)
        templates = self.client.get(self.URL).json()
        self.assertEqual(
            [(t["name"][:12], t["columns"], t["rows"], t["labels_per_sheet"]) for t in templates],
            [("Pimaco A4256", 3, 11, 33), ("Pimaco A4362", 2, 8, 16)],
        )
        for template in LabelSheetTemplate.objects.all():
            with self.subTest(template=template.name):
                self.assertIn("conferir com régua", template.notes)
                template.full_clean()  # as medidas do seed respeitam a validação da grade

    def test_admin_crud(self):
        self.client.force_authenticate(self.admin)

        resp = self.client.post(self.URL, self.new_template(), format="json")
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["page_width_mm"], "210.00")
        self.assertEqual(data["offset_x_mm"], "0.00")
        self.assertEqual(data["inner_padding_mm"], "1.50")
        self.assertTrue(data["active"])
        detail = f"{self.URL}{data['id']}/"

        resp = self.client.patch(detail, {"offset_x_mm": "-0.75", "offset_y_mm": "1.25"}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual((resp.json()["offset_x_mm"], resp.json()["offset_y_mm"]), ("-0.75", "1.25"))

        self.assertEqual(self.client.get(detail).status_code, 200)
        self.assertEqual(self.client.delete(detail).status_code, 204)

    def test_grid_must_fit_the_page(self):
        self.client.force_authenticate(self.admin)
        cases = [
            # 10 + 1*120 + 90 = 220 > 210
            ({"pitch_x_mm": "120.00"}, "page_width_mm"),
            # 10 + 5*55 + 50 = 335 > 297
            ({"rows": 6}, "page_height_mm"),
            ({"pitch_x_mm": "89.99"}, "pitch_x_mm"),
            ({"pitch_y_mm": "49.99"}, "pitch_y_mm"),
            ({"inner_padding_mm": "25.00"}, "inner_padding_mm"),
            ({"label_width_mm": "0"}, "label_width_mm"),
            ({"columns": 0}, "columns"),
            ({"margin_top_mm": "-1"}, "margin_top_mm"),
        ]
        for extra, field in cases:
            with self.subTest(extra=extra):
                resp = self.client.post(self.URL, self.new_template(**extra), format="json")
                self.assertEqual(resp.status_code, 400)
                self.assertIn(field, resp.json())
        self.assertEqual(LabelSheetTemplate.objects.count(), 2)

        # limite exato cabe: 10 + 1*110 + 90 = 210
        resp = self.client.post(self.URL, self.new_template(pitch_x_mm="110.00"), format="json")
        self.assertEqual(resp.status_code, 201)

    def test_seed_measures_match_manufacturer_table(self):
        a4256 = LabelSheetTemplate.objects.get(name__startswith="Pimaco A4256")
        a4362 = LabelSheetTemplate.objects.get(name__startswith="Pimaco A4362")
        fields = ("margin_top_mm", "margin_left_mm", "pitch_y_mm", "pitch_x_mm", "label_height_mm", "label_width_mm")
        self.assertEqual(
            [str(getattr(a4256, f)) for f in fields], ["8.80", "7.20", "25.40", "66.10", "25.40", "63.50"],
        )
        self.assertEqual(
            [str(getattr(a4362, f)) for f in fields], ["12.90", "4.70", "33.90", "101.60", "33.90", "99.00"],
        )

    def test_offsets_are_limited_to_15_mm(self):
        self.client.force_authenticate(self.admin)
        detail = f"{self.URL}{self.template.pk}/"

        for field in ("offset_x_mm", "offset_y_mm"):
            for value in ("15.01", "-15.01", "40"):
                with self.subTest(field=field, value=value):
                    resp = self.client.patch(detail, {field: value}, format="json")
                    self.assertEqual(resp.status_code, 400)
                    self.assertIn(field, resp.json())
            for value in ("15.00", "-15.00"):
                with self.subTest(field=field, value=value):
                    self.assertEqual(self.client.patch(detail, {field: value}, format="json").status_code, 200)

        # mesma regra no clean() do modelo (Django admin)
        self.template.offset_x_mm = Decimal("15.01")
        with self.assertRaises(ValidationError) as ctx:
            self.template.full_clean()
        self.assertIn("offset_x_mm", ctx.exception.message_dict)

    def test_partial_update_is_validated_against_saved_values(self):
        self.client.force_authenticate(self.admin)
        detail = f"{self.URL}{self.template.pk}/"
        resp = self.client.patch(detail, {"columns": 4}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("page_width_mm", resp.json())
        self.template.refresh_from_db()
        self.assertEqual(self.template.columns, 3)

    def test_name_is_unique(self):
        self.client.force_authenticate(self.admin)
        resp = self.client.post(self.URL, self.new_template(name=self.template.name), format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("name", resp.json())

    def test_seed_is_idempotent_and_never_overwrites(self):
        migration = import_module("stock.migrations.0011_seed_label_sheet_templates")
        LabelSheetTemplate.objects.filter(pk=self.template.pk).update(
            offset_x_mm="0.80", margin_top_mm="9.10", notes="Conferido",
        )
        LabelSheetTemplate.objects.filter(name__startswith="Pimaco A4362").delete()

        migration.seed(django_apps, None)
        migration.seed(django_apps, None)

        self.assertEqual(LabelSheetTemplate.objects.count(), 2)
        self.template.refresh_from_db()
        self.assertEqual(str(self.template.offset_x_mm), "0.80")
        self.assertEqual(str(self.template.margin_top_mm), "9.10")
        self.assertEqual(self.template.notes, "Conferido")

    def test_reverse_keeps_calibrated_templates(self):
        migration = import_module("stock.migrations.0011_seed_label_sheet_templates")
        LabelSheetTemplate.objects.filter(pk=self.template.pk).update(offset_y_mm="-0.50")

        migration.unseed(django_apps, None)

        self.assertEqual(list(LabelSheetTemplate.objects.values_list("pk", flat=True)), [self.template.pk])


def a4256(**extra):
    # Pimaco A4256: 3 x 11 etiquetas de 63,5 x 25,4 mm em A4
    return {
        "page_width_mm": Decimal("210.00"), "page_height_mm": Decimal("297.00"),
        "columns": 3, "rows": 11,
        "label_width_mm": Decimal("63.50"), "label_height_mm": Decimal("25.40"),
        "margin_top_mm": Decimal("8.80"), "margin_left_mm": Decimal("7.20"),
        "pitch_x_mm": Decimal("66.10"), "pitch_y_mm": Decimal("25.40"),
        "offset_x_mm": Decimal("0.00"), "offset_y_mm": Decimal("0.00"),
        "inner_padding_mm": Decimal("1.50"),
        **extra,
    }


class LabelLayoutTests(SimpleTestCase):
    """Cálculo de posições: funções puras, sem banco e sem PDF."""

    def test_first_and_last_positions(self):
        slots = label_slots(a4256(), 33)
        self.assertEqual([s.position for s in slots], list(range(1, 34)))
        self.assertEqual({s.page for s in slots}, {0})

        first, last = slots[0], slots[-1]
        self.assertEqual((first.row, first.column, first.x_mm, first.top_mm), (0, 0, Decimal("7.20"), Decimal("8.80")))
        # 7,20 + 2 * 66,10 = 139,40 e 8,80 + 10 * 25,40 = 262,80
        self.assertEqual((last.row, last.column, last.x_mm, last.top_mm), (10, 2, Decimal("139.40"), Decimal("262.80")))

    def test_numbering_goes_left_to_right_then_down(self):
        slots = label_slots(a4256(), 5)
        self.assertEqual([(s.row, s.column) for s in slots], [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1)])
        self.assertEqual([s.x_mm for s in slots[:3]], [Decimal("7.20"), Decimal("73.30"), Decimal("139.40")])
        self.assertEqual(slots[3].top_mm, Decimal("34.20"))

    def test_offsets_shift_every_label(self):
        # positivo = para a direita e para baixo
        slots = label_slots(a4256(offset_x_mm=Decimal("0.50"), offset_y_mm=Decimal("-1.25")), 33)
        self.assertEqual((slots[0].x_mm, slots[0].top_mm), (Decimal("7.70"), Decimal("7.55")))
        self.assertEqual((slots[-1].x_mm, slots[-1].top_mm), (Decimal("139.90"), Decimal("261.55")))

    def test_start_position_skips_used_labels(self):
        slots = label_slots(a4256(), 2, start_position=5)
        self.assertEqual([(s.page, s.position, s.row, s.column) for s in slots], [(0, 5, 1, 1), (0, 6, 1, 2)])

    def test_pagination(self):
        slots = label_slots(a4256(), 4, start_position=32)
        self.assertEqual([(s.page, s.position) for s in slots], [(0, 32), (0, 33), (1, 1), (1, 2)])
        # a folha seguinte recomeça no canto, sem herdar a posição inicial
        self.assertEqual((slots[2].x_mm, slots[2].top_mm), (Decimal("7.20"), Decimal("8.80")))

        slots = label_slots(a4256(), 70)
        self.assertEqual([s.page for s in slots].count(0), 33)
        self.assertEqual((slots[-1].page, slots[-1].position), (2, 4))

    def test_start_position_out_of_range(self):
        for start in (0, 34, -1):
            with self.subTest(start=start):
                with self.assertRaises(ValueError):
                    label_slots(a4256(), 1, start_position=start)

    def test_pdf_measures_from_the_bottom(self):
        sheet = a4256()
        slots = label_slots(sheet, 33)
        # 297 - 8,80 - 25,40
        self.assertEqual(pdf_bottom_mm(sheet, slots[0].top_mm), Decimal("262.80"))
        # a última linha fica a 8,80 mm da borda de baixo: a grade é simétrica
        self.assertEqual(pdf_bottom_mm(sheet, slots[-1].top_mm), Decimal("8.80"))

    def test_item_label_url(self):
        self.assertEqual(item_label_url("https://estoque.exemplo.com/", "MO-01_A"), "https://estoque.exemplo.com/i/MO-01_A")
        self.assertEqual(item_label_url("http://localhost:3000", "a b/c"), "http://localhost:3000/i/a%20b%2Fc")

    def test_content_stays_inside_the_padding(self):
        from reportlab.lib.units import mm
        from reportlab.pdfbase.pdfmetrics import stringWidth

        long_name = "Abraçadeira de nylon 200 x 4,8 mm preta (pacote com 100 unidades) reforçada"
        sheets = [a4256(), a4256(label_width_mm=Decimal("99.00"), label_height_mm=Decimal("33.90")),
                  a4256(label_width_mm=Decimal("30.00"), label_height_mm=Decimal("40.00"))]
        for sheet in sheets:
            with self.subTest(width=sheet["label_width_mm"]):
                boxes = label_boxes(sheet)
                padding = 1.5 * mm
                for x, y, w, h in ((boxes.qr_x, boxes.qr_y, boxes.qr_side, boxes.qr_side),
                                   (boxes.text_x, boxes.text_y, boxes.text_w, boxes.text_h)):
                    self.assertGreaterEqual(x, padding - 0.01)
                    self.assertGreaterEqual(y, padding - 0.01)
                    self.assertLessEqual(x + w, boxes.width - padding + 0.01)
                    self.assertLessEqual(y + h, boxes.height - padding + 0.01)

                lines = fit_label_text(boxes, "FER-0123_A", long_name)
                self.assertEqual(lines[0][0], "FER-0123_A")
                self.assertGreater(len(lines), 1)
                for text, font, size in lines:
                    self.assertLessEqual(stringWidth(text, font, size), boxes.text_w + 0.01)
                self.assertLessEqual(sum(size * 1.15 for _, _, size in lines), boxes.text_h + 0.01)

    def test_qr_matrix(self):
        matrix = qr_matrix("https://feibaja.vercel.app/i/MO001")
        size = len(matrix)
        self.assertEqual(size, 29)  # versão 3 com correção M
        self.assertTrue(all(len(row) == size for row in matrix))
        # os três cantos com o padrão de localização; o canto inferior direito não tem
        for row, column in ((0, 0), (0, size - 7), (size - 7, 0)):
            self.assertTrue(all(matrix[row][column + i] for i in range(7)))
            self.assertTrue(all(matrix[row + 6][column + i] for i in range(7)))
        self.assertFalse(all(matrix[size - 1][size - 7 + i] for i in range(7)))


@override_settings(FRONTEND_URL="https://estoque.exemplo.com/")
class LabelPdfTests(TestCase):
    URL = "/api/etiquetas/pdf/"

    def setUp(self):
        self.client = APIClient()
        self.fixed_admin = CustomUser.objects.create_superuser("root@baja.com", "senha123", username="root")
        self.admin = CustomUser.objects.create_user("admin@baja.com", "senha123", username="admin")
        self.member = CustomUser.objects.create_user("membro@baja.com", "senha123", username="membro")
        set_role(self.admin, ADMIN, acting_user=self.fixed_admin)

        self.template = LabelSheetTemplate.objects.get(name__startswith="Pimaco A4256")
        category = Category.objects.create(name="Mecânica", code_prefix="MO")
        self.chapa = Item.objects.create(item_type="MATERIAL", name="Chapa de aço", category=category, dimensions="1x1")
        self.tubo = Item.objects.create(item_type="MATERIAL", name="Tubo", category=category, dimensions="2x2")

    def body(self, **extra):
        return {"template": self.template.pk, "items": [{"item": self.chapa.pk}], **extra}

    def post(self, **extra):
        return self.client.post(self.URL, self.body(**extra), format="json")

    def page_sizes_mm(self, resp):
        boxes = re.findall(rb"/MediaBox \[ 0 0 ([\d.]+) ([\d.]+) \]", resp.content)
        return [(round(float(w) * 25.4 / 72, 2), round(float(h) * 25.4 / 72, 2)) for w, h in boxes]

    def test_member_gets_403(self):
        self.client.force_authenticate(self.member)
        resp = self.post()
        self.assertEqual(resp.status_code, 403)
        self.assertNotIn(b"%PDF", resp.content)

    def test_anonymous_gets_401(self):
        self.assertEqual(self.post().status_code, 401)

    def test_admin_gets_pdf_with_exact_page_size(self):
        for user in (self.admin, self.fixed_admin):
            self.client.force_authenticate(user)
            resp = self.post()
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp["Content-Type"], "application/pdf")
            self.assertTrue(resp.content.startswith(b"%PDF"))
            self.assertEqual(self.page_sizes_mm(resp), [(210.0, 297.0)])
            # pede ao leitor de PDF para não escalar na impressão
            self.assertIn(b"/PrintScaling /None", resp.content)

    def test_page_size_follows_the_template(self):
        self.client.force_authenticate(self.admin)
        custom = LabelSheetTemplate.objects.create(
            name="Rolo 100 x 150", page_width_mm="100.00", page_height_mm="150.00", columns=1, rows=3,
            label_width_mm="90.00", label_height_mm="40.00", margin_top_mm="5.00", margin_left_mm="5.00",
            pitch_x_mm="90.00", pitch_y_mm="45.00",
        )
        resp = self.post(template=custom.pk, items=[{"item": self.chapa.pk, "copies": 4}])
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(self.page_sizes_mm(resp), [(100.0, 150.0), (100.0, 150.0)])

    def test_pagination(self):
        self.client.force_authenticate(self.admin)
        cases = [
            ([{"item": self.chapa.pk, "copies": 33}], 1, 1),
            ([{"item": self.chapa.pk, "copies": 30}, {"item": self.tubo.pk, "copies": 4}], 1, 2),
            ([{"item": self.chapa.pk}, {"item": self.tubo.pk}], 33, 2),
            ([{"item": self.chapa.pk, "copies": 70}], 1, 3),
        ]
        for items, start, pages in cases:
            with self.subTest(items=items, start=start):
                resp = self.post(items=items, start_position=start)
                self.assertEqual(resp.status_code, 200)
                self.assertEqual(len(self.page_sizes_mm(resp)), pages)

    def test_labels_carry_frontend_url_code_and_name(self):
        self.client.force_authenticate(self.admin)
        with patch("stock.views.build_labels_pdf", return_value=b"%PDF-teste") as build:
            resp = self.post(
                items=[{"item": self.tubo.pk, "copies": 2}, {"item": self.chapa.pk}], start_position=7,
            )
        self.assertEqual(resp.status_code, 200)

        sheet, labels, start = build.call_args.args
        chapa = ("https://estoque.exemplo.com/i/MO001", "MO001", "Chapa de aço")
        tubo = ("https://estoque.exemplo.com/i/MO002", "MO002", "Tubo")
        self.assertEqual(labels, [tubo, tubo, chapa])  # na ordem pedida, cópias juntas; padrão é 1 cópia
        self.assertEqual(start, 7)
        self.assertEqual(sheet["pitch_x_mm"], Decimal("66.10"))

    def test_items_without_code_are_refused(self):
        self.client.force_authenticate(self.admin)
        Item.objects.filter(pk=self.tubo.pk).update(code="")
        resp = self.post(items=[{"item": self.chapa.pk}, {"item": self.tubo.pk, "copies": 3}])
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json()["items_without_code"], [{"id": self.tubo.pk, "name": "Tubo"}])
        self.assertNotIn(b"%PDF", resp.content)

    def test_unknown_items_are_refused(self):
        self.client.force_authenticate(self.admin)
        resp = self.post(items=[{"item": self.chapa.pk}, {"item": 99999}])
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.json()["missing_items"], [99999])

    def test_invalid_requests(self):
        self.client.force_authenticate(self.admin)
        inactive = LabelSheetTemplate.objects.get(name__startswith="Pimaco A4362")
        LabelSheetTemplate.objects.filter(pk=inactive.pk).update(active=False)

        cases = [
            ({"start_position": 34}, "start_position"),
            ({"start_position": 0}, "start_position"),
            ({"items": []}, "items"),
            ({"items": [{"item": self.chapa.pk, "copies": 0}]}, "items"),
            ({"items": [{"item": self.chapa.pk, "copies": 300}, {"item": self.tubo.pk, "copies": 201}]}, "items"),
            ({"template": 99999}, "template"),
            ({"template": inactive.pk}, "template"),
        ]
        for extra, field in cases:
            with self.subTest(extra=extra):
                resp = self.post(**extra)
                self.assertEqual(resp.status_code, 400)
                self.assertIn(field, resp.json())

        resp = self.client.post(self.URL, {"items": [{"item": self.chapa.pk}]}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("template", resp.json())

        # 500 etiquetas é o limite e ainda passa
        with patch("stock.views.build_labels_pdf", return_value=b"%PDF-teste"):
            resp = self.post(items=[{"item": self.chapa.pk, "copies": 500}])
        self.assertEqual(resp.status_code, 200)

    @override_settings(FRONTEND_URL="")
    def test_refuses_without_frontend_url(self):
        self.client.force_authenticate(self.admin)
        resp = self.post()
        self.assertEqual(resp.status_code, 503)
        self.assertIn("FRONTEND_URL", resp.json()["error"])

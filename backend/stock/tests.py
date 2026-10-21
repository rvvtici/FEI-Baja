from django.test import TestCase
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate
from rest_framework.views import APIView

from users.models import CustomUser
from users.permissions import CanViewLogs
from users.roles import ADMIN, set_role
from .models import Category, Item, ItemMovement


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

    def test_movement_user_comes_from_session(self):
        self.client.force_authenticate(self.member)
        resp = self.client.post("/api/movimentacoes/", self.new_movement(user=self.admin.pk), format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()["user"], self.member.pk)
        self.assertEqual(ItemMovement.objects.get(pk=resp.json()["id"]).user, self.member)

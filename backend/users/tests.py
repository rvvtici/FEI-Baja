from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework.test import APIClient

from .models import CustomUser
from .roles import ADMIN, MEMBER, RoleChangeRefused, set_role


class RoleTests(TestCase):
    # setUp cria 3 usuários: um superuser fixo, um admin e um membro
    def setUp(self):
        self.fixed_admin = CustomUser.objects.create_superuser("root@baja.com", "senha123", username="root")
        self.admin = CustomUser.objects.create_user("admin@baja.com", "senha123", username="admin")
        self.user = CustomUser.objects.create_user("membro@baja.com", "senha123", username="membro")
        set_role(self.admin, ADMIN, acting_user=self.fixed_admin)

    def test_admin_group_has_view_logs_after_migrate(self):
        admin_group = Group.objects.get(name=ADMIN)
        self.assertTrue(admin_group.permissions.filter(content_type__app_label="stock", codename="view_logs").exists())
        self.assertTrue(Group.objects.filter(name=MEMBER).exists())
    
    def test_new_user_lands_in_membro(self):
        self.assertEqual(list(self.user.groups.values_list("name", flat=True)), [MEMBER])
        self.assertEqual(self.user.role, MEMBER)
        self.assertFalse(self.user.has_perm("stock.add_item"))
        self.assertFalse(self.user.has_perm("stock.view_logs"))

    def test_superuser_does_not_get_membro(self):
        self.assertFalse(self.fixed_admin.groups.exists())
        self.assertEqual(self.fixed_admin.role, ADMIN)

    def test_promote_and_demote(self):
        set_role(self.user, ADMIN, acting_user=self.admin)
        user = CustomUser.objects.get(pk=self.user.pk)  # evita o cache de permissões
        self.assertEqual(user.role, ADMIN)
        self.assertTrue(user.has_perm("stock.add_item"))
        self.assertTrue(user.has_perm("stock.view_logs"))

        set_role(user, MEMBER, acting_user=self.admin)
        user = CustomUser.objects.get(pk=self.user.pk)
        self.assertEqual(list(user.groups.values_list("name", flat=True)), [MEMBER])

    def test_set_role_refusals(self):
        with self.assertRaises(ValidationError):
            set_role(self.user, "chefe", acting_user=self.admin)
        with self.assertRaises(RoleChangeRefused):
            set_role(self.fixed_admin, MEMBER, acting_user=self.admin)
        with self.assertRaises(RoleChangeRefused):
            set_role(self.admin, MEMBER, acting_user=self.admin)


class RoleApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.fixed_admin = CustomUser.objects.create_superuser("root@baja.com", "senha123", username="root")
        self.admin = CustomUser.objects.create_user("admin@baja.com", "senha123", username="admin")
        self.member = CustomUser.objects.create_user("membro@baja.com", "senha123", username="membro")
        set_role(self.admin, ADMIN, acting_user=self.fixed_admin)

    def test_register_assigns_member(self):
        resp = self.client.post("/api/users/register/", {
            "email": "novo@baja.com", "username": "novo", "password": "senha123",
        })
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(CustomUser.objects.get(email="novo@baja.com").role, MEMBER)

    def test_user_info_flags(self):
        self.client.force_authenticate(self.member)
        data = self.client.get("/api/users/user-info/").json()
        self.assertEqual(data["role"], MEMBER)
        self.assertFalse(data["is_fixed_admin"])
        self.assertFalse(data["can_register_items"])
        self.assertFalse(data["can_view_logs"])
        self.assertFalse(data["can_manage_users"])

        self.client.force_authenticate(self.admin)
        data = self.client.get("/api/users/user-info/").json()
        self.assertEqual(data["role"], ADMIN)
        self.assertTrue(data["can_manage_users"])

    def test_member_gets_403_on_user_endpoints(self):
        self.client.force_authenticate(self.member)
        self.assertEqual(self.client.get("/api/users/").status_code, 403)
        resp = self.client.patch(f"/api/users/{self.member.pk}/role/", {"role": ADMIN})
        self.assertEqual(resp.status_code, 403)

    def test_admin_lists_users_with_flags(self):
        self.client.force_authenticate(self.admin)
        users = {u["username"]: u for u in self.client.get("/api/users/").json()}
        self.assertEqual(len(users), 3)
        self.assertTrue(users["root"]["is_fixed_admin"])
        self.assertTrue(users["admin"]["is_self"])
        self.assertFalse(users["membro"]["is_self"])

    def test_admin_can_change_other_role(self):
        self.client.force_authenticate(self.admin)
        resp = self.client.patch(f"/api/users/{self.member.pk}/role/", {"role": ADMIN})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["role"], ADMIN)

    def test_admin_refused_on_superuser_and_self(self):
        self.client.force_authenticate(self.admin)
        resp = self.client.patch(f"/api/users/{self.fixed_admin.pk}/role/", {"role": MEMBER})
        self.assertEqual(resp.status_code, 403)
        resp = self.client.patch(f"/api/users/{self.admin.pk}/role/", {"role": MEMBER})
        self.assertEqual(resp.status_code, 403)

    def test_invalid_role(self):
        self.client.force_authenticate(self.admin)
        resp = self.client.patch(f"/api/users/{self.member.pk}/role/", {"role": "chefe"})
        self.assertEqual(resp.status_code, 400)

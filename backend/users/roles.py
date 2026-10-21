from django.apps import apps
from django.contrib.auth.management import create_permissions
from django.contrib.auth.models import Group, Permission
from django.core.exceptions import ValidationError
from django.db import transaction

# Admin fixo (superuser) não pode ter o papel alterado. O papel dele é sempre Admin.
ADMIN = "Admin"
MEMBER = "Membro"
ROLES = (ADMIN, MEMBER)

ADMIN_PERMISSIONS = [
    "stock.add_item",
    "stock.change_item",
    "stock.delete_item",
    "stock.add_category",
    "stock.change_category",
    "stock.delete_category",
    "stock.view_logs",
    "users.manage_users",
]


class RoleChangeRefused(Exception):
    pass


def ensure_role_groups(**kwargs):
    # create_permissions é necessário para que as permissões de cada app sejam criadas antes de adicioná-las ao grupo Admin
    for app_label in ("stock", "users"):
        create_permissions(apps.get_app_config(app_label), verbosity=0)

    admin_group, _ = Group.objects.get_or_create(name=ADMIN)
    Group.objects.get_or_create(name=MEMBER)

    for perm in ADMIN_PERMISSIONS:
        app_label, codename = perm.split(".")
        admin_group.permissions.add(
            Permission.objects.get(content_type__app_label=app_label, codename=codename)
        )


def add_new_user_to_members(sender, instance, created, raw=False, **kwargs):
    # post_save: todo usuário novo (exceto superuser) começa como Membro
    if created and not raw and not instance.is_superuser:
        member_group, _ = Group.objects.get_or_create(name=MEMBER)
        instance.groups.add(member_group)


def set_role(user, role, acting_user):
    if role not in ROLES:
        raise ValidationError(f"Papel inválido: {role}. Use {' ou '.join(ROLES)}")
    if user.is_superuser:
        raise RoleChangeRefused("O Admin fixo não pode ter o papel alterado")
    if user.pk == acting_user.pk:
        raise RoleChangeRefused("Você não pode alterar o próprio papel")

    with transaction.atomic():
        user.groups.set([Group.objects.get(name=role)])

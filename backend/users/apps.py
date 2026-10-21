from django.apps import AppConfig
from django.db.models.signals import post_migrate, post_save


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        from .roles import ensure_role_groups, add_new_user_to_members
        post_migrate.connect(ensure_role_groups, sender=self)
        post_save.connect(add_new_user_to_members, sender=self.get_model("CustomUser"))

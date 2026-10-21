from rest_framework.permissions import BasePermission


class CanManageUsers(BasePermission):
    message = "Apenas administradores podem gerenciar usuários"

    def has_permission(self, request, view):
        return bool(request.user and request.user.has_perm("users.manage_users"))


class CanViewLogs(BasePermission):
    message = "Apenas administradores podem ver os logs"

    def has_permission(self, request, view):
        return bool(request.user and request.user.has_perm("stock.view_logs"))

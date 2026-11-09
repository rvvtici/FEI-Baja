from rest_framework.permissions import BasePermission


class CanManageUsers(BasePermission):
    message = "Apenas administradores podem gerenciar usuários"

    def has_permission(self, request, view):
        return bool(request.user and request.user.has_perm("users.manage_users"))


class CanManageLabels(BasePermission):
    # Vale para tudo de etiquetas, inclusive leitura: modelos de folha, PDF e calibração
    message = "Apenas administradores podem gerenciar e imprimir etiquetas"

    def has_permission(self, request, view):
        return bool(request.user and request.user.has_perm("stock.manage_labels"))


class CanViewLogs(BasePermission):
    message = "Apenas administradores podem ver os logs"

    def has_permission(self, request, view):
        return bool(request.user and request.user.has_perm("stock.view_logs"))

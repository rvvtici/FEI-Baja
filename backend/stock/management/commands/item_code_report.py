from collections import defaultdict

from django.core.management.base import BaseCommand

from stock.models import ITEM_CODE_PATTERN, Category, Item


class Command(BaseCommand):
    help = "Relatório SOMENTE LEITURA dos códigos de item (não altera nada no banco)"

    def handle(self, *args, **options):
        items = list(Item.objects.order_by("id").values_list("id", "code", "name"))
        out = self.stdout.write

        out(f"Itens no banco: {len(items)}")

        empty = [i for i in items if not (i[1] or "").strip()]
        out(f"\n1) Itens com código vazio ou nulo: {len(empty)}")
        for pk, code, name in empty:
            out(f"   id={pk} code={code!r} nome={name!r}")

        invalid = [i for i in items if (i[1] or "").strip() and not ITEM_CODE_PATTERN.fullmatch(i[1])]
        out(f"\n2) Itens com código fora de [A-Z0-9_-] (inclui minúsculas e espaços): {len(invalid)}")
        for pk, code, name in invalid:
            out(f"   id={pk} code={code!r} nome={name!r}")

        by_upper = defaultdict(list)
        for pk, code, name in items:
            if (code or "").strip():
                by_upper[code.strip().upper()].append((pk, code, name))
        clashes = {k: v for k, v in by_upper.items() if len(v) > 1}
        out(f"\n3) Grupos de códigos que só diferem em maiúsculas/minúsculas: {len(clashes)}")
        for upper, group in sorted(clashes.items()):
            out(f"   {upper}: " + ", ".join(f"id={pk} code={code!r}" for pk, code, _ in group))

        # O código automático é prefixo da categoria + número: prefixo ruim gera código ruim
        prefixes = [
            c for c in Category.objects.order_by("id").values_list("id", "code_prefix", "name")
            if not ITEM_CODE_PATTERN.fullmatch(c[1] or "")
        ]
        out(f"\n4) Categorias com prefixo fora de [A-Z0-9_-]: {len(prefixes)}")
        for pk, prefix, name in prefixes:
            out(f"   id={pk} code_prefix={prefix!r} nome={name!r}")

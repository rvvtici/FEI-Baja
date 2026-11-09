from decimal import Decimal

from django.db import migrations

NOTE = "Medidas da tabela do fabricante (Pimaco). A conferir com régua na folha real"

# Folhas A4 (210 x 297 mm). Medidas em mm, convertidas da tabela oficial da Pimaco (em cm):
#   A4256: margem sup. 0,88 / lateral 0,72 / passo vert. 2,54 / passo horiz. 6,61 / altura 2,54 / largura 6,35 / 3 x 11
#   A4362: margem sup. 1,29 / lateral 0,47 / passo vert. 3,39 / passo horiz. 10,16 / altura 3,39 / largura 9,90 / 2 x 8
SEED_TEMPLATES = [
    {
        "name": "Pimaco A4256 (63,5 x 25,4 mm, 33 por folha)",
        "notes": NOTE,
        "page_width_mm": Decimal("210.00"),
        "page_height_mm": Decimal("297.00"),
        "columns": 3,
        "rows": 11,
        "label_width_mm": Decimal("63.50"),
        "label_height_mm": Decimal("25.40"),
        "margin_top_mm": Decimal("8.80"),
        "margin_left_mm": Decimal("7.20"),
        "pitch_x_mm": Decimal("66.10"),
        "pitch_y_mm": Decimal("25.40"),
    },
    {
        "name": "Pimaco A4362 (99,0 x 33,9 mm, 16 por folha)",
        "notes": NOTE,
        "page_width_mm": Decimal("210.00"),
        "page_height_mm": Decimal("297.00"),
        "columns": 2,
        "rows": 8,
        "label_width_mm": Decimal("99.00"),
        "label_height_mm": Decimal("33.90"),
        "margin_top_mm": Decimal("12.90"),
        "margin_left_mm": Decimal("4.70"),
        "pitch_x_mm": Decimal("101.60"),
        "pitch_y_mm": Decimal("33.90"),
    },
]


def seed(apps, schema_editor):
    # Cria só o que não existe pelo nome: nunca sobrescreve um modelo já calibrado
    LabelSheetTemplate = apps.get_model("stock", "LabelSheetTemplate")
    for data in SEED_TEMPLATES:
        if not LabelSheetTemplate.objects.filter(name=data["name"]).exists():
            LabelSheetTemplate.objects.create(**data)


def unseed(apps, schema_editor):
    # Só apaga o que ainda está sem calibração (offsets zerados)
    LabelSheetTemplate = apps.get_model("stock", "LabelSheetTemplate")
    LabelSheetTemplate.objects.filter(
        name__in=[data["name"] for data in SEED_TEMPLATES],
        offset_x_mm=0,
        offset_y_mm=0,
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('stock', '0010_labelsheettemplate'),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]

"""Geometria das folhas de etiquetas. Funções puras, em mm, sem banco e sem desenho."""

from collections import namedtuple

GEOMETRY_FIELDS = (
    "page_width_mm", "page_height_mm", "columns", "rows",
    "label_width_mm", "label_height_mm", "margin_top_mm", "margin_left_mm",
    "pitch_x_mm", "pitch_y_mm", "inner_padding_mm",
)


LAYOUT_FIELDS = GEOMETRY_FIELDS + ("offset_x_mm", "offset_y_mm")

# page: folha (0 = primeira). position: número da etiqueta na folha, começando em 1,
# da esquerda para a direita e de cima para baixo. x_mm/top_mm: canto superior esquerdo
# da etiqueta, medido a partir do canto superior esquerdo da folha.
LabelSlot = namedtuple("LabelSlot", "page position row column x_mm top_mm")


def sheet_values(template):
    """Medidas de um LabelSheetTemplate como dict, para as funções puras daqui."""
    return {field: getattr(template, field) for field in LAYOUT_FIELDS}


def labels_per_sheet(sheet):
    return sheet["columns"] * sheet["rows"]


def label_slots(sheet, count, start_position=1):
    """Posições de `count` etiquetas seguidas, começando em `start_position` na primeira folha.

    posição = margem + índice * passo + ajuste. Passou da última posição, continua na folha seguinte.
    """
    per_sheet = labels_per_sheet(sheet)
    if not 1 <= start_position <= per_sheet:
        raise ValueError(f"A posição inicial deve ficar entre 1 e {per_sheet}.")

    slots = []
    for n in range(count):
        page, on_page = divmod(start_position - 1 + n, per_sheet)
        row, column = divmod(on_page, sheet["columns"])
        slots.append(LabelSlot(
            page=page,
            position=on_page + 1,
            row=row,
            column=column,
            x_mm=sheet["margin_left_mm"] + column * sheet["pitch_x_mm"] + sheet["offset_x_mm"],
            top_mm=sheet["margin_top_mm"] + row * sheet["pitch_y_mm"] + sheet["offset_y_mm"],
        ))
    return slots


def pdf_bottom_mm(sheet, top_mm):
    """O PDF mede a partir de baixo: converte o topo da etiqueta na sua borda inferior."""
    return sheet["page_height_mm"] - top_mm - sheet["label_height_mm"]


def ruler_length_mm(page_size_mm, wanted=100, edge=10):
    """Comprimento da régua de conferência: 100 mm, ou o maior múltiplo de 10 que couber numa folha pequena."""
    available = int((page_size_mm - 2 * edge) // 10) * 10
    return max(0, min(wanted, available))


def sheet_geometry_errors(v):
    """Devolve {campo: mensagem} com o que impede a grade de caber na página."""
    errors = {}

    if v["pitch_x_mm"] < v["label_width_mm"]:
        errors["pitch_x_mm"] = "O passo horizontal não pode ser menor que a largura da etiqueta."
    if v["pitch_y_mm"] < v["label_height_mm"]:
        errors["pitch_y_mm"] = "O passo vertical não pode ser menor que a altura da etiqueta."

    used_width = v["margin_left_mm"] + (v["columns"] - 1) * v["pitch_x_mm"] + v["label_width_mm"]
    if used_width > v["page_width_mm"]:
        errors["page_width_mm"] = (
            f"A grade não cabe na largura da página: ocupa {used_width} mm de {v['page_width_mm']} mm."
        )

    used_height = v["margin_top_mm"] + (v["rows"] - 1) * v["pitch_y_mm"] + v["label_height_mm"]
    if used_height > v["page_height_mm"]:
        errors["page_height_mm"] = (
            f"A grade não cabe na altura da página: ocupa {used_height} mm de {v['page_height_mm']} mm."
        )

    if 2 * v["inner_padding_mm"] >= min(v["label_width_mm"], v["label_height_mm"]):
        errors["inner_padding_mm"] = "A margem interna não deixa espaço para o conteúdo da etiqueta."

    return errors

"""Desenho do PDF de etiquetas. As posições vêm de label_layout; aqui só se desenha."""

from collections import namedtuple
from io import BytesIO
from itertools import groupby
from urllib.parse import quote

from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.lib.units import mm
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

from .label_layout import label_slots, pdf_bottom_mm

QR_ERROR_LEVEL = "M"
QR_QUIET_ZONE_MODULES = 4  # margem branca exigida pelo padrão do QR
FONT = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
LEADING = 1.15
MIN_FONT_SIZE = 5
GAP = 1.5 * mm

# Onde ficam o QR e o texto dentro de uma etiqueta, em pontos, a partir do canto inferior esquerdo dela
LabelBoxes = namedtuple("LabelBoxes", "width height side_by_side qr_x qr_y qr_side text_x text_y text_w text_h")


def item_label_url(base_url, code):
    """URL gravada no QR: <base>/i/<código>."""
    return f"{base_url.rstrip('/')}/i/{quote(code, safe='')}"


def new_canvas(buffer, sheet, title):
    # Página do tamanho exato do modelo, em mm, sem nenhuma escala
    page_size = (float(sheet["page_width_mm"]) * mm, float(sheet["page_height_mm"]) * mm)
    pdf = canvas.Canvas(buffer, pagesize=page_size)
    pdf.setTitle(title)
    # Pede ao leitor de PDF que proponha "Tamanho real" na hora de imprimir
    pdf.setViewerPreference("PrintScaling", "None")
    return pdf


def label_boxes(sheet):
    width = float(sheet["label_width_mm"]) * mm
    height = float(sheet["label_height_mm"]) * mm
    padding = float(sheet["inner_padding_mm"]) * mm
    inner_w, inner_h = width - 2 * padding, height - 2 * padding

    if inner_w >= inner_h * 1.6:
        # QR à esquerda, texto à direita
        qr_side = min(inner_h, inner_w / 2)
        return LabelBoxes(
            width, height, True,
            qr_x=padding, qr_y=padding + (inner_h - qr_side) / 2, qr_side=qr_side,
            text_x=padding + qr_side + GAP, text_y=padding, text_w=inner_w - qr_side - GAP, text_h=inner_h,
        )

    # QR em cima, texto embaixo
    qr_side = min(inner_w, inner_h * 0.65)
    return LabelBoxes(
        width, height, False,
        qr_x=padding + (inner_w - qr_side) / 2, qr_y=padding + inner_h - qr_side, qr_side=qr_side,
        text_x=padding, text_y=padding, text_w=inner_w, text_h=inner_h - qr_side - GAP,
    )


def qr_matrix(value):
    """Matriz do QR (True = módulo escuro), de cima para baixo."""
    widget = QrCodeWidget(value, barLevel=QR_ERROR_LEVEL)
    widget.qr.make()
    return [[bool(cell) for cell in row] for row in widget.qr.modules]


def define_qr_form(pdf, name, value, side):
    """Desenha o QR vetorial uma vez, num quadrado de lado `side` (margem branca incluída), para reutilizar."""
    modules = qr_matrix(value)
    box = side / (len(modules) + 2 * QR_QUIET_ZONE_MODULES)

    pdf.beginForm(name, lowerx=0, lowery=0, upperx=side, uppery=side)
    pdf.setFillColorRGB(0, 0, 0)
    for r, row in enumerate(modules):
        column = 0
        for dark, run in groupby(row):
            length = len(list(run))
            if dark:
                pdf.rect(
                    (column + QR_QUIET_ZONE_MODULES) * box, side - (r + QR_QUIET_ZONE_MODULES + 1) * box,
                    length * box, box, stroke=0, fill=1,
                )
            column += length
    pdf.endForm()


def _printable(text):
    # As fontes padrão do PDF só cobrem Latin-1/cp1252 (acentos do português incluídos)
    return " ".join(str(text).split()).encode("cp1252", "replace").decode("cp1252")


def _truncate(text, font, size, max_width):
    if stringWidth(text, font, size) <= max_width:
        return text
    while text and stringWidth(text + "…", font, size) > max_width:
        text = text[:-1]
    return text.rstrip() + "…"


def _fit_line(text, font, max_size, max_width):
    size = max_size
    while size > MIN_FONT_SIZE and stringWidth(text, font, size) > max_width:
        size -= 0.5
    return size, _truncate(text, font, size, max_width)


def _fit_lines(text, font, max_size, max_width, max_height):
    """Maior fonte em que o texto, quebrado em linhas, cabe na caixa. No limite, corta com reticências."""
    size = max_size
    while True:
        lines = simpleSplit(text, font, size, max_width)
        fits = len(lines) * size * LEADING <= max_height and all(
            stringWidth(line, font, size) <= max_width for line in lines
        )
        if fits or size <= MIN_FONT_SIZE:
            break
        size -= 0.5

    if not fits:
        max_lines = max(1, int(max_height // (size * LEADING)))
        if len(lines) > max_lines:
            lines = lines[:max_lines - 1] + [" ".join(lines[max_lines - 1:])]
        lines = [_truncate(line, font, size, max_width) for line in lines]
    return size, lines


def fit_label_text(boxes, code, name):
    """Devolve [(texto, fonte, tamanho), ...] com o código e o nome ajustados à caixa de texto."""
    if boxes.text_w <= 0 or boxes.text_h < MIN_FONT_SIZE:
        return []

    code_max = min(14, max(MIN_FONT_SIZE, boxes.text_h * 0.4 / LEADING))
    code_size, code = _fit_line(_printable(code), FONT_BOLD, code_max, boxes.text_w)
    lines = [(code, FONT_BOLD, code_size)]

    name = _printable(name)
    name_space = boxes.text_h - code_size * LEADING
    if name and name_space >= MIN_FONT_SIZE * LEADING:
        name_size, name_lines = _fit_lines(name, FONT, min(10, code_size), boxes.text_w, name_space)
        lines += [(line, FONT, name_size) for line in name_lines]
    return lines


def draw_label(pdf, x, y, boxes, qr_form, text_lines):
    """Desenha uma etiqueta cujo canto inferior esquerdo está em (x, y), em pontos."""
    pdf.saveState()
    pdf.translate(x, y)

    # Nada vaza para a etiqueta vizinha
    clip = pdf.beginPath()
    clip.rect(0, 0, boxes.width, boxes.height)
    pdf.clipPath(clip, stroke=0, fill=0)

    pdf.saveState()
    pdf.translate(boxes.qr_x, boxes.qr_y)
    pdf.doForm(qr_form)
    pdf.restoreState()

    block_h = sum(size * LEADING for _, _, size in text_lines)
    cursor = boxes.text_y + (boxes.text_h + block_h) / 2  # bloco centralizado na vertical
    for text, font, size in text_lines:
        cursor -= size * LEADING
        pdf.setFont(font, size)
        baseline = cursor + size * 0.28
        if boxes.side_by_side:
            pdf.drawString(boxes.text_x, baseline, text)
        else:
            pdf.drawCentredString(boxes.text_x + boxes.text_w / 2, baseline, text)

    pdf.restoreState()


def build_labels_pdf(sheet, labels, start_position=1, title="Etiquetas"):
    """labels: lista de (url, código, nome), uma entrada por etiqueta impressa. Devolve os bytes do PDF."""
    buffer = BytesIO()
    pdf = new_canvas(buffer, sheet, title)
    boxes = label_boxes(sheet)

    # Cada etiqueta diferente é calculada uma vez só; as cópias reutilizam o mesmo desenho
    prepared = {}
    for label in labels:
        if label not in prepared:
            url, code, name = label
            qr_form = f"qr{len(prepared)}"
            define_qr_form(pdf, qr_form, url, boxes.qr_side)
            prepared[label] = (qr_form, fit_label_text(boxes, code, name))

    page = 0
    for slot, label in zip(label_slots(sheet, len(labels), start_position), labels):
        while page < slot.page:
            pdf.showPage()
            page += 1
        x = float(slot.x_mm) * mm
        y = float(pdf_bottom_mm(sheet, slot.top_mm)) * mm
        draw_label(pdf, x, y, boxes, *prepared[label])

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()

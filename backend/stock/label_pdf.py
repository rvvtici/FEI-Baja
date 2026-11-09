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

from .label_layout import label_slots, pdf_bottom_mm, ruler_length_mm

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


def _draw_ruler(pdf, x, y, length_mm, horizontal):
    """Régua com origem em (x, y): para a direita (horizontal) ou para baixo (vertical). Traços a cada 1 mm."""
    pdf.setLineWidth(0.3)
    if horizontal:
        pdf.line(x, y, x + length_mm * mm, y)
    else:
        pdf.line(x, y, x, y - length_mm * mm)

    pdf.setFont(FONT, 6)
    for tick in range(length_mm + 1):
        size = (4 if tick % 10 == 0 else 2.5 if tick % 5 == 0 else 1.5) * mm
        if horizontal:
            pdf.line(x + tick * mm, y, x + tick * mm, y - size)
            if tick % 10 == 0 and tick:
                pdf.drawCentredString(x + tick * mm, y - size - 6, str(tick))
        else:
            pdf.line(x, y - tick * mm, x + size, y - tick * mm)
            if tick % 10 == 0 and tick:
                pdf.drawString(x + size + 1.5, y - tick * mm - 2, str(tick))


def build_calibration_pdf(sheet, title):
    """Folha de teste de um modelo: contorno, cruz no centro e número de cada etiqueta, mais réguas de 100 mm."""
    buffer = BytesIO()
    pdf = new_canvas(buffer, sheet, f"Calibração - {title}")

    page_w = float(sheet["page_width_mm"]) * mm
    page_h = float(sheet["page_height_mm"]) * mm
    width = float(sheet["label_width_mm"]) * mm
    height = float(sheet["label_height_mm"]) * mm

    # Etiquetas: já com os ajustes (offsets) do modelo, como sairão na impressão de verdade
    pdf.setLineWidth(0.25)
    pdf.setStrokeGray(0.35)
    pdf.setFillGray(0.35)
    number_size = max(MIN_FONT_SIZE, min(8, height * 0.25))
    cross = min(3 * mm, width / 4, height / 4)
    for slot in label_slots(sheet, sheet["columns"] * sheet["rows"]):
        x = float(slot.x_mm) * mm
        y = float(pdf_bottom_mm(sheet, slot.top_mm)) * mm
        pdf.rect(x, y, width, height, stroke=1, fill=0)
        center_x, center_y = x + width / 2, y + height / 2
        pdf.line(center_x - cross, center_y, center_x + cross, center_y)
        pdf.line(center_x, center_y - cross, center_x, center_y + cross)
        pdf.setFont(FONT, number_size)
        pdf.drawString(x + 1 * mm, y + height - 1 * mm - number_size * 0.8, str(slot.position))

    # Réguas: posição fixa na folha (não seguem os offsets), para conferir se a impressão saiu em 100%
    ruler_w = ruler_length_mm(sheet["page_width_mm"])
    ruler_h = ruler_length_mm(sheet["page_height_mm"])
    origin_x = (page_w - ruler_w * mm) / 2
    origin_y = (page_h + ruler_h * mm) / 2
    band = 8 * mm

    pdf.setFillGray(1)
    if ruler_w:
        pdf.rect(origin_x - 1 * mm, origin_y - band, ruler_w * mm + 4 * mm, band + 1 * mm, stroke=0, fill=1)
    if ruler_h:
        pdf.rect(origin_x - 1 * mm, origin_y - ruler_h * mm - 2 * mm, band + 2 * mm, ruler_h * mm + 3 * mm, stroke=0, fill=1)

    # Instruções no canto interno das réguas (só quando a folha tem espaço para elas)
    note_x, note_top = origin_x + band + 4 * mm, origin_y - band - 3 * mm
    note_w = ruler_w * mm - band - 6 * mm
    if ruler_w >= 80 and ruler_h >= 50:
        notes = [
            "Imprima em Tamanho real / Escala 100%, sem ajustar à página.",
            f"Cada régua deve medir exatamente {ruler_w} mm.",
            "Os contornos devem coincidir com as etiquetas da folha.",
            "Ajuste horizontal positivo = direita; vertical positivo = baixo.",
            f"Ajustes neste teste: horizontal {sheet['offset_x_mm']} mm, vertical {sheet['offset_y_mm']} mm.",
        ]
        lines = [(_truncate(_printable(title), FONT_BOLD, 7, note_w), FONT_BOLD)]
        lines += [(_truncate(note, FONT, 7, note_w), FONT) for note in notes]
        pdf.rect(note_x - 2 * mm, note_top - len(lines) * 10 - 2 * mm, note_w + 4 * mm, len(lines) * 10 + 3 * mm, stroke=0, fill=1)
        pdf.setFillGray(0)
        for index, (line, font) in enumerate(lines):
            pdf.setFont(font, 7)
            pdf.drawString(note_x, note_top - (index + 1) * 10 + 3, line)

    pdf.setStrokeGray(0)
    pdf.setFillGray(0)
    if ruler_w:
        _draw_ruler(pdf, origin_x, origin_y, ruler_w, horizontal=True)
    if ruler_h:
        _draw_ruler(pdf, origin_x, origin_y, ruler_h, horizontal=False)
    if ruler_w or ruler_h:
        pdf.setFont(FONT, 6)
        pdf.drawRightString(origin_x - 1.5, origin_y + 1.5, "0")

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()

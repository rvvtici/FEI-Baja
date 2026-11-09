// Modelo de folha de etiquetas, como vem de /api/etiquetas/modelos/ (medidas em mm, como texto decimal)
export interface LabelSheetTemplate {
  id: number
  name: string
  notes: string
  page_width_mm: string
  page_height_mm: string
  columns: number
  rows: number
  label_width_mm: string
  label_height_mm: string
  margin_top_mm: string
  margin_left_mm: string
  pitch_x_mm: string
  pitch_y_mm: string
  offset_x_mm: string
  offset_y_mm: string
  inner_padding_mm: string
  active: boolean
  labels_per_sheet: number
}

// Mesmos limites do backend
export const MAX_LABELS_PER_PDF = 500
export const MAX_OFFSET_MM = 15

export type SheetUsage = {
  sheets: number
  // posições usadas na primeira folha (from > to quando não há etiquetas)
  firstSheetFrom: number
  firstSheetTo: number
  // quantas etiquetas ficam na última folha
  lastSheetCount: number
}

// Posições numeradas a partir de 1, da esquerda para a direita e de cima para baixo.
// A posição inicial só vale para a primeira folha; as seguintes começam na 1.
export function sheetUsage(perSheet: number, startPosition: number, total: number): SheetUsage {
  if (total <= 0 || perSheet <= 0) {
    return { sheets: 0, firstSheetFrom: startPosition, firstSheetTo: startPosition - 1, lastSheetCount: 0 }
  }
  const onFirstSheet = Math.min(total, perSheet - startPosition + 1)
  const rest = total - onFirstSheet
  return {
    sheets: 1 + Math.ceil(rest / perSheet),
    firstSheetFrom: startPosition,
    firstSheetTo: startPosition + onFirstSheet - 1,
    lastSheetCount: rest === 0 ? onFirstSheet : rest % perSheet || perSheet,
  }
}

export function clampStartPosition(value: number, perSheet: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(Math.max(1, Math.trunc(value)), Math.max(1, perSheet))
}

// Junta as mensagens de um erro 400 do DRF ({campo: ["msg"]}, {error: "msg"}, lista ou texto)
export function apiErrorText(data: unknown): string {
  if (typeof data === "string") return data
  if (Array.isArray(data)) return data.map(apiErrorText).filter(Boolean).join(" ")
  if (data && typeof data === "object") {
    return Object.values(data as Record<string, unknown>).map(apiErrorText).filter(Boolean).join(" ")
  }
  return ""
}

import { describe, expect, it } from "vitest"
import { apiErrorText, clampStartPosition, sheetUsage } from "./labels"

describe("sheetUsage", () => {
  it("cabe tudo na primeira folha", () => {
    expect(sheetUsage(33, 1, 10)).toEqual({ sheets: 1, firstSheetFrom: 1, firstSheetTo: 10, lastSheetCount: 10 })
    expect(sheetUsage(33, 1, 33)).toEqual({ sheets: 1, firstSheetFrom: 1, firstSheetTo: 33, lastSheetCount: 33 })
  })

  it("posição inicial pula as etiquetas já usadas", () => {
    expect(sheetUsage(33, 5, 3)).toEqual({ sheets: 1, firstSheetFrom: 5, firstSheetTo: 7, lastSheetCount: 3 })
  })

  it("passa para a folha seguinte, que recomeça na posição 1", () => {
    expect(sheetUsage(33, 32, 4)).toEqual({ sheets: 2, firstSheetFrom: 32, firstSheetTo: 33, lastSheetCount: 2 })
    expect(sheetUsage(33, 1, 70)).toEqual({ sheets: 3, firstSheetFrom: 1, firstSheetTo: 33, lastSheetCount: 4 })
    expect(sheetUsage(33, 1, 66)).toEqual({ sheets: 2, firstSheetFrom: 1, firstSheetTo: 33, lastSheetCount: 33 })
  })

  it("sem etiquetas não usa nenhuma posição", () => {
    const usage = sheetUsage(33, 4, 0)
    expect(usage.sheets).toBe(0)
    expect(usage.firstSheetTo).toBeLessThan(usage.firstSheetFrom)
  })
})

describe("clampStartPosition", () => {
  it("mantém entre 1 e o total da folha", () => {
    expect(clampStartPosition(0, 33)).toBe(1)
    expect(clampStartPosition(34, 33)).toBe(33)
    expect(clampStartPosition(12.7, 33)).toBe(12)
    expect(clampStartPosition(Number.NaN, 33)).toBe(1)
  })
})

describe("apiErrorText", () => {
  it("junta as mensagens de erro do backend", () => {
    expect(apiErrorText({ error: "Itens não encontrados." })).toBe("Itens não encontrados.")
    expect(apiErrorText({ offset_x_mm: ["Muito grande."], offset_y_mm: ["Muito pequeno."] })).toBe(
      "Muito grande. Muito pequeno.",
    )
    expect(apiErrorText(null)).toBe("")
  })
})

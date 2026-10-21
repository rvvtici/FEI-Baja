import { describe, expect, it } from "vitest"
import { Item } from "@/components/types/types"
import { findItemByCode, itemLookupPath, itemQrUrl, parseScannedCode } from "./item-code"

describe("parseScannedCode", () => {
  it("extrai o código do link do QR", () => {
    expect(parseScannedCode("http://localhost:3000/?code=MO001")).toBe("MO001")
    expect(parseScannedCode("https://feibaja.vercel.app/?code=MO%20001")).toBe("MO 001")
  })

  it("remove espaços, quebras de linha e caracteres de controle", () => {
    expect(parseScannedCode("  5411802B508A4\r\n")).toBe("5411802B508A4")
    expect(parseScannedCode("MO001\u001D")).toBe("MO001")
  })

  it("link sem o parâmetro vira vazio", () => {
    expect(parseScannedCode("https://exemplo.com/")).toBe("")
  })
})

describe("itemQrUrl", () => {
  it("monta o link do frontend com o código codificado", () => {
    expect(itemQrUrl("MO001", "http://localhost:3000")).toBe("http://localhost:3000/?code=MO001")
    expect(itemQrUrl("A&B", "https://feibaja.vercel.app")).toBe("https://feibaja.vercel.app/?code=A%26B")
  })

  it("lido de volta pelo scanner, devolve o mesmo código", () => {
    expect(parseScannedCode(itemQrUrl("A+B&C", "http://localhost:3000"))).toBe("A+B&C")
  })
})

describe("itemLookupPath", () => {
  it("codifica +, & e espaço", () => {
    expect(itemLookupPath("A+B&C D")).toBe("/api/itens/?code=A%2BB%26C%20D")
  })
})

describe("findItemByCode", () => {
  const items = [
    { id: 1, code: "MO001" },
    { id: 2, code: "MO002" },
  ] as Item[]

  it("acha pelo code, sem diferenciar maiúsculas", () => {
    expect(findItemByCode(items, "mo002")?.id).toBe(2)
    expect(findItemByCode(items, "MO999")).toBeUndefined()
  })
})

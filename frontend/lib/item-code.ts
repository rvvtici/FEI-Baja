import { Item } from "@/components/types/types"

// Já abre o scanner já na movimentação da peça
export const ITEM_CODE_PARAM = "code"

export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  return typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
}

// Link gravado no QR da etiqueta (aponta para o frontend, não para a API)
export function itemQrUrl(code: string, siteUrl: string): string {
  const url = new URL("/", siteUrl)
  url.searchParams.set(ITEM_CODE_PARAM, code)
  return url.toString()
}

// Devolve o código lido no QR
export function parseScannedCode(raw: string): string {
  const value = raw.replace(/[\u0000-\u001F\u007F]/g, "").trim()
  if (/^https?:\/\//i.test(value)) {
    try {
      return (new URL(value).searchParams.get(ITEM_CODE_PARAM) ?? "").trim()
    } catch {
      return ""
    }
  }
  return value
}

export function itemLookupPath(code: string): string {
  return `/api/itens/?${ITEM_CODE_PARAM}=${encodeURIComponent(code)}`
}

// Garantia de que o resultado é mesmo a peça lida
export function findItemByCode(items: Item[], code: string): Item | undefined {
  const wanted = code.toUpperCase()
  return items.find((item) => item.code?.toUpperCase() === wanted)
}

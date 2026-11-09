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

// Link curto e estável impresso nas etiquetas: <site>/i/<código>
export const ITEM_SHORT_PATH = "/i/"

// Para onde o link curto leva hoje (no futuro, a tela de detalhe do item)
export function itemShortLinkTarget(code: string): string {
  return `/?${ITEM_CODE_PARAM}=${encodeURIComponent(code)}`
}

function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

// Devolve o código lido no QR. Aceita o link da etiqueta (/i/<código>), o link antigo (/?code=) e o código puro
export function parseScannedCode(raw: string): string {
  const value = raw.replace(/[\u0000-\u001F\u007F]/g, "").trim()
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value)
      const short = url.pathname.match(/^\/i\/([^/]+)\/?$/)
      if (short) return decodePathSegment(short[1]).trim()
      return (url.searchParams.get(ITEM_CODE_PARAM) ?? "").trim()
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

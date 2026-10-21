export const ROUTES = {
  scanner: "/",
  dashboard: "/dashboard",
} as const

// 1024 cobre a maioria dos tablets e celulares
export const PORTABLE_MAX_SHORT_SIDE = 1024

export function isPortableDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false

  // Chromium (Chrome Android, Edge, Samsung Internet) informa diretamente
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData
  if (uaData?.mobile === true) return true

  // Entrada principal é o dedo, sem hover. Notebooks com touchscreen continuam
  // com pointer: fine (mouse/trackpad), então não entram aqui.
  const touchPrimary =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(hover: none)").matches

  // screen.* (e não window.*) para uma janela estreita no desktop não contar;
  // lado curto para a orientação não importar
  const shortSide = Math.min(window.screen.width, window.screen.height)

  return touchPrimary && shortSide <= PORTABLE_MAX_SHORT_SIDE
}

// Só caminhos internos: "//site.com" ou "/\site.com" levariam para outro domínio
export function isSafeNext(next: string | null | undefined): next is string {
  return !!next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") && !next.startsWith("/login")
}

export function getPostLoginRoute(next?: string | null): string {
  if (isSafeNext(next)) return next
  return isPortableDevice() ? ROUTES.scanner : ROUTES.dashboard
}

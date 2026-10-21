import { afterEach, describe, expect, it, vi } from "vitest"
import { getPostLoginRoute, isPortableDevice, ROUTES } from "./device"

type Env = {
  uaMobile?: boolean
  coarse: boolean
  hoverNone: boolean
  screen: [number, number]
}

function stubDevice({ uaMobile, coarse, hoverNone, screen }: Env) {
  vi.stubGlobal("navigator", uaMobile === undefined ? {} : { userAgentData: { mobile: uaMobile } })
  vi.stubGlobal("window", {
    screen: { width: screen[0], height: screen[1] },
    matchMedia: (q: string) => ({
      matches: q === "(pointer: coarse)" ? coarse : q === "(hover: none)" ? hoverNone : false,
    }),
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("isPortableDevice", () => {
  it("Android Chrome (userAgentData.mobile)", () => {
    stubDevice({ uaMobile: true, coarse: true, hoverNone: true, screen: [412, 915] })
    expect(isPortableDevice()).toBe(true)
  })

  it("iPhone Safari (sem userAgentData)", () => {
    stubDevice({ coarse: true, hoverNone: true, screen: [390, 844] })
    expect(isPortableDevice()).toBe(true)
  })

  it("iPad em paisagem (UA de Mac, mas toque)", () => {
    stubDevice({ coarse: true, hoverNone: true, screen: [1366, 1024] })
    expect(isPortableDevice()).toBe(true)
  })

  it("desktop com mouse", () => {
    stubDevice({ uaMobile: false, coarse: false, hoverNone: false, screen: [1920, 1080] })
    expect(isPortableDevice()).toBe(false)
  })

  it("notebook com touchscreen (pointer principal é o trackpad)", () => {
    stubDevice({ uaMobile: false, coarse: false, hoverNone: false, screen: [1366, 768] })
    expect(isPortableDevice()).toBe(false)
  })

  it("monitor touch grande (toque, mas tela grande)", () => {
    stubDevice({ coarse: true, hoverNone: true, screen: [1920, 1080] })
    expect(isPortableDevice()).toBe(false)
  })

  it("desktop com janela estreita continua desktop (usa screen, não window)", () => {
    stubDevice({ coarse: false, hoverNone: false, screen: [2560, 1440] })
    expect(isPortableDevice()).toBe(false)
  })

  it("SSR (sem window)", () => {
    vi.stubGlobal("window", undefined)
    expect(isPortableDevice()).toBe(false)
  })
})

describe("getPostLoginRoute", () => {
  it("portátil vai para o scanner", () => {
    stubDevice({ coarse: true, hoverNone: true, screen: [390, 844] })
    expect(getPostLoginRoute()).toBe(ROUTES.scanner)
  })

  it("desktop vai para o dashboard", () => {
    stubDevice({ coarse: false, hoverNone: false, screen: [1920, 1080] })
    expect(getPostLoginRoute()).toBe(ROUTES.dashboard)
  })
})

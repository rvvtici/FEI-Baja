import { afterEach, describe, expect, it, vi } from "vitest"
import { API_URL, apiFetch } from "./api"

function stubFetch(...statuses: number[]) {
  const fetchMock = vi.fn()
  for (const status of statuses) fetchMock.mockResolvedValueOnce(new Response(null, { status }))
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

function stubLocation(pathname = "/dashboard", search = "") {
  const replace = vi.fn()
  vi.stubGlobal("window", { location: { pathname, search, replace } })
  return replace
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("apiFetch", () => {
  it("sempre envia os cookies e o Content-Type do corpo JSON", async () => {
    const fetchMock = stubFetch(200)
    stubLocation()

    await apiFetch("/api/movimentacoes/", { method: "POST", body: "{}" })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${API_URL}/api/movimentacoes/`)
    expect(init.credentials).toBe("include")
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json")
  })

  it("renova o token no 401 e repete a requisição", async () => {
    const fetchMock = stubFetch(401, 200, 200)
    const replace = stubLocation()

    const resp = await apiFetch("/api/itens/")

    expect(resp.status).toBe(200)
    expect(fetchMock.mock.calls[1][0]).toBe(`${API_URL}/api/users/token/refresh/`)
    expect(fetchMock.mock.calls[1][1].credentials).toBe("include")
    expect(replace).not.toHaveBeenCalled()
  })

  it("manda para o login quando o refresh falha", async () => {
    stubFetch(401, 401)
    const replace = stubLocation()

    const resp = await apiFetch("/api/itens/")

    expect(resp.status).toBe(401)
    expect(replace).toHaveBeenCalledWith("/login?next=%2Fdashboard")
  })

  it("leva o ?code= do QR junto para o login", async () => {
    stubFetch(401, 401)
    const replace = stubLocation("/", "?code=MO001")

    await apiFetch("/api/itens/?code=MO001")

    expect(replace).toHaveBeenCalledWith("/login?next=%2F%3Fcode%3DMO001")
  })

  it("na raiz sem parâmetros vai só para /login", async () => {
    stubFetch(401, 401)
    const replace = stubLocation("/")

    await apiFetch("/api/itens/")

    expect(replace).toHaveBeenCalledWith("/login")
  })

  it("não redireciona no 403", async () => {
    stubFetch(403)
    const replace = stubLocation()

    expect((await apiFetch("/api/itens/", { method: "POST", body: "{}" })).status).toBe(403)
    expect(replace).not.toHaveBeenCalled()
  })
})

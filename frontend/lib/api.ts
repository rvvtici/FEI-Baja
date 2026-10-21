export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const LOGIN_ROUTE = "/login"

// Várias requisições podem receber 401 ao mesmo tempo: todas esperam o mesmo refresh
let refreshing: Promise<boolean> | null = null

function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${API_URL}/api/users/token/refresh/`, { method: "POST", credentials: "include" })
    .then((resp) => resp.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

export function redirectToLogin() {
  // recarregar a página zera todo o estado de autenticação em memória
  if (typeof window !== "undefined" && window.location.pathname !== LOGIN_ROUTE) {
    window.location.replace(LOGIN_ROUTE)
  }
}

// Renova a sessão quando necessário
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")

  const send = () => fetch(`${API_URL}${path}`, { ...init, headers, credentials: "include" })

  let resp = await send()
  if (resp.status === 401 && (await refreshSession())) {
    resp = await send()
  }
  if (resp.status === 401) redirectToLogin()
  return resp
}

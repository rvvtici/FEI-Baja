"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { apiFetch, redirectToLogin } from "@/lib/api"
import { CurrentUser } from "@/components/types/types"

const CurrentUserContext = createContext<CurrentUser | null>(null)

// Só pode ser usado dentro do <AuthGuard>, onde o usuário já foi carregado
export function useCurrentUser(): CurrentUser {
  const user = useContext(CurrentUserContext)
  if (!user) throw new Error("useCurrentUser precisa estar dentro de <AuthGuard>")
  return user
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        // apiFetch já tenta o refresh e redireciona no 401
        const resp = await apiFetch("/api/users/user-info/")
        if (resp.ok) setUser(await resp.json())
        else redirectToLogin()
      } catch {
        redirectToLogin()
      }
    }
    check()
  }, [])

  if (!user) return null // ou um spinner
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"

const API = process.env.NEXT_PUBLIC_API_URL

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ok, setOk] = useState(false)

  useEffect(() => {
    const check = async () => {
      try {
        await axios.get(`${API}/api/users/user-info/`, { withCredentials: true })
        setOk(true)
      } catch (e: any) {
        if (e.response?.status === 401) {
          // access expirou: tenta renovar com o refresh
          try {
            await axios.post(`${API}/api/users/token/refresh/`, null, { withCredentials: true })
            await axios.get(`${API}/api/users/user-info/`, { withCredentials: true })
            setOk(true)
            return
          } catch {}
        }
        router.replace("/login")
      }
    }
    check()
  }, [router])

  if (!ok) return null // ou um spinner
  return <>{children}</>
}
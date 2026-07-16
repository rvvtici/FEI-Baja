"use client"

import { Bell, User, AlertTriangle, X } from "lucide-react"
import { navItems, type TabId } from "@/lib/navigation"
import { items, isBaixoEstoque } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

import Image from 'next/image';


type AppSidebarProps = {
  active: TabId
  onSelect: (id: TabId) => void
  open: boolean
  onClose: () => void
}

export function AppSidebar({ active, onSelect, open, onClose }: AppSidebarProps) {
  const baixoEstoque = items.filter(isBaixoEstoque)

  return (
    <>
      {/* Backdrop mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <div className="flex items-center gap-3">
            <Image
              src="/fei-baja.png"
              width={40}
              height={40}
              className="block p-[1px]"
              alt="Logo FEI Baja"
              loading="eager"
            />
            <div className="leading-tight">
              <p className="text-sm font-semibold">FEI-Baja</p>
              <p className="text-xs text-sidebar-foreground/60">Gestão de Estoque</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent md:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Alertas de baixo estoque */}
        <div className="px-3 py-3">
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3">
            <div className="mb-2 flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Baixo estoque · {baixoEstoque.length}
              </span>
            </div>
            <ul className="space-y-1.5">
              {baixoEstoque.slice(0, 3).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-sidebar-foreground/80">{item.nome}</span>
                  <span className="shrink-0 font-mono text-warning">
                    {item.quantidadeAtual}/{item.quantidadeMinima}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Conta */}
        <div className="border-t border-sidebar-border px-3 py-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent">
              <User className="h-4.5 w-4.5 text-sidebar-foreground/80" />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium">Equipe FEI-Baja</p>
              <p className="truncate text-xs text-sidebar-foreground/60">admin@feibaja.br</p>
            </div>
            <button
              className="relative rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent"
              aria-label="Alertas"
            >
              <Bell className="h-4.5 w-4.5" />
              {baixoEstoque.length > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

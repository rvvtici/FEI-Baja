"use client"

import { useMemo, useState } from "react"
import { Menu, QrCode } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { CompeticaoView } from "@/components/dashboard/competicao-view"
import { PlaceholderView } from "@/components/dashboard/placeholder-view"
import { Button } from "@/components/ui/button"
import { navItems, type TabId } from "@/lib/navigation"

export default function Page() {
  const [active, setActive] = useState<TabId>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const current = useMemo(() => navItems.find((n) => n.id === active)!, [active])

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        active={active}
        onSelect={(id) => {
          setActive(id)
          setSidebarOpen(false)
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold leading-tight">{current.label}</h1>
            <p className="truncate text-sm text-muted-foreground">{current.descricao}</p>
          </div>
            <a href="/">
              <Button variant="outline" className="gap-2">
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">Escanear</span>
              </Button>
            </a>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8">
          {active === "dashboard" ? (
            <DashboardView />
          ) : active === "competicao" ? (
            <CompeticaoView />
          ) : (
            <PlaceholderView icon={current.icon} title={current.label} description={current.descricao} />
          )}
        </main>
        
      </div>
    </div>
  )
}

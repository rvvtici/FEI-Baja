"use client"

import {
  Boxes,
  CheckCircle2,
  Handshake,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-card"
import {
  items,
  movimentacoes,
  isBaixoEstoque,
  categoriaLabels,
  type MovimentacaoTipo,
} from "@/lib/mock-data"

const emUso = items.reduce((acc, i) => acc + i.emUso, 0)
const totalUnidades = items.reduce((acc, i) => acc + i.quantidadeAtual, 0)
const disponiveis = totalUnidades - emUso
const abaixoMinimo = items.filter(isBaixoEstoque)

const movTipoConfig: Record<
  MovimentacaoTipo,
  { label: string; icon: typeof ArrowUpRight; className: string }
> = {
  retirada: { label: "Retirada", icon: ArrowUpRight, className: "bg-primary/10 text-primary" },
  devolucao: { label: "Devolução", icon: ArrowDownLeft, className: "bg-success/15 text-success" },
  emprestimo: { label: "Empréstimo", icon: Handshake, className: "bg-warning/15 text-warning" },
  cadastro: { label: "Cadastro", icon: Plus, className: "bg-secondary text-secondary-foreground" },
  compra: { label: "Compra", icon: Plus, className: "bg-secondary text-secondary-foreground" },
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function DashboardView() {
  return (
    <div className="space-y-6">
      {/* Ações rápidas */}
      <div className="flex flex-wrap gap-3">
        <Button className="gap-2">
          <ArrowUpRight className="h-4 w-4" />
          Retirar item
        </Button>
        <Button variant="outline" className="gap-2">
          <ArrowDownLeft className="h-4 w-4" />
          Devolver item
        </Button>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Novo item
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Itens cadastrados" value={items.length} hint={`${totalUnidades} unidades no total`} icon={Boxes} />
        <StatCard label="Disponíveis" value={disponiveis} hint="Prontos para uso" icon={CheckCircle2} tone="success" />
        <StatCard label="Em uso / emprestados" value={emUso} hint="Fora da oficina agora" icon={Handshake} />
        <StatCard
          label="Abaixo do mínimo"
          value={abaixoMinimo.length}
          hint="Precisam de reposição"
          icon={TrendingDown}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Movimentações recentes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Movimentações recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {movimentacoes.map((mov) => {
              const cfg = movTipoConfig[mov.tipo]
              const Icon = cfg.icon
              return (
                <div
                  key={mov.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cfg.className}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{mov.itemNome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {cfg.label} · {mov.quantidade}x · {mov.responsavel}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-xs text-muted-foreground">{mov.itemCodigo}</p>
                    <p className="text-xs text-muted-foreground">{formatHora(mov.data)}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Alertas de baixo estoque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Reposição necessária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {abaixoMinimo.map((item) => (
              <div key={item.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">{item.nome}</p>
                  <Badge variant="outline" className="shrink-0 font-mono text-xs">
                    {item.codigo}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{categoriaLabels[item.categoria]}</span>
                  <span className="font-medium text-warning">
                    {item.quantidadeAtual} de {item.quantidadeMinima} mín.
                  </span>
                </div>
                {/* Barra de nível */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-warning"
                    style={{
                      width: `${Math.min(100, (item.quantidadeAtual / item.quantidadeMinima) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

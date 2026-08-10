"use client"

import { useState, useEffect } from "react"

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
import { categoriaLabels, type MovimentacaoTipo } from "@/lib/mock-data"

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
  const [items, setItems] = useState<any[]>([])
  const [movimentacoes, setMovimentacoes] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      // const token = localStorage.getItem('access_token'); Somente para testes
      // const headers = {'Authorization': `Bearer ${token}`}; Somente para testes

      const headers = {};

      try {
        const [resItems, resMovimentacoes] = await Promise.all([
          fetch('http://localhost:8000/api/itens/', { headers }),
          fetch('http://localhost:8000/api/movimentacoes/', { headers }),
        ]);

        if (resItems.ok && resMovimentacoes.ok) {
          const dadosItems = await resItems.json();
          const dadosMovimentacoes = await resMovimentacoes.json();

          setItems(dadosItems);
          setMovimentacoes(dadosMovimentacoes);
        }
      } catch (error){
        console.error('Erro ao buscar dados:', error);
      }
    }
    fetchData();
  }, [])

  const totalQuantity = items.reduce((acc, i) => acc + (i.qty || 0), 0) // Soma de todas as unidades de todos os itens
  const abaixoMinimo = items.filter(i => i.status === 'Comprar' || i.status === 'Atenção') // Filtra os itens que estão abaixo do mínimo (status "Comprar" ou "Atenção")
  
  const emUso = 0 //Placeholder por enquanto (falta endpoint da API)
  const disponiveis = totalQuantity - emUso

  return (
    <div className="space-y-6">
      {/* Ações rápidas */}
      <div className="flex flex-wrap gap-3">
        <Button className="gap-2"><ArrowUpRight className="h-4 w-4" />Retirar item</Button>
        <Button variant="outline" className="gap-2"><ArrowDownLeft className="h-4 w-4" />Devolver item</Button>
        <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" />Novo item</Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Itens cadastrados" value={items.length} hint={`${totalQuantity} unidades no total`} icon={Boxes} />
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
            {movimentacoes.slice(0, 5).map((mov) => { // slice(0,5) para pegar as 5 últimas
              const cfg = movTipoConfig[mov.type.toLowerCase() as MovimentacaoTipo] || movTipoConfig['retirada']
              const Icon = cfg.icon
              return (
                <div key={mov.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cfg.className}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{mov.item_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {cfg.label} · {mov.quantity}x · {mov.user_name}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-xs text-muted-foreground">{mov.item_code}</p>
                    <p className="text-xs text-muted-foreground">{formatHora(mov.date)}</p>
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
                  <p className="text-sm font-medium leading-snug">{item.name}</p>
                  <Badge variant="outline" className="shrink-0 font-mono text-xs">
                    {item.code}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.category_name}</span>
                  <span className="font-medium text-warning">
                    {item.qty} de {item.minimum_qty} mín.
                  </span>
                </div>
                {/* Barra de nível */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-warning"
                    style={{
                      width: `${Math.min(100, (item.qty / item.minimum_qty) * 100)}%`,
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
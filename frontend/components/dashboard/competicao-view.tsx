"use client"

import { useMemo, useState } from "react"
import {
  Trophy,
  MapPin,
  CalendarDays,
  CheckCircle2,
  Circle,
  ListChecks,
  PackageCheck,
  User,
  Plus,
  Trash2,
  PackageOpen,
  ArrowLeftRight,
  Home,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatCard } from "@/components/dashboard/stat-card"
import {
  competicao,
  checklist as checklistInicial,
  itensProva as itensProvaInicial,
  checklistCategoriaLabels,
  type ChecklistCategoria,
  type ItemProva,
  type StatusRetorno,
} from "@/lib/mock-data"

const categoriaOrdem: ChecklistCategoria[] = ["mecanica", "eletrica", "seguranca", "documentos", "logistica"]

function diasRestantes(iso: string) {
  const alvo = new Date(iso).getTime()
  const hoje = Date.now()
  return Math.max(0, Math.ceil((alvo - hoje) / (1000 * 60 * 60 * 24)))
}

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
}

type Fase = "preparacao" | "conferencia"

export function CompeticaoView() {
  const [tarefas, setTarefas] = useState(checklistInicial)
  const [itens, setItens] = useState<ItemProva[]>(itensProvaInicial)
  const [fase, setFase] = useState<Fase>("preparacao")

  // form de novo item
  const [novoNome, setNovoNome] = useState("")
  const [novaQtd, setNovaQtd] = useState("1")

  const concluidas = tarefas.filter((t) => t.concluida).length
  const progresso = Math.round((concluidas / tarefas.length) * 100)

  const levados = itens.filter((i) => i.levado)
  const voltaram = itens.filter((i) => i.retorno === "voltou").length
  const ficaram = itens.filter((i) => i.retorno === "ficou").length
  const conferidos = voltaram + ficaram
  const pendentesConferencia = levados.length - conferidos

  const porCategoria = useMemo(() => {
    return categoriaOrdem
      .map((cat) => ({
        categoria: cat,
        tarefas: tarefas.filter((t) => t.categoria === cat),
      }))
      .filter((g) => g.tarefas.length > 0)
  }, [tarefas])

  const dias = diasRestantes(competicao.dataInicio)

  function toggleTarefa(id: string) {
    setTarefas((prev) => prev.map((t) => (t.id === id ? { ...t, concluida: !t.concluida } : t)))
  }

  function toggleLevado(id: string) {
    setItens((prev) => prev.map((i) => (i.id === id ? { ...i, levado: !i.levado } : i)))
  }

  function setRetorno(id: string, status: StatusRetorno) {
    setItens((prev) =>
      prev.map((i) => (i.id === id ? { ...i, retorno: i.retorno === status ? "pendente" : status } : i)),
    )
  }

  function adicionarItem() {
    const nome = novoNome.trim()
    const qtd = Number.parseInt(novaQtd, 10)
    if (!nome || Number.isNaN(qtd) || qtd < 1) return
    setItens((prev) => [
      ...prev,
      { id: `p-${Date.now()}`, nome, quantidade: qtd, levado: true, retorno: "pendente" },
    ])
    setNovoNome("")
    setNovaQtd("1")
  }

  function removerItem(id: string) {
    setItens((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da competição */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-balance text-lg font-semibold leading-tight">{competicao.nome}</h2>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {competicao.local}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatData(competicao.dataInicio)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4 rounded-xl bg-secondary px-5 py-3">
            <div className="text-center">
              <p className="text-3xl font-semibold tabular-nums text-primary">{dias}</p>
              <p className="text-xs text-muted-foreground">dias restantes</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Prontidão geral"
          value={`${progresso}%`}
          hint={`${concluidas} de ${tarefas.length} tarefas`}
          icon={ListChecks}
          tone={progresso === 100 ? "success" : "default"}
        />
        <StatCard
          label="Itens a levar"
          value={`${levados.length}`}
          hint="Marcados para a competição"
          icon={PackageCheck}
          tone="default"
        />
        <StatCard
          label="Conferência"
          value={`${conferidos}/${levados.length}`}
          hint={pendentesConferencia > 0 ? `${pendentesConferencia} a conferir` : "Tudo conferido"}
          icon={ArrowLeftRight}
          tone={levados.length > 0 && conferidos === levados.length ? "success" : "warning"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Checklist de tarefas */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Prontidão para a competição</span>
                <span className="font-semibold tabular-nums text-primary">{progresso}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progresso}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {porCategoria.map((grupo) => {
            const feitas = grupo.tarefas.filter((t) => t.concluida).length
            return (
              <Card key={grupo.categoria}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                  <CardTitle className="text-base">{checklistCategoriaLabels[grupo.categoria]}</CardTitle>
                  <Badge variant="outline" className="tabular-nums">
                    {feitas}/{grupo.tarefas.length}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-1">
                  {grupo.tarefas.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTarefa(t.id)}
                      aria-pressed={t.concluida}
                      className="flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted"
                    >
                      {t.concluida ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                      ) : (
                        <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium leading-snug ${
                            t.concluida ? "text-muted-foreground line-through" : ""
                          }`}
                        >
                          {t.titulo}
                        </p>
                        {t.descricao && <p className="mt-0.5 text-xs text-muted-foreground">{t.descricao}</p>}
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {t.responsavel}
                        </p>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Lista de itens levados + conferência */}
        <Card className="h-fit">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <PackageOpen className="h-4 w-4 text-primary" />
                Itens da competição
              </CardTitle>
              <Badge variant="outline" className="tabular-nums">
                {levados.length} itens
              </Badge>
            </div>
            {/* alternador de fase */}
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setFase("preparacao")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  fase === "preparacao"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Preparação
              </button>
              <button
                type="button"
                onClick={() => setFase("conferencia")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  fase === "conferencia"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Conferência
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {fase === "preparacao" ? (
              <>
                {/* adicionar item */}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label htmlFor="novo-item" className="mb-1 block text-xs text-muted-foreground">
                      Novo item
                    </label>
                    <Input
                      id="novo-item"
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) adicionarItem()
                      }}
                      placeholder="Ex: Chave de roda"
                      className="h-9"
                    />
                  </div>
                  <div className="w-16">
                    <label htmlFor="nova-qtd" className="mb-1 block text-xs text-muted-foreground">
                      Qtde
                    </label>
                    <Input
                      id="nova-qtd"
                      type="number"
                      min={1}
                      value={novaQtd}
                      onChange={(e) => setNovaQtd(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) adicionarItem()
                      }}
                      className="h-9"
                    />
                  </div>
                  <Button type="button" size="icon" onClick={adicionarItem} className="h-9 w-9 shrink-0">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Adicionar item</span>
                  </Button>
                </div>

                <div className="space-y-1">
                  {itens.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
                    >
                      <button
                        type="button"
                        onClick={() => toggleLevado(item.id)}
                        aria-pressed={item.levado}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        {item.levado ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                        )}
                        <span
                          className={`min-w-0 flex-1 truncate text-sm ${
                            item.levado ? "font-medium" : "text-muted-foreground"
                          }`}
                        >
                          {item.nome}
                        </span>
                        <Badge variant="secondary" className="shrink-0 tabular-nums">
                          {item.quantidade}x
                        </Badge>
                      </button>
                      <button
                        type="button"
                        onClick={() => removerItem(item.id)}
                        className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover {item.nome}</span>
                      </button>
                    </div>
                  ))}
                  {itens.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">Nenhum item adicionado ainda.</p>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* resumo da conferência */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted px-2 py-2">
                    <p className="text-lg font-semibold tabular-nums text-success">{voltaram}</p>
                    <p className="text-xs text-muted-foreground">voltaram</p>
                  </div>
                  <div className="rounded-lg bg-muted px-2 py-2">
                    <p className="text-lg font-semibold tabular-nums text-destructive">{ficaram}</p>
                    <p className="text-xs text-muted-foreground">ficaram</p>
                  </div>
                  <div className="rounded-lg bg-muted px-2 py-2">
                    <p className="text-lg font-semibold tabular-nums text-foreground">{pendentesConferencia}</p>
                    <p className="text-xs text-muted-foreground">pendentes</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {levados.map((item) => (
                    <div key={item.id} className="rounded-lg border p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.nome}</span>
                        <Badge variant="secondary" className="shrink-0 tabular-nums">
                          {item.quantidade}x
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRetorno(item.id, "voltou")}
                          aria-pressed={item.retorno === "voltou"}
                          className={`flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                            item.retorno === "voltou"
                              ? "border-transparent bg-success text-success-foreground"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Home className="h-3.5 w-3.5" />
                          Voltou
                        </button>
                        <button
                          type="button"
                          onClick={() => setRetorno(item.id, "ficou")}
                          aria-pressed={item.retorno === "ficou"}
                          className={`flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                            item.retorno === "ficou"
                              ? "border-transparent bg-destructive text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          Ficou
                        </button>
                      </div>
                    </div>
                  ))}
                  {levados.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Marque itens na aba Preparação para conferi-los aqui.
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

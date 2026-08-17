import type { LucideIcon } from "lucide-react"
// import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-card"
import React from "react";
import {
  Boxes,
  CheckCircle2,
  Handshake,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Circle,
  Badge,
  AlertTriangle,
  EllipsisVertical,
  Ellipsis,
  PiggyBank,
  Search
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  competicao,
  checklist as checklistInicial,
  itensProva as itensProvaInicial,
  checklistCategoriaLabels,
  type ChecklistCategoria,
  type ItemProva,
  type StatusRetorno,
} from "@/lib/mock-data"

  // form de novo item



export function FerramentasView() {

  const [novoNome, setNovoNome] = useState("")
  const [novaQtd, setNovaQtd] = useState("1")
  const [novoPreco, setNovoPreco] = useState("1")
  const [itens, setItens] = useState<ItemProva[]>(itensProvaInicial)
  const [pesquisa, setPesquisa] = useState("")

  const searchFilter = (array: ItemProva[]) => {
    const termo = pesquisa.trim().toLowerCase()
    if (!termo) return array
    return array.filter((el) => el.nome.toLowerCase().includes(termo))
  }

  const filtered = searchFilter(itens)

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

  function toggleLevado(id: string) {
    setItens((prev) => prev.map((i) => (i.id === id ? { ...i, levado: !i.levado } : i)))
  }

  function removerItem(id: string) {
    setItens((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-6">


      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Em uso / emprestados" value={3} hint="Fora da oficina agora" icon={Handshake} />
        <StatCard label="Itens cadastrados" value={1} hint={`${3} unidades no total`} icon={Boxes} />
        {/* <StatCard label="Disponíveis" value={2} hint="Prontos para uso" icon={CheckCircle2} tone="success" /> */}
    </div>



      <div className="flex flex-row gap-4">
        <div className="bg-card rounded-xl border border-border p-6shadow-sm flex-[2]">
          <h3 className="text-xl text-center font-semibold my-4">Ferramentas</h3>
              
            <span className="flex flex-row">
              <Input
                id="pequisa"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Ex: EL001"
                className="h-9"
                />
                <Search className="ml-2 m-1" />
              </span>


              <table className="rounded-lg border my-2 shadow-md table-auto w-full border-separate border-spacing-0 overflow-hidden">
                <thead className="items-center">
                  <tr className="">
                    <th dir="ltr" className="rounded-s-lg border p-1">Código</th>
                    <th dir="ltr" className="border p-1">Nome</th>
                    <th dir="ltr" className="border p-1">Unidade</th>
                    {/* <th dir="ltr" className="border p-1">un/R$</th> */}
                    <th dir="rtl" className="border p-1">Preço (R$)</th>
                    <th dir="rtl" className="rounded-s-lg border p-1"> </th>
                  </tr>
                </thead>
                <tbody>
                        {filtered.map((item) => (
                          <React.Fragment
                            key={item.id}
                          >
                          <tr className="text-center text-[14px] font-normal hover:bg-muted">
                            <td className="">{item.id}</td>
                            <td className="">{item.nome}</td>
                            <td className="">{item.quantidade}</td>
                            <td className="">{item.quantidade}</td>
                            
                            <td className="text-[10px] flex  justify-center">
                              <Button variant="ghost" size="lg" className="text-lg text-white hover:bg-muted hover:cursor-pointer">
                                <Ellipsis>

                                </Ellipsis>
                              </Button>
                            </td>
                          </tr>
                        </React.Fragment>
                        ))}
                        {filtered.length === 0 && (
                          <tr>
                            <td
                              colSpan={8}
                              className="py-6 text-center text-sm text-muted-foreground"
                            >
                              Nenhum item correspondente à pesquisa.
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>

            </div>



    <div className="rounded-xl border  shadow-sm w-full flex-1">
        {/* <div className="lg:col-span-2 grid grid-cols-1 xl:grid-cols-2 gap-6 items-start"> */}
          {/* CARD de Movimentações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Movimentações recentes de ferramentas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {/* Retornamos o .slice(0, 5) para mostrar só as 5 últimas */}
              {/* {movimentacoes.slice(0, 5).map((mov) => {
                const cfg = movTipoConfig[mov.action.toLowerCase() as MovimentacaoTipo] || movTipoConfig['retirada']
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
              })} */}
            </CardContent>
          </Card>

          {/* CARD de Reposições */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Reposições necessárias de ferramentas 
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Adicionamos o .slice(0, 5) aqui também para o card não ficar gigante se faltar muita peça */}
              {/* {abaixoMinimo.slice(0, 5).map((item) => (
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
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-warning"
                      style={{
                        width: `${Math.min(100, (item.qty / item.minimum_qty) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))} */}
            </CardContent>
          </Card>
        </div>
            {/* </div> */}


        </div>

    </div>
  )
}

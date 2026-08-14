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



export function OrcamentosView() {

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

  //Handling the input on our search bar
  const handleChange = (e) => {
    setPesquisa(e.target.value)
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

  function toggleLevado(id: string) {
    setItens((prev) => prev.map((i) => (i.id === id ? { ...i, levado: !i.levado } : i)))
  }

  function removerItem(id: string) {
    setItens((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap gap-3">
        <Button className="gap-2"><ArrowUpRight className="h-4 w-4" />Acessar anos anteriores</Button>
        {/* <Button variant="outline" className="gap-2"><ArrowDownLeft className="h-4 w-4" />Devolver item</Button>
        <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" />Novo item</Button> */}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orçamento restante" value={2000.0} icon={PiggyBank} />
        <StatCard label="Itens cadastrados em 2026" value={0} hint={`0 unidades no total`} icon={Boxes} />
      </div>



      <div className="flex flex-row gap-4">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm flex-[2]">
          <h3 className="text-xl text-center font-semibold mb-4">Itens registrados em 2026</h3>
              
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
                    <th dir="ltr" className="rounded-s-lg border p-1">ID</th>
                    <th dir="ltr" className="border p-1">Nome</th>
                    <th dir="rtl" className="rounded-s-lg border p-1">Preço</th>
                  </tr>
                </thead>
                <tbody>
                        {filtered.map((item) => (
                          <React.Fragment
                            key={item.id}
                          >
                          <tr className="hover:bg-muted">
                            <td className="text-center p-1 col-span-1">{item.id}</td>
                            <td className="p-1 col-span-4">{item.nome}</td>
                            <td className="text-center p-1 col-span-1">{item.quantidade}</td>
                          </tr>
                        </React.Fragment>
                        ))}
                        {itens.length === 0 && (
                          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum item adicionado ainda.</p>
                        )}
                    </tbody>
                  </table>

            </div>



            <div className="bg-card rounded-xl border border-border p-6 shadow-sm w-full flex-1">
                <h3 className="text-lg font-semibold mb-4 text-center">Registrar Novo Item</h3>
                {/* <RegisterItemForm onSuccessSave={loadData} />  */}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label htmlFor="novo-item" className="mb-1 block text-xs text-muted-foreground">
                      Código do item
                    </label>
                    <Input
                      id="novo-item"
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) adicionarItem()
                      }}
                      placeholder="Ex: EL001"
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


                  <div className="w-16">
                    <label htmlFor="nova-qtd" className="mb-1 block text-xs text-muted-foreground">
                      Preço/unidade
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
                <div>
                  <h3 className="text-base font-semibold">Nome correspondente ao item: </h3>
                  <h3 className="text-base font-semibold">Categoria correspondente ao item: </h3>
                </div>
            </div>


        </div>

    </div>
  )
}

import type { LucideIcon } from "lucide-react"
// import { Card } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
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
  Ellipsis,
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



export function LogsView() {

  const [novoNome, setNovoNome] = useState("")
  const [novaQtd, setNovaQtd] = useState("1")
  const [novoPreco, setNovoPreco] = useState("1")
  const [itens, setItens] = useState<ItemProva[]>(itensProvaInicial)
  const [pesquisa, setPesquisa] = useState("")

  const searchFilter = (array: ItemProva[]) => {
    const termo = pesquisa.trim().toLowerCase()
    if (!termo) return array
    return array.filter((el) => (el.id.toLowerCase().includes(termo)) || (el.nome.toLowerCase().includes(termo)))
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

      <div className="flex flex-row gap-4 px-10">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm flex-[2]">
          <h3 className="text-xl text-center font-semibold mb-4">Movimentações</h3>
              
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
                    <th className="border p-1">Código do item</th>
                    <th className="border p-1">Nome do item</th>
                    <th className="border p-1">Categoria do item</th>
                    <th className="border p-1">Responsável</th>
                    <th className="border p-1">Horário</th>
                    <th className="border p-1">Data</th>
                    <th dir="rtl" className="rounded-s-lg border p-1"></th>
                    
                  </tr>
                </thead>
                
                <tbody>
                        {filtered.map((item) => (
                          <React.Fragment
                            key={item.id}
                          >
                          <tr className="text-center text-[14px] p-1 font-normal hover:bg-muted">
                            <td className="p-1">{item.id}</td>
                            <td className="">codigo item</td>
                            <td className="">{item.nome}</td>
                            <td className="">categoria item</td>
                            <td className="">responsável</td>
                            <td className="">horário</td>
                            <td className="">data</td>
                            <td className="flex justify-center"><Ellipsis></Ellipsis></td>
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

        </div>

    </div>
  )
}

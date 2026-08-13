import type { LucideIcon } from "lucide-react"
// import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-card"
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

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orçamento atual" value={2000.0} hint={`reais restantes`} icon={PiggyBank} />
      </div>

        <div className="lg:col-span-2 flex flex-row gap-6">

            <div className="bg-card rounded-xl border border-border p-6 shadow-sm w-full">
                <h3 className="text-lg font-semibold mb-4">Itens registrados em 2026</h3>
                
                <span className="flex flex-row">
                  <Input
                    id="pequisa"
                    // value={novoNome}
                    // onChange={(e) => setNovoNome(e.target.value)}
                    // onKeyDown={(e) => {
                      //   if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) adicionarItem()
                      // }}
                      placeholder="Ex: EL001"
                      className="h-9"
                      />
                    <Search className="ml-2 m-1" />
                  </span>
                {/* <RegisterItemForm onSuccessSave={loadData} />  */}
                  <div className="space-y-1">

                    <div className="font-semibold text-lg group flex items-center gap-3 rounded-lg pt-3 transition-colors hover:bg-muted">
                      <span className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className={`min-w-0 flex-1 truncate`}>
                          <p>Nome</p>
                        </span>
                          <p>Preço</p>           
                      </span>
                    </div>

                  {itens.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-muted"
                    >
                      <span
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span className={`min-w-0 flex-1 truncate text-sm`}>

                          {item.nome}
                        </span>

                          {item.quantidade}
                      </span>

                    </div>
                  ))}
                  {itens.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">Nenhum item adicionado ainda.</p>
                  )}
                </div>
            </div>





            <div className="bg-card rounded-xl border border-border p-6 shadow-sm w-full">
                <h3 className="text-lg font-semibold mb-4">Registrar Novo Item</h3>
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

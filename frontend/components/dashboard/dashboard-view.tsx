"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import Barcode from "react-barcode"
import { Item, ItemMovement } from "@/components/types/types"
import {
  Boxes,
  CheckCircle2,
  Handshake,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  AlertTriangle,
  Check,
  Minus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-card"
import { categoriaLabels, type MovimentacaoTipo } from "@/lib/mock-data"
import { InventoryTable } from './inventory-table' 

type ItemDashboard = Pick<Item, "id" | "name"  | "code" | "status" | "qty" | "minimum_qty" | "category_name">
type ItemMovementDashboard = ItemMovement
type NewItemFormData = Omit<Item, "id" | "status" | "barcode" | "category_name">

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
  const [items, setItems] = useState<ItemDashboard[]>([])
  const [movimentacoes, setMovimentacoes] = useState<ItemMovementDashboard[]>([])
  const [activePanel, setActivePanel] = useState<'register' | 'movement'>('register')
  const [itemToMove, setItemToMove] = useState<Item | null>(null)

  const handleSelectTableItem = (item: Item) => {
    setItemToMove(item)
    setActivePanel('movement')
    window.scrollTo({top: 0, behavior: 'smooth'})
  }

  const loadData = async () => {
      // const token = localStorage.getItem('access_token'); Somente para testes
      // const headers = {'Authorization': `Bearer ${token}`}; Somente para testes

      const headers = {};

      try {
        const [resItems, resMovimentacoes] = await Promise.all([
          fetch('http://localhost:8000/api/itens/', { headers }),
          fetch('http://localhost:8000/api/movimentacoes/', { headers }),
        ]);

        if (resItems.ok && resMovimentacoes.ok) {
          setItems(await resItems.json());
          setMovimentacoes(await resMovimentacoes.json());
        }
      }catch (error){
        console.error('Erro ao buscar dados:', error);
      }
    }
    useEffect(() => {
      loadData()
  }, [])

  const totalQuantity = items.reduce((acc, i) => acc + (i.qty || 0), 0) // Soma de todas as unidades de todos os itens
  const abaixoMinimo = items.filter(i => i.status === 'Comprar' || i.status === 'Atenção') // Filtra os itens que estão abaixo do mínimo (status "Comprar" ou "Atenção")
  
  const emUso = 0 //Placeholder por enquanto (falta endpoint da API)
  const disponiveis = totalQuantity - emUso

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={() => setActivePanel('movement')} 
          variant={activePanel === 'movement' ? 'default' : 'outline'} 
          className="gap-2"
        >
          <ArrowUpRight className="h-4 w-4" />Retirar item
        </Button>
        
        <Button 
          onClick={() => setActivePanel('movement')} 
          variant={activePanel === 'movement' ? 'default' : 'outline'} 
          className="gap-2"
        >
          <ArrowDownLeft className="h-4 w-4" />Devolver item
        </Button>
        
        <Button 
          onClick={() => setActivePanel('register')} 
          variant={activePanel === 'register' ? 'default' : 'outline'} 
          className="gap-2"
        >
          <Plus className="h-4 w-4" />Novo item
        </Button>
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

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/10">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Inventário Geral</h3>
            </div>
            <InventoryTable items={items} onMovimentarClick={handleSelectTableItem} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            
            {/* CARD de Movimentações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Movimentações recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {movimentacoes.slice(0, 5).map((mov) => {
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
                })}
              </CardContent>
            </Card>

            {/* CARD de Reposições */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Reposição necessária
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {abaixoMinimo.slice(0, 5).map((item) => (
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
                ))}
              </CardContent>
            </Card>

          </div>
        </div>

        <div className="lg:col-span-1 bg-card rounded-xl border border-border p-6 shadow-sm w-full h-fit">
          {activePanel === 'register' && <RegisterItemForm onSuccessSave={loadData} />}
        </div>

      </div>

    </div>
  )
}

// Função para registro de itens
export function RegisterItemForm({onSuccessSave}: {onSuccessSave: () => void}){
const { register, handleSubmit, reset,  watch } = useForm<NewItemFormData>()
const [CreatedItem, setCreatedItem] = useState<Item | null>(null)
const [categories, setCategories] = useState<{ id: number; name: string; next_code: string; }[]>([])
const selectedCategoryId = watch('category')
const itemType = watch('item_type')

const currentCategory = categories.find(cat => cat.id.toString() === selectedCategoryId?.toString())
const prefix = currentCategory?.next_code ? currentCategory.next_code : 'Ex: ELT001'

// Carrega as categorias
const fetchCategories = async () => {
    try { 
      const resp = await fetch('http://localhost:8000/api/categorias/')
      if (resp.ok) {
        const data = await resp.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
    }
}
useEffect(() => {
  fetchCategories()
}, [])

const SaveItem = async (data: NewItemFormData) => {
  try {
    const resp = await fetch('http://localhost:8000/api/itens/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data), // Transforma tudo digitado em JSON
    })

    if (resp.ok) {
      const newItem = await resp.json()
      setCreatedItem(newItem)
      onSuccessSave() //Atualiza imediatamente o dashboard
      reset()
      fetchCategories()

    }
  } catch (error) {
    console.error('Erro ao criar item:', error)
  }
}

  if (CreatedItem) {
    return (
      <div className="flex flex-col items-center p-6 text-center">
        <h2 className="text-green-500 font-bold text-xl">Peça Cadastrada com Sucesso!</h2>
        <p>O código único gerado pelo sistema foi:</p>
        
        <div className="mt-4 p-4 bg-white rounded shadow">
            <Barcode value={CreatedItem.barcode} width={2} height={60} />
        </div>

        <button 
          onClick={() => setCreatedItem(null)}
          className="mt-6 p-2 bg-blue-600 text-white rounded"
        >
          Cadastrar nova peça
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(SaveItem)} className="flex flex-col gap-4">
      <div className="space-y-4 text-left w-full">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Nome do item</label>
          <input 
            type="text" 
            {...register("name")} 
            placeholder="Ex: Fusível 10A" 
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Tipo de Item</label>
          <select 
            {...register("item_type")}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="MATERIAL">Material</option>
            <option value="TOOL">Ferramenta</option>
            <option value="CONSUMABLE">Consumível</option>
          </select>
        </div>

        {itemType === 'MATERIAL' && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Dimensões</label>
            <input 
              type="text" 
              {...register("dimensions", { 
                required: itemType === 'MATERIAL' ? "As dimensões são obrigatórias para materiais" : false 
              })}
              placeholder="Ex: 10 x 10 x 10 cm"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        )}

        {itemType === 'TOOL' && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Fabricante / Marca</label>
            <input 
              type="text" 
              {...register("brand", { 
                required: itemType === 'TOOL' ? "A marca é obrigatória para ferramentas" : false 
              })} 
              placeholder="Ex: Makita "
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        )}

        {itemType === 'CONSUMABLE' && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Vencimento</label>
            <input 
              type="date" 
              {...register("brand", { 
                required: itemType === 'CONSUMABLE' ? "O vencimento é obrigatório para consumíveis" : false 
              })} 
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        )}
        
       <div>
          <label className="text-sm font-medium text-muted-foreground">Categoria</label>
          <select 
            {...register("category")}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Selecione uma categoria...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
        <label className="text-sm font-medium text-muted-foreground">
          Código <span className="text-xs text-muted-foreground">(Gerado automaticamente se vazio)</span>
        </label>
        <input 
          type="text" 
          {...register("code")} 
          placeholder={prefix}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">Estoque inicial </label>
            <input 
              type="number" 
              {...register("qty")} 
              placeholder="50" 
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">Estoque mínimo</label>
            <input 
              type="number" 
              {...register("minimum_qty")} 
              placeholder="15" 
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center opacity-50 pointer-events-none mt-4">
        <p className="text-sm">O Barcode único será gerado ao salvar:</p>
        <Barcode value="GERANDO..." width={1.5} height={40} displayValue={false} />
      </div>

      <button type="submit" className="bg-green-600 text-white p-2">
        Salvar Item
      </button>
    </form>
  )
}

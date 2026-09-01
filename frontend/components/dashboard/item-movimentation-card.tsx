"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import Barcode from "react-barcode"
import { Minus, Plus, Check } from "lucide-react"
import { Item } from "@/components/types/types"

interface ItemMovementDashboard {
  action: 'IN' | 'OUT';
  reason: string;
  quantity: number;
  observations: string;
  user: string;
}


interface ItemMovementFormProps {
  scannedItem?: Item | null;
  onSuccessSave: () => void;
}


export function ItemMovimentForm({ scannedItem, onSuccessSave }: ItemMovementFormProps) {
  const { register, handleSubmit, setValue, reset, watch } = useForm<ItemMovementDashboard>({
    defaultValues: {
      action: 'OUT',
      reason: 'USAGE',
      quantity: 1,
    }
  })
 
  const [selectedItem, setSelectedItem] = useState<Item | null>(scannedItem || null)

  useEffect(() => {
    if(scannedItem !== undefined){
        setSelectedItem(scannedItem)
        reset({ action: 'OUT', reason: 'USAGE', quantity: 1, observations: '' })
    }
  }, [scannedItem, reset])
 
  const currentAction = watch('action')
  const currentReason = watch('reason')


  const onSubmit = async (data: ItemMovementDashboard) => {
    if (!selectedItem) return


    try {
      const payload = {
        action: data.action,
        reason: data.reason,
        quantity: Number(data.quantity),
        observations: data.observations || "",
        item: selectedItem.id ,

        //⚠️ ATENÇÃO: TEMPORÁRIO ⚠️
        // O React não sabe quem está logado ainda. Forçamos um ID para o BD aceitar
        // Quando JWT estiver funcionando com Login, substituir o '1' pelo ID do usuário logado
        user: 1
      }


      console.log("Enviando Payload:", payload)


      // const resp = await fetch('http://localhost:8000/api/movimentacoes/', {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/movimentacoes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })


      if(resp.ok){
        reset()
        if (!scannedItem) setSelectedItem(null)
        onSuccessSave()
      } else {
        const errorData = await resp.json()
        alert(`O Django recusou os dados!\n\nMotivo detalhado:\n${JSON.stringify(errorData, null, 2)}`)
      }
    } catch(error){
      console.error('Erro de conexão ao criar movimentação:', error)
    }
  }


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {!selectedItem && (
        <div className="p-4 border border-dashed border-border rounded-lg bg-muted/30">
          <label className="text-sm font-medium text-foreground">Buscar peça para movimentar</label>
          <input
            type="text"
            placeholder="Digite o código da peça e aperte Enter..."
            className="w-full mt-2 p-2 rounded-md bg-background border border-input text-sm focus:ring-2 focus:ring-primary outline-none"
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const codigoDigitado = e.currentTarget.value
                if (!codigoDigitado) return
                try {
                  // const resp = await fetch(`http://localhost:8000/api/itens/?code=${codigoDigitado}`)
                  const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itens/?code=${codigoDigitado}`)
                  if (resp.ok) {
                    const dados = await resp.json()
                    if (dados.length > 0) setSelectedItem(dados[0])
                    else alert("Nenhuma peça encontrada com esse código.")
                  }
                } catch (error) {
                  console.error("Erro na busca:", error)
                }
              }
            }}
          />
        </div>
      )}


      {/* Item selecionado */}
      {selectedItem && (
        <div className="space-y-6">
         
          {/* HEADER com opção de trocar peça */}
          <div className="flex justify-between items-end pb-1">
            <h4 className="text-sm font-semibold text-foreground">Detalhes do Item</h4>
            {!scannedItem && (
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-xs font-semibold text-destructive hover:underline"
              >
                Trocar peça
              </button>
            )}
          </div>


          {/* CARD DE INFO */}
          <div className="flex items-center gap-5 p-4 border border-border rounded-xl bg-card shadow-sm">
           
            {/* BARCODE */}
            <div className="bg-white p-2 rounded-md border flex-shrink-0 flex flex-col items-center">
              <Barcode value={selectedItem.code} width={1.2} height={35} displayValue={false} margin={0} background="#ffffff" lineColor="#000000" />
              <span className="text-[10px] font-mono font-bold text-black mt-1.5 tracking-widest">{selectedItem.code}</span>
            </div>

            <div className="flex- grid grid-cols-2 gap-y-3 gap-x-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Nome</p>
                <p className="font-bold text-foreground text-sm truncate">{selectedItem.name}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Disponível</p>
                <p className="font-bold text-warning text-sm">{selectedItem.qty} unidades</p>
              </div>
              <div className="col-span-1">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Categoria</p>
                <p className="font-medium text-foreground text-sm">{selectedItem.category_name || "Geral"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Mínimo</p>
                <p className="font-bold text-amber-500 text-sm">{selectedItem.minimum_qty} unidades</p>
              </div>
            </div>
          </div>


          {/* BOTÕES */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Ação</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setValue('action', 'OUT')
                  setValue('reason', 'USAGE')
                }}
                className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                  currentAction === 'OUT'
                    ? 'border-red-500 bg-red-500/5'
                    : 'border-border bg-background hover:border-red-500/50'
                }`}
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentAction === 'OUT' ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  <Minus className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className={`font-bold ${currentAction === 'OUT' ? 'text-foreground' : 'text-muted-foreground'}`}>Retirar</p>

                </div>
              </button>


              <button
                type="button"
                onClick={() => {
                  setValue('action', 'IN')
                  setValue('reason', 'RETURN')
                }}
                className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                  currentAction === 'IN'
                    ? 'border-green-500 bg-green-500/5'
                    : 'border-border bg-background hover:border-green-500/50'
                }`}
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentAction === 'IN' ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  <Plus className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className={`font-bold ${currentAction === 'IN' ? 'text-foreground' : 'text-muted-foreground'}`}>Devolver</p>

                </div>
              </button>
            </div>
          </div>


          {/* MOTIVOS */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Motivo Específico</label>
            <div className="flex flex-wrap gap-2">
              {currentAction === 'OUT' ? (
                ['USAGE', 'LOSS', 'BREAKAGE', 'LOAN', 'MAINTENANCE'].map((motivo) => {
                  const labels: Record<string, string> = { USAGE: 'Uso Interno', LOSS: 'Perda', BREAKAGE: 'Quebra', LOAN: 'Empréstimo', MAINTENANCE: 'Manutenção' }
                  return (
                    <button key={motivo} type="button" onClick={() => setValue('reason', motivo)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors 
                        ${currentReason === motivo ? 'bg-foreground text-background border-foreground font-semibold' : 'bg-background text-foreground border-input hover:bg-muted'
                      }`}
                    >
                      {labels[motivo]}
                    </button>
                  )
                })
              ) : (
                ['RETURN', 'PURCHASE'].map((motivo) => {
                  const labels: Record<string, string> = { RETURN: 'Devolução', PURCHASE: 'Compra / Reposição' }
                  return (
                    <button key={motivo} type="button" onClick={() => setValue('reason', motivo)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                        currentReason === motivo ? 'bg-foreground text-background border-foreground font-semibold' : 'bg-background text-foreground border-input hover:bg-muted'
                      }`}
                    >
                      {labels[motivo]}
                    </button>
                  )
                })
              )}
            </div>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">Quantidade</label>
              <input
                type="number"
                min="1"
                {...register('quantity', { valueAsNumber: true, min: 1 })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">Responsável</label>
              <select
                {...register('user')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="current_user">Usuário Atual</option>
              </select>
            </div>
          </div>


          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Observação <span className="font-normal text-muted-foreground">(opcional)</span></label>
            <input
              type="text"
              placeholder="Adicionar observação..."
              {...register('observations')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-[#254EDb] hover:bg-[#1e3fb3] text-white font-semibold p-3.5 rounded-xl transition-colors shadow-sm mt-2"
          >
            <Check className="w-5 h-5" />
            Confirmar Movimentação
          </button>
        </div>
      )}
    </form>
  )
}


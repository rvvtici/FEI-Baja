"use client"

import { useEffect, useMemo, useState } from "react"
import { Printer, Ruler, Save, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiFetch } from "@/lib/api"
import { useCurrentUser } from "@/components/auth-guard"
import { NoPermission, NO_PERMISSION_MESSAGE } from "@/components/no-permission"
import { Item } from "@/components/types/types"
import {
  MAX_LABELS_PER_PDF,
  MAX_OFFSET_MM,
  apiErrorText,
  clampStartPosition,
  sheetUsage,
  type LabelSheetTemplate,
} from "@/lib/labels"
import { cn } from "@/lib/utils"

type LabelItem = Pick<Item, "id" | "code" | "name" | "category_name">
type Feedback = { kind: "error" | "ok"; text: string }
type Busy = "pdf" | "calibration" | "offsets" | null

const selectClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

const hasCode = (item: LabelItem) => Boolean(item.code?.trim())

// Abre o PDF na aba já aberta no clique (para o navegador não bloquear) ou, sem ela, baixa o arquivo
async function showPdf(resp: Response, tab: Window | null, filename: string) {
  const url = URL.createObjectURL(await resp.blob())
  if (tab && !tab.closed) {
    tab.location.href = url
  } else {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
  }
  setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000)
}

async function errorText(resp: Response): Promise<string> {
  if (resp.status === 403) return NO_PERMISSION_MESSAGE
  try {
    const data = await resp.json()
    if (Array.isArray(data?.items_without_code)) {
      const names = data.items_without_code.map((i: { name: string }) => i.name).join(", ")
      return `Estes itens estão sem código e não podem ter etiqueta: ${names}.`
    }
    return apiErrorText(data) || "Não foi possível concluir. Tente novamente."
  } catch {
    return "Não foi possível concluir. Tente novamente."
  }
}

export function LabelsView() {
  const { can_manage_labels } = useCurrentUser()

  const [templates, setTemplates] = useState<LabelSheetTemplate[]>([])
  const [items, setItems] = useState<LabelItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [templateId, setTemplateId] = useState<number | null>(null)
  const [startPosition, setStartPosition] = useState(1)
  const [search, setSearch] = useState("")
  // id do item -> número de cópias (só os selecionados)
  const [copies, setCopies] = useState<Record<number, number>>({})
  const [offsetX, setOffsetX] = useState("0.00")
  const [offsetY, setOffsetY] = useState("0.00")

  const [busy, setBusy] = useState<Busy>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const selectTemplate = (template: LabelSheetTemplate | undefined) => {
    setTemplateId(template?.id ?? null)
    setStartPosition(1)
    setOffsetX(template?.offset_x_mm ?? "0.00")
    setOffsetY(template?.offset_y_mm ?? "0.00")
  }

  useEffect(() => {
    if (!can_manage_labels) return
    const load = async () => {
      try {
        const [respTemplates, respItems] = await Promise.all([
          apiFetch("/api/etiquetas/modelos/"),
          apiFetch("/api/itens/"),
        ])
        if (!respTemplates.ok || !respItems.ok) {
          setLoadError(respTemplates.status === 403 ? NO_PERMISSION_MESSAGE : "Não foi possível carregar os dados.")
          return
        }
        const loaded: LabelSheetTemplate[] = (await respTemplates.json()).filter((t: LabelSheetTemplate) => t.active)
        setTemplates(loaded)
        setItems(await respItems.json())
        selectTemplate(loaded[0])
      } catch {
        setLoadError("Não foi possível carregar os dados.")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [can_manage_labels])

  const template = templates.find((t) => t.id === templateId)
  const perSheet = template?.labels_per_sheet ?? 0
  const total = Object.values(copies).reduce((sum, n) => sum + n, 0)
  const usage = sheetUsage(perSheet, startPosition, total)
  const tooMany = total > MAX_LABELS_PER_PDF

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter((i) => i.code?.toLowerCase().includes(term) || i.name.toLowerCase().includes(term))
  }, [items, search])

  const toggleItem = (item: LabelItem) => {
    if (!hasCode(item)) return
    setCopies((prev) => {
      const next = { ...prev }
      if (item.id in next) delete next[item.id]
      else next[item.id] = 1
      return next
    })
  }

  const setItemCopies = (id: number, value: string) => {
    const n = Math.min(Math.max(1, Math.trunc(Number(value)) || 1), MAX_LABELS_PER_PDF)
    setCopies((prev) => ({ ...prev, [id]: n }))
  }

  const selectFiltered = () => {
    setCopies((prev) => {
      const next = { ...prev }
      for (const item of filtered) if (hasCode(item) && !(item.id in next)) next[item.id] = 1
      return next
    })
  }

  // Aba aberta dentro do clique; o PDF chega depois e é carregado nela
  const requestPdf = async (kind: Exclude<Busy, "offsets" | null>, path: string, init: RequestInit, filename: string) => {
    setFeedback(null)
    setBusy(kind)
    const tab = window.open("", "_blank")
    try {
      const resp = await apiFetch(path, init)
      if (resp.ok) {
        await showPdf(resp, tab, filename)
      } else {
        tab?.close()
        setFeedback({ kind: "error", text: await errorText(resp) })
      }
    } catch {
      tab?.close()
      setFeedback({ kind: "error", text: "Erro de rede ao gerar o PDF." })
    } finally {
      setBusy(null)
    }
  }

  const printLabels = () => {
    if (!template) return
    const body = {
      template: template.id,
      start_position: startPosition,
      // na ordem da lista de itens
      items: items.filter((i) => i.id in copies).map((i) => ({ item: i.id, copies: copies[i.id] })),
    }
    return requestPdf("pdf", "/api/etiquetas/pdf/", { method: "POST", body: JSON.stringify(body) }, "etiquetas.pdf")
  }

  const printCalibration = () => {
    if (!template) return
    return requestPdf("calibration", `/api/etiquetas/modelos/${template.id}/calibracao/`, {}, "calibracao.pdf")
  }

  const saveOffsets = async () => {
    if (!template) return
    setFeedback(null)
    setBusy("offsets")
    try {
      const resp = await apiFetch(`/api/etiquetas/modelos/${template.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ offset_x_mm: offsetX || "0", offset_y_mm: offsetY || "0" }),
      })
      if (resp.ok) {
        const saved: LabelSheetTemplate = await resp.json()
        setTemplates((prev) => prev.map((t) => (t.id === saved.id ? saved : t)))
        setOffsetX(saved.offset_x_mm)
        setOffsetY(saved.offset_y_mm)
        setFeedback({ kind: "ok", text: "Ajustes salvos. Imprima a folha de calibração de novo para conferir." })
      } else {
        setFeedback({ kind: "error", text: await errorText(resp) })
      }
    } catch {
      setFeedback({ kind: "error", text: "Erro de rede ao salvar os ajustes." })
    } finally {
      setBusy(null)
    }
  }

  if (!can_manage_labels) return <NoPermission title="Etiquetas" />

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <Card className="px-6 py-10 text-center">
        <p className="text-sm text-red-500">{loadError}</p>
      </Card>
    )
  }

  const offsetsChanged = template && (offsetX !== template.offset_x_mm || offsetY !== template.offset_y_mm)

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
        <span className="font-semibold">Imprima em Tamanho real / Escala 100%, sem ajustar à página.</span>{" "}
        <span className="text-muted-foreground">
          Antes de usar uma folha adesiva, imprima a folha de calibração em papel comum e confira contra a luz.
        </span>
      </div>

      {feedback && (
        <p
          role="status"
          className={cn(
            "rounded-lg border px-4 py-3 text-sm font-medium",
            feedback.kind === "error"
              ? "border-red-500/30 bg-red-500/10 text-red-500"
              : "border-green-500/30 bg-green-500/10 text-green-600",
          )}
        >
          {feedback.text}
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* Itens */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Itens</CardTitle>
            <CardDescription>Marque os itens e informe quantas etiquetas de cada um.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-48 flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por código ou nome"
                  className="pl-8"
                  aria-label="Buscar item"
                />
              </div>
              <Button variant="outline" onClick={selectFiltered} disabled={filtered.length === 0}>
                Marcar todos da lista
              </Button>
              <Button variant="ghost" onClick={() => setCopies({})} disabled={total === 0}>
                Limpar
              </Button>
            </div>

            <div className="max-h-[28rem] overflow-y-auto rounded-lg border border-border">
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum item encontrado.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {filtered.map((item) => {
                    const selected = item.id in copies
                    const printable = hasCode(item)
                    return (
                      <li
                        key={item.id}
                        className={cn("flex items-center gap-3 px-3 py-2", !printable && "opacity-60")}
                      >
                        <input
                          type="checkbox"
                          id={`label-item-${item.id}`}
                          checked={selected}
                          disabled={!printable}
                          onChange={() => toggleItem(item)}
                          className="h-4 w-4 shrink-0"
                        />
                        <label htmlFor={`label-item-${item.id}`} className="min-w-0 flex-1 cursor-pointer">
                          <span className="block truncate text-sm font-medium">{item.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {printable ? (
                              <>
                                <span className="font-mono">{item.code}</span> · {item.category_name || "Geral"}
                              </>
                            ) : (
                              "Sem código: cadastre o código para poder imprimir a etiqueta"
                            )}
                          </span>
                        </label>
                        {selected && (
                          <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                            Cópias
                            <Input
                              type="number"
                              min={1}
                              max={MAX_LABELS_PER_PDF}
                              value={copies[item.id]}
                              onChange={(e) => setItemCopies(item.id, e.target.value)}
                              className="w-20"
                            />
                          </label>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Folha */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Folha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum modelo de folha ativo.</p>
              ) : (
                <>
                  <div>
                    <label htmlFor="label-template" className="text-sm font-medium text-muted-foreground">
                      Modelo de folha
                    </label>
                    <select
                      id="label-template"
                      value={templateId ?? ""}
                      onChange={(e) => selectTemplate(templates.find((t) => t.id === Number(e.target.value)))}
                      className={cn(selectClass, "mt-1")}
                    >
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    {template?.notes && <p className="mt-1 text-xs text-warning">{template.notes}</p>}
                  </div>

                  {template && (
                    <>
                      <div>
                        <label htmlFor="label-start" className="text-sm font-medium text-muted-foreground">
                          Posição inicial <span className="text-xs">(1 a {perSheet})</span>
                        </label>
                        <Input
                          id="label-start"
                          type="number"
                          min={1}
                          max={perSheet}
                          value={startPosition}
                          onChange={(e) => setStartPosition(clampStartPosition(Number(e.target.value), perSheet))}
                          className="mt-1 w-24"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Para reaproveitar uma folha já usada. Clique numa posição da prévia para começar nela.
                        </p>
                      </div>

                      <SheetPreview
                        template={template}
                        startPosition={startPosition}
                        usedTo={usage.firstSheetTo}
                        onPick={setStartPosition}
                      />

                      <p className="text-sm">
                        {total === 0 ? (
                          <span className="text-muted-foreground">Nenhum item selecionado.</span>
                        ) : (
                          <>
                            <span className="font-semibold">{total}</span> etiqueta{total > 1 ? "s" : ""} em{" "}
                            <span className="font-semibold">{usage.sheets}</span> folha{usage.sheets > 1 ? "s" : ""}
                            {usage.sheets > 1 && (
                              <span className="text-muted-foreground"> (a última usa {usage.lastSheetCount})</span>
                            )}
                          </>
                        )}
                      </p>
                      {tooMany && (
                        <p className="text-xs font-medium text-red-500">
                          O máximo por PDF é {MAX_LABELS_PER_PDF} etiquetas. Divida em mais de uma impressão.
                        </p>
                      )}

                      <Button
                        onClick={printLabels}
                        disabled={total === 0 || tooMany || busy !== null}
                        isLoading={busy === "pdf"}
                        className="w-full gap-2"
                        size="lg"
                      >
                        <Printer className="h-4 w-4" />
                        {busy === "pdf" ? "Gerando PDF..." : "Gerar PDF das etiquetas"}
                      </Button>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {template && (
            <Card>
              <CardHeader>
                <CardTitle>Calibração</CardTitle>
                <CardDescription>
                  Se os contornos da folha de calibração não caírem em cima das etiquetas, corrija os ajustes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  onClick={printCalibration}
                  disabled={busy !== null}
                  isLoading={busy === "calibration"}
                  className="w-full gap-2"
                >
                  <Ruler className="h-4 w-4" />
                  Imprimir folha de calibração
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="label-offset-x" className="text-xs font-medium text-muted-foreground">
                      Ajuste horizontal (mm)
                    </label>
                    <Input
                      id="label-offset-x"
                      type="number"
                      step="0.1"
                      min={-MAX_OFFSET_MM}
                      max={MAX_OFFSET_MM}
                      value={offsetX}
                      onChange={(e) => setOffsetX(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="label-offset-y" className="text-xs font-medium text-muted-foreground">
                      Ajuste vertical (mm)
                    </label>
                    <Input
                      id="label-offset-y"
                      type="number"
                      step="0.1"
                      min={-MAX_OFFSET_MM}
                      max={MAX_OFFSET_MM}
                      value={offsetY}
                      onChange={(e) => setOffsetY(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Positivo move a impressão para a direita e para baixo; negativo, para a esquerda e para cima. Limite
                  de {MAX_OFFSET_MM} mm.
                </p>

                <Button
                  variant="secondary"
                  onClick={saveOffsets}
                  disabled={!offsetsChanged || busy !== null}
                  isLoading={busy === "offsets"}
                  className="w-full gap-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar ajustes
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

type SheetPreviewProps = {
  template: LabelSheetTemplate
  startPosition: number
  usedTo: number
  onPick: (position: number) => void
}

// Prévia da primeira folha: quais posições ficam vazias (já usadas) e quais serão impressas
function SheetPreview({ template, startPosition, usedTo, onPick }: SheetPreviewProps) {
  const positions = Array.from({ length: template.labels_per_sheet }, (_, i) => i + 1)
  const ratio = `${Number(template.label_width_mm)} / ${Number(template.label_height_mm)}`

  return (
    <div>
      <div
        className="mx-auto grid max-w-64 gap-0.5 rounded-md border border-border bg-muted/30 p-2"
        style={{ gridTemplateColumns: `repeat(${template.columns}, minmax(0, 1fr))` }}
        role="group"
        aria-label="Prévia da primeira folha"
      >
        {positions.map((position) => {
          const skipped = position < startPosition
          const printed = position >= startPosition && position <= usedTo
          return (
            <button
              key={position}
              type="button"
              onClick={() => onPick(position)}
              style={{ aspectRatio: ratio }}
              title={`Começar na posição ${position}`}
              aria-label={`Posição ${position}${printed ? ", será impressa" : skipped ? ", pulada" : ", livre"}`}
              className={cn(
                "flex min-h-4 items-center justify-center rounded-[3px] border text-[10px] leading-none transition-colors",
                printed && "border-primary bg-primary font-semibold text-primary-foreground",
                skipped && "border-dashed border-border bg-transparent text-muted-foreground/50 line-through",
                !printed && !skipped && "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {position}
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-primary" /> Será impressa
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-[2px] border border-dashed border-border" /> Pulada (já usada)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-[2px] border border-border bg-background" /> Livre
        </span>
      </div>
    </div>
  )
}

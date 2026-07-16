export type Categoria = "ferramenta" | "peca" | "consumivel"

export type Item = {
  id: string
  codigo: string
  nome: string
  descricao: string
  categoria: Categoria
  preco: number
  quantidadeAtual: number
  quantidadeMinima: number
  emUso: number
  local: string
}

export type MovimentacaoTipo = "retirada" | "devolucao" | "emprestimo" | "cadastro" | "compra"

export type Movimentacao = {
  id: string
  itemNome: string
  itemCodigo: string
  tipo: MovimentacaoTipo
  quantidade: number
  responsavel: string
  data: string // ISO
}

export const categoriaLabels: Record<Categoria, string> = {
  ferramenta: "Ferramenta",
  peca: "Peça",
  consumivel: "Consumível",
}

export const items: Item[] = [
  {
    id: "1",
    codigo: "FER-0012",
    nome: "Torquímetro 1/2\" 20-210Nm",
    descricao: "Torquímetro de estalo, faixa 20 a 210 Nm",
    categoria: "ferramenta",
    preco: 480,
    quantidadeAtual: 3,
    quantidadeMinima: 2,
    emUso: 1,
    local: "Armário A · Gaveta 2",
  },
  {
    id: "2",
    codigo: "FER-0034",
    nome: "Jogo de Chaves Allen",
    descricao: "Jogo com 9 chaves Allen métricas 1.5–10mm",
    categoria: "ferramenta",
    preco: 95,
    quantidadeAtual: 5,
    quantidadeMinima: 3,
    emUso: 2,
    local: "Armário A · Gaveta 1",
  },
  {
    id: "3",
    codigo: "FER-0051",
    nome: "Furadeira de Impacto",
    descricao: "Furadeira 750W com maleta e brocas",
    categoria: "ferramenta",
    preco: 350,
    quantidadeAtual: 2,
    quantidadeMinima: 1,
    emUso: 2,
    local: "Bancada 3",
  },
  {
    id: "4",
    codigo: "PEC-0102",
    nome: "Rolamento 6204 ZZ",
    descricao: "Rolamento rígido de esferas, uso na transmissão",
    categoria: "peca",
    preco: 28,
    quantidadeAtual: 4,
    quantidadeMinima: 6,
    emUso: 0,
    local: "Prateleira B · Caixa 4",
  },
  {
    id: "5",
    codigo: "PEC-0140",
    nome: "Amortecedor Traseiro",
    descricao: "Amortecedor regulável do protótipo 2024",
    categoria: "peca",
    preco: 1250,
    quantidadeAtual: 1,
    quantidadeMinima: 2,
    emUso: 0,
    local: "Prateleira C",
  },
  {
    id: "6",
    codigo: "CON-0203",
    nome: "Parafuso M8 x 30 (Inox)",
    descricao: "Parafuso sextavado inox, contagem estimada",
    categoria: "consumivel",
    preco: 1.2,
    quantidadeAtual: 180,
    quantidadeMinima: 100,
    emUso: 0,
    local: "Estoque Visual · Compartimento 12",
  },
  {
    id: "7",
    codigo: "CON-0211",
    nome: "Spray Desengripante WD-40",
    descricao: "Lata 300ml de desengripante multiuso",
    categoria: "consumivel",
    preco: 32,
    quantidadeAtual: 2,
    quantidadeMinima: 4,
    emUso: 0,
    local: "Armário D · Prateleira Sprays",
  },
  {
    id: "8",
    codigo: "CON-0230",
    nome: "Abraçadeira Nylon 200mm",
    descricao: "Pacote com abraçadeiras plásticas, contagem estimada",
    categoria: "consumivel",
    preco: 0.3,
    quantidadeAtual: 45,
    quantidadeMinima: 80,
    emUso: 0,
    local: "Estoque Visual · Compartimento 3",
  },
  {
    id: "9",
    codigo: "FER-0060",
    nome: "Multímetro Digital",
    descricao: "Multímetro para diagnóstico elétrico",
    categoria: "ferramenta",
    preco: 140,
    quantidadeAtual: 2,
    quantidadeMinima: 1,
    emUso: 0,
    local: "Armário A · Gaveta 3",
  },
  {
    id: "10",
    codigo: "CON-0245",
    nome: "Óleo Lubrificante Corrente",
    descricao: "Frasco 500ml de óleo para corrente",
    categoria: "consumivel",
    preco: 45,
    quantidadeAtual: 6,
    quantidadeMinima: 3,
    emUso: 0,
    local: "Armário D · Prateleira Óleos",
  },
]

export const movimentacoes: Movimentacao[] = [
  {
    id: "m1",
    itemNome: "Furadeira de Impacto",
    itemCodigo: "FER-0051",
    tipo: "retirada",
    quantidade: 1,
    responsavel: "Lucas Andrade",
    data: "2026-07-16T09:24:00",
  },
  {
    id: "m2",
    itemNome: "Torquímetro 1/2\" 20-210Nm",
    itemCodigo: "FER-0012",
    tipo: "emprestimo",
    quantidade: 1,
    responsavel: "Oficina Aero-FEI",
    data: "2026-07-16T08:50:00",
  },
  {
    id: "m3",
    itemNome: "Jogo de Chaves Allen",
    itemCodigo: "FER-0034",
    tipo: "devolucao",
    quantidade: 1,
    responsavel: "Marina Costa",
    data: "2026-07-15T18:10:00",
  },
  {
    id: "m4",
    itemNome: "Spray Desengripante WD-40",
    itemCodigo: "CON-0211",
    tipo: "retirada",
    quantidade: 2,
    responsavel: "Pedro Henrique",
    data: "2026-07-15T15:32:00",
  },
  {
    id: "m5",
    itemNome: "Multímetro Digital",
    itemCodigo: "FER-0060",
    tipo: "cadastro",
    quantidade: 2,
    responsavel: "Admin",
    data: "2026-07-14T11:05:00",
  },
]

// ---- Competição ----

export type ChecklistCategoria = "mecanica" | "eletrica" | "seguranca" | "documentos" | "logistica"

export type ChecklistTarefa = {
  id: string
  titulo: string
  descricao?: string
  categoria: ChecklistCategoria
  responsavel: string
  concluida: boolean
}

export type StatusRetorno = "pendente" | "voltou" | "ficou"

export type ItemProva = {
  id: string
  nome: string
  quantidade: number
  // fase de preparação: item foi separado/embarcado para a competição
  levado: boolean
  // fase de conferência (pós-competição): voltou, ficou ou ainda não conferido
  retorno: StatusRetorno
}

export const competicao = {
  nome: "Competição Baja SAE Brasil 2027",
  local: "Piracicaba · SP",
  dataInicio: "2027-04-15T08:00:00",
  dataFim: "2027-04-18T18:00:00",
}

export const checklistCategoriaLabels: Record<ChecklistCategoria, string> = {
  mecanica: "Mecânica",
  eletrica: "Elétrica",
  seguranca: "Segurança",
  documentos: "Documentos",
  logistica: "Logística",
}

export const checklist: ChecklistTarefa[] = [
  { id: "c1", titulo: "Revisão de torque das rodas", descricao: "Conferir torque conforme especificação do projeto", categoria: "mecanica", responsavel: "Lucas Andrade", concluida: true },
  { id: "c2", titulo: "Sangria do sistema de freios", categoria: "mecanica", responsavel: "Marina Costa", concluida: true },
  { id: "c3", titulo: "Ajuste da suspensão traseira", descricao: "Regulagem dos amortecedores para pista", categoria: "mecanica", responsavel: "Pedro Henrique", concluida: false },
  { id: "c4", titulo: "Alinhamento e cambagem", categoria: "mecanica", responsavel: "Lucas Andrade", concluida: false },
  { id: "c5", titulo: "Teste da bateria e chicote", descricao: "Verificar continuidade e isolamento", categoria: "eletrica", responsavel: "Rafael Lima", concluida: true },
  { id: "c6", titulo: "Kill switch externo e interno", categoria: "seguranca", responsavel: "Rafael Lima", concluida: true },
  { id: "c7", titulo: "Inspeção do cinto de 5 pontos", categoria: "seguranca", responsavel: "Marina Costa", concluida: false },
  { id: "c8", titulo: "Verificar extintor e suporte", categoria: "seguranca", responsavel: "Pedro Henrique", concluida: false },
  { id: "c9", titulo: "Entregar relatório de projeto", descricao: "Upload no portal da SAE até o prazo", categoria: "documentos", responsavel: "Admin", concluida: true },
  { id: "c10", titulo: "Ficha técnica assinada", categoria: "documentos", responsavel: "Admin", concluida: false },
  { id: "c11", titulo: "Seguro dos membros da equipe", categoria: "documentos", responsavel: "Admin", concluida: false },
  { id: "c12", titulo: "Carregar protótipo no trailer", categoria: "logistica", responsavel: "Equipe", concluida: false },
  { id: "c13", titulo: "Organizar caixa de ferramentas de pista", categoria: "logistica", responsavel: "Lucas Andrade", concluida: false },
]

export const itensProva: ItemProva[] = [
  { id: "p1", nome: "Torquímetro 1/2\" 20-210Nm", quantidade: 1, levado: true, retorno: "pendente" },
  { id: "p2", nome: "Jogo de Chaves Allen", quantidade: 2, levado: true, retorno: "pendente" },
  { id: "p3", nome: "Furadeira de Impacto", quantidade: 1, levado: true, retorno: "pendente" },
  { id: "p4", nome: "Multímetro Digital", quantidade: 1, levado: false, retorno: "pendente" },
  { id: "p5", nome: "Amortecedor Traseiro (reserva)", quantidade: 1, levado: false, retorno: "pendente" },
  { id: "p6", nome: "Rolamento 6204 ZZ (reserva)", quantidade: 4, levado: true, retorno: "pendente" },
  { id: "p7", nome: "Spray Desengripante WD-40", quantidade: 2, levado: false, retorno: "pendente" },
  { id: "p8", nome: "Abraçadeira Nylon 200mm", quantidade: 30, levado: true, retorno: "pendente" },
]

export function isBaixoEstoque(item: Item) {
  return item.quantidadeAtual <= item.quantidadeMinima
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

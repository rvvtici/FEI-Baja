import {
  LayoutDashboard,
  Wrench,
  Wallet,
  Trophy,
  Boxes,
  Package,
  ScrollText,
  type LucideIcon,
} from "lucide-react"

export type TabId =
  | "dashboard"
  | "ferramentas"
  | "orcamentos"
  | "competicao"
  | "estoque-visual"
  | "estoque-geral"
  | "logs"

export type NavItem = {
  id: TabId
  label: string
  icon: LucideIcon
  descricao: string
}

export const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, descricao: "Visão geral da oficina" },
  { id: "ferramentas", label: "Ferramentas", icon: Wrench, descricao: "Empréstimos e disponibilidade" },
  { id: "orcamentos", label: "Orçamentos", icon: Wallet, descricao: "Gastos e verba anual" },
  { id: "competicao", label: "Competição", icon: Trophy, descricao: "Checklist para abril" },
  { id: "estoque-visual", label: "Estoque Visual", icon: Boxes, descricao: "Parafusos, abraçadeiras (estimado)" },
  { id: "estoque-geral", label: "Estoque Geral", icon: Package, descricao: "Armários, sprays e óleos" },
  { id: "logs", label: "Logs", icon: ScrollText, descricao: "Movimentações e auditoria" },
]

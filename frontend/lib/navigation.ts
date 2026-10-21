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
import type { CurrentUser } from "@/components/types/types"

export type TabId =
  | "dashboard"
  | "ferramentas"
  | "orcamentos"
  | "competicao"
  | "estoque-visual"
  | "estoque-geral"
  | "logs"

// export type CategoriasId = 
//   | "mecanica"
//   | "eletrica"
//   | "oficina"
//   | "cdm"

// export type CategoriasEstoque = {
//   id: CategoriasId
//   label: string
//   descricao: string
//   icon: LucideIcon
//   // icon: LucideIcon
// }

export type NavItem = {
  id: TabId
  label: string
  icon: LucideIcon
  descricao: string
  // flag de /api/users/user-info/ exigida para ver a aba
  requires?: "can_view_logs" | "can_register_items" | "can_manage_users"
  // categorias?: CategoriasEstoque[]
}

export const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, descricao: "Visão geral da oficina" },
  { id: "estoque-geral", label: "Estoque", icon: Package, descricao: "Armários, sprays e óleos", 
    // categorias: [
    //   {id: "mecanica", label: "Mecânica", icon: Package, descricao: "mecanica"},
    //   {id: "eletrica", label: "Elétrica", icon: Package, descricao: "eletrica"}
    // ]  
  },
  { id: "ferramentas", label: "Ferramentas", icon: Wrench, descricao: "Empréstimos e disponibilidade" },
  { id: "orcamentos", label: "Orçamentos", icon: Wallet, descricao: "Gastos e verba anual" },
  { id: "competicao", label: "Competição", icon: Trophy, descricao: "Checklist para abril" },
  // { id: "estoque-visual", label: "Estoque Visual", icon: Boxes, descricao: "Parafusos, abraçadeiras (estimado)" },
  { id: "logs", label: "Logs", icon: ScrollText, descricao: "Movimentações e auditoria", requires: "can_view_logs" },
]

export function canAccess(item: NavItem, user: CurrentUser): boolean {
  return !item.requires || user[item.requires]
}

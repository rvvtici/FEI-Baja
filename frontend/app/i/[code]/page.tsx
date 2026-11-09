import { redirect } from "next/navigation"
import { itemShortLinkTarget } from "@/lib/item-code"

// Link curto e estável gravado no QR das etiquetas: /i/<código>.
// Por enquanto leva à tela que abre a peça pelo código (e passa pelo login, se preciso);
// no futuro vira a tela de detalhe do item sem precisar reimprimir etiquetas.
export default async function ItemShortLink({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  let decoded = code
  try {
    decoded = decodeURIComponent(code)
  } catch {
    // já veio decodificado
  }

  redirect(itemShortLinkTarget(decoded.trim()))
}

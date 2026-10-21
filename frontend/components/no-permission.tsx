import { Lock } from "lucide-react"
import { Card } from "@/components/ui/card"

export const NO_PERMISSION_MESSAGE = "Você não tem permissão para fazer isso. Fale com um administrador."

export function NoPermission({ title = "Sem permissão" }: { title?: string }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <Lock className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-md text-pretty text-sm text-muted-foreground">{NO_PERMISSION_MESSAGE}</p>
    </Card>
  )
}

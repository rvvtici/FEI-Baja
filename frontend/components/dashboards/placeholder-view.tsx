import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

type PlaceholderViewProps = {
  icon: LucideIcon
  title: string
  description: string
}

export function PlaceholderView({ icon: Icon, title, description }: PlaceholderViewProps) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <Icon className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-md text-pretty text-sm text-muted-foreground">{description}</p>
      <p className="mt-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        Em construção · em breve
      </p>
    </Card>
  )
}

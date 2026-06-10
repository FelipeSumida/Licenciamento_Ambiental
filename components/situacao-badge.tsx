import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { SituacaoProcesso } from "@/lib/types"

export function SituacaoBadge({
  situacao,
  className,
}: {
  situacao: SituacaoProcesso
  className?: string
}) {
  const isAberta = situacao === "Aberta"
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        isAberta
          ? "border-amber-300 bg-amber-50 text-amber-700"
          : "border-emerald-300 bg-emerald-50 text-emerald-700",
        className,
      )}
    >
      <span
        className={cn(
          "mr-1.5 inline-block size-1.5 rounded-full",
          isAberta ? "bg-amber-500" : "bg-emerald-500",
        )}
        aria-hidden="true"
      />
      {situacao}
    </Badge>
  )
}

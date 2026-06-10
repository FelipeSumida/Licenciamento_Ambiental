"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FolderOpen, CheckCircle2, FileStack, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: number
  icon: React.ElementType
  accent?: "primary" | "emerald" | "amber" | "blue"
}

const accents: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
}

function StatCard({ label, value, icon: Icon, accent = "primary" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-lg",
            accents[accent],
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {value}
          </p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsCards({
  abertos,
  concluidos,
}: {
  abertos: number
  concluidos: number
}) {
  const total = abertos + concluidos
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Processos abertos"
        value={abertos}
        icon={FolderOpen}
        accent="amber"
      />
      <StatCard
        label="Processos concluídos"
        value={concluidos}
        icon={CheckCircle2}
        accent="emerald"
      />
      <StatCard label="Total de processos" value={total} icon={FileStack} accent="primary" />
      <StatCard label="Aguardando atendimento" value={abertos} icon={Clock} accent="blue" />
    </div>
  )
}

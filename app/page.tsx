"use client"

import { AppShell } from "@/components/app-shell"
import { ApiStatusBanner } from "@/components/api-status-banner"
import { StatsCards } from "@/components/dashboard/stats-cards"
import {
  GraficoPorArea,
  GraficoPorTematica,
} from "@/components/dashboard/graficos"
import { useResumoDashboard } from "@/lib/hooks"

export default function PainelPage() {
  const { resumo } = useResumoDashboard()

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-balance text-foreground">
          Painel de Acompanhamento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral dos processos de licenciamento ambiental
        </p>
      </header>

      <ApiStatusBanner />

      <div className="space-y-6">
        <StatsCards
          abertos={resumo.abertos}
          concluidos={resumo.concluidos}
          total={resumo.total}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <GraficoPorArea dados={resumo.porArea} />
          <GraficoPorTematica dados={resumo.porTematica} />
        </div>
      </div>
    </AppShell>
  )
}

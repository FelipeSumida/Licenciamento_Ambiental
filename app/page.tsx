"use client"

import { AppShell } from "@/components/app-shell"
import { ApiStatusBanner } from "@/components/api-status-banner"
import { StatsCards } from "@/components/dashboard/stats-cards"
import Image from "next/image";
import {
  GraficoPorArea,
} from "@/components/dashboard/graficos"
import { useResumoDashboard } from "@/lib/hooks"

export default function PainelPage() {
  const { resumo } = useResumoDashboard()

  return (
    <AppShell>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Painel de Acompanhamento
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Visão geral dos processos de licenciamento ambiental
          </p>
        </div>

        <Image
          src="/logoder.png"
          alt="Logo DER"
          width={180}
          height={80}
          priority
        />
      </header>

      <ApiStatusBanner />

      <div className="space-y-6">
        <StatsCards
          abertos={resumo.abertos}
          concluidos={resumo.concluidos}
          total={resumo.total}
        />

        <div>
          <GraficoPorArea dados={resumo.porArea} />
        </div>
      </div>
    </AppShell>
  )
}

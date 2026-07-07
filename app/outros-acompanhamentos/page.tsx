"use client"

import Image from "next/image"
import { AppShell } from "@/components/app-shell"
import { ApiStatusBanner } from "@/components/api-status-banner"
import { TabelaProcessos } from "@/components/processos/tabela-processos"
import { useProcessos } from "@/lib/hooks"

export default function OutrosAcompanhamentosPage() {
  const { processos, isLoading } = useProcessos()

  const outros = processos.filter((p) =>
    ["SUP.OBRA", "OP-FAUNA", "OUTROS"].includes(p.classificacao)
  )

  return (
    <AppShell>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-balance text-foreground">
            Outros acompanhamentos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lista de processos classificados como SUP.OBRA, OP-FAUNA ou OUTROS
          </p>
        </div>

        <Image
          src="/logoder.png"
          alt="Logo DER"
          width={180}
          height={80}
          className="h-auto"
        />
      </div>

      <ApiStatusBanner />

      <TabelaProcessos
        processos={outros}
        isLoading={isLoading}
        modo="outros"
      />
    </AppShell>
  )
}
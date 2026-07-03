"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { ApiStatusBanner } from "@/components/api-status-banner"
import { TabelaProcessos } from "@/components/processos/tabela-processos"
import { Button } from "@/components/ui/button"
import { useProcessos } from "@/lib/hooks"
import Image from "next/image";

export default function ProcessosPage() {
  const { processos, isLoading } = useProcessos()

  return (
    <AppShell>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-balance text-foreground">
            Processos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lista completa de processos de licenciamento
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

      <TabelaProcessos processos={processos} isLoading={isLoading} />
    </AppShell>
  )
}

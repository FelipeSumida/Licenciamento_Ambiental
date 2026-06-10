"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { ApiStatusBanner } from "@/components/api-status-banner"
import { ProcessoForm } from "@/components/processos/processo-form"
import { useProcesso } from "@/lib/hooks"

export default function EditarProcessoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { processo, isLoading } = useProcesso(id)

  return (
    <AppShell>
      <Link
        href={`/processos/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para o processo
      </Link>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-balance text-foreground">
          Editar processo
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualize os dados do processo
        </p>
      </header>

      <ApiStatusBanner />

      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">Carregando...</p>
      ) : !processo ? (
        <p className="py-12 text-center text-muted-foreground">
          Processo não encontrado ou API .NET não conectada.
        </p>
      ) : (
        <ProcessoForm processo={processo} />
      )}
    </AppShell>
  )
}

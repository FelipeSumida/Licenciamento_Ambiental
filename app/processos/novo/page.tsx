"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { ApiStatusBanner } from "@/components/api-status-banner"
import { ProcessoForm } from "@/components/processos/processo-form"

export default function NovoProcessoPage() {
  return (
    <AppShell>
      <Link
        href="/processos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para processos
      </Link>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-balance text-foreground">
          Novo processo
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha os dados para cadastrar um novo processo
        </p>
      </header>

      <ApiStatusBanner />

      <ProcessoForm />
    </AppShell>
  )
}

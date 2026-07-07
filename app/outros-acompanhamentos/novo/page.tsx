"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { ApiStatusBanner } from "@/components/api-status-banner"
import { AcompanhamentoForm } from "@/components/processos/acompanhamento-form"

export default function NovoAcompanhamentoPage() {
  return (
    <AppShell>
      <Link
        href="/outros-acompanhamentos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para outros acompanhamentos
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-balance text-foreground">
          Novo acompanhamento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha os dados para cadastrar um novo acompanhamento
        </p>
      </header>

      <ApiStatusBanner />

      <AcompanhamentoForm />
    </AppShell>
  )
}
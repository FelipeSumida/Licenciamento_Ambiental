"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Pencil, Trash2, Loader2 } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { ApiStatusBanner } from "@/components/api-status-banner"
import { SituacaoBadge } from "@/components/situacao-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useProcesso } from "@/lib/hooks"
import { excluirProcesso } from "@/lib/api"
import { formatarData } from "@/lib/format"

export default function DetalheProcessoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { processo, isLoading } = useProcesso(id)
  const [confirmar, setConfirmar] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  async function handleExcluir() {
    setExcluindo(true)
    try {
      await excluirProcesso(id)
      toast.success("Processo excluído.")
      router.push("/processos")
      router.refresh()
    } catch {
      toast.error("Não foi possível excluir. Verifique a conexão com a API .NET.")
    } finally {
      setExcluindo(false)
      setConfirmar(false)
    }
  }

  return (
    <AppShell>
      <Link
        href="/processos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para processos
      </Link>

      <ApiStatusBanner />

      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">Carregando...</p>
      ) : !processo ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-medium text-foreground">Processo não encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              O processo solicitado não existe ou a API .NET não está conectada.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-mono text-xl font-semibold text-foreground">
                  {processo.processo}
                </h1>
                <SituacaoBadge situacao={processo.situacao} />
              </div>
              <p className="text-sm text-muted-foreground">
                {processo.denominacao || "Sem denominação"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/processos/${id}/editar`}>
                  <Pencil className="size-4" />
                  Editar
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmar(true)}
              >
                <Trash2 className="size-4" />
                Excluir
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Dados do processo</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <Info label="Empreendimento" valor={processo.empreendimento} />
                <Info label="Trecho" valor={processo.trecho} />
                <Info label="Interessado" valor={processo.interessado} />
                <Info label="Classificação" valor={processo.classificacao} />
                <Info label="Divisão CAP" valor={processo.divisaoCap} />
                <Info
                  label="Técnico responsável"
                  valor={processo.tecnicoResponsavel}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Prazos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Info label="Data de entrada" valor={formatarData(processo.dataEntrada)} />
                <Separator />
                <Info label="Prazo" valor={formatarData(processo.prazo)} />
                <Separator />
                <Info label="Data de saída" valor={formatarData(processo.dataSaida)} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Pendências</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {processo.pendencias || "Sem pendências registradas."}
                </p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Histórico</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {processo.historico || "Sem histórico registrado."}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Dialog open={confirmar} onOpenChange={setConfirmar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir processo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este processo? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmar(false)}
              disabled={excluindo}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleExcluir}
              disabled={excluindo}
            >
              {excluindo && <Loader2 className="size-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

function Info({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground">{valor || "—"}</p>
    </div>
  )
}

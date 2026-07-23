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
import { PdfAcompanhamento } from "@/components/processos/pdf-acompanhamento"
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
        href="/outros-acompanhamentos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para outros acompanhamentos
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
            <div className="screen-only">
                <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="print-title font-mono text-xl font-semibold text-foreground">
                                {processo.processo}
                            </h1>
                            <SituacaoBadge
                            situacao={
                                processo.pendencias?.some((p) => p.situacao === "Aberta")
                                ? "Aberta"
                                : "Atendida"
                            }
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.print()}
                            className="no-print cursor-pointer"
                        >
                            Exportar PDF
                        </Button>
                        <Link
                            href={`/outros-acompanhamentos/${processo.id}/editar`}
                            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                        >
                            <Pencil className="size-4" />
                            Editar
                        </Link>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 px-4 cursor-pointer text-red-600 hover:text-red-700"
                            onClick={async () => {
                            const confirmou = confirm("Tem certeza que deseja excluir este processo?")

                            if (!confirmou) return

                            try {
                                await excluirProcesso(processo.id)
                                router.push("/processos")
                                router.refresh()
                            } catch (error) {
                                console.error("Erro ao excluir processo:", error)
                                alert("Não foi possível excluir o processo.")
                            }
                            }}
                        >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Excluir
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <Card className="print-card lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Dados do processo</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                            <Info label="Empreendimento" valor={processo.empreendimento} />

                            <div>
                                <p className="text-xs font-medium uppercase text-muted-foreground">
                                    Identificação do Empreendimento
                                </p>

                                <textarea
                                    readOnly
                                    value={processo.identificacaoEmpreendimento ?? ""}
                                    className="
                                    mt-1
                                    w-full
                                    min-h-[90px]
                                    max-h-[220px]
                                    resize-y
                                    overflow-y-auto
                                    overflow-x-hidden
                                    rounded-md
                                    border
                                    bg-muted/30
                                    p-3
                                    text-sm
                                    whitespace-pre-wrap
                                    break-words
                                    "
                                />
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase text-muted-foreground">
                                    Caracterização do Empreendimento
                                </p>

                                <textarea
                                    readOnly
                                    value={processo.caracterizacaoEmpreendimento ?? ""}
                                    className="
                                    mt-1
                                    w-full
                                    min-h-[90px]
                                    max-h-[220px]
                                    resize-y
                                    overflow-y-auto
                                    overflow-x-hidden
                                    rounded-md
                                    border
                                    bg-muted/30
                                    p-3
                                    text-sm
                                    whitespace-pre-wrap
                                    break-words
                                    "
                                />
                            </div>

                            <Info
                            label="Trecho"
                                valor={
                                    processo.trechos?.length > 0
                                    ? processo.trechos
                                        .map(
                                            (t) =>
                                            `${t.rodovia?.rodCodigo ?? "Sem rodovia"} - KM ${t.kmInicial || "-"} ao KM ${t.kmFinal || "-"}`
                                        )
                                        .join("\n")
                                    : "Sem trechos registrados."
                                }
                            />
                            <Info label="Interessado" valor={processo.interessado} />

                            <Info
                                label="Técnico responsável"
                                valor={processo.tecnicoResponsavel}
                            />
                        </CardContent>
                    </Card>

                    <Card className="print-card">
                        <CardHeader>
                            <CardTitle className="text-base">Prazos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {processo.pendencias?.length > 0 ? (
                                processo.pendencias.map((pendencia, index) => (
                                    <div key={index} className="space-y-3">
                                        <p className="text-sm font-medium">
                                            Pendência {index + 1}
                                        </p>

                                        <Info
                                            label="Data de entrada"
                                            valor={formatarData(pendencia.dataEntrada)}
                                        />

                                        <Separator />

                                        <Info
                                            label="Prazo"
                                            valor={formatarData(pendencia.prazo)}
                                        />

                                        <Separator />

                                        <Info
                                            label="Data de saída"
                                            valor={formatarData(pendencia.dataSaida)}
                                        />
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Sem prazos registrados.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="print-card lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="text-base">Pendências</CardTitle>
                        </CardHeader>

                        <CardContent>
                            {processo.pendencias?.length > 0 ? (
                                <div className="space-y-4">
                                    {processo.pendencias.map((pendencia, index) => (
                                        <div key={index} className="rounded-md border p-4 space-y-3">
                                            <h3 className="font-medium">Pendência {index + 1}</h3>

                                            <Info
                                            label="Atribuído a"
                                            valor={
                                                pendencia.atribuidoA?.length > 0
                                                    ? pendencia.atribuidoA.join(", ")
                                                    : "Não informado"
                                            }
                                            />

                                            {pendencia.atribuidoA?.includes("Regional") && (
                                            <Info
                                                label="Regionais"
                                                valor={
                                                    pendencia.regionais?.length > 0
                                                        ? pendencia.regionais.join(", ")
                                                        : "Nenhuma regional selecionada"
                                                    }
                                            />
                                            )}

                                            <Info
                                                label="Descrição"
                                                valor={pendencia.descricao || "Sem descrição."}
                                            />

                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                                <Info label="Divisão CAP" valor={pendencia.divisaoCap} />
                                                <Info label="Situação" valor={pendencia.situacao} />
                                            </div>

                                            <div>
                                                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                                                    Históricos
                                                </p>

                                                {pendencia.historicos?.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {pendencia.historicos.map((historico, histIndex) => (
                                                            <div key={histIndex} className="rounded-md bg-muted p-3">
                                                                <p className="text-xs text-muted-foreground">
                                                                    {formatarData(historico.data)}
                                                                </p>
                                                                <p className="text-sm">
                                                                    {historico.texto || "Sem descrição do histórico."}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">
                                                        Sem históricos registrados.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Sem pendências registradas.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="col-span-full mt-6 flex w-full flex-col gap-6">
                        <Card className="w-full self-start">
                            <CardHeader>
                            <CardTitle>Histórico do Processo</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-3">
                            {processo.historicoProcessoTexto ? (
                                <>
                                <div>
                                    <label>Data</label>
                                    <p className="text-sm text-muted-foreground">
                                    {processo.historicoProcessoData
                                        ?.split("-")
                                        .reverse()
                                        .join("/")}
                                    </p>
                                </div>

                                <div>
                                    <label>Descrição</label>
                                    <p className="whitespace-pre-wrap rounded-md border p-3">
                                    {processo.historicoProcessoTexto}
                                    </p>
                                </div>
                                </>
                            ) : (
                                <p className="text-muted-foreground">
                                Nenhum histórico cadastrado.
                                </p>
                            )}
                            </CardContent>
                        </Card>

                        <Card className="w-full self-start min-w-0">
                            <CardHeader>
                                <CardTitle>
                                    Histórico de alterações (
                                    {processo.historicosAlteracoes?.length ?? 0})
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                {processo.historicosAlteracoes?.length ? (
                                    <div className="w-full overflow-x-auto rounded-md border">
                                        <table className="w-full border-collapse text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/40 text-left">
                                                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                                                        Data/Hora
                                                    </th>

                                                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                                                        Usuário
                                                    </th>

                                                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                                                        Operação
                                                    </th>

                                                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                                                        Campo
                                                    </th>

                                                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                                                        De
                                                    </th>

                                                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                                                        Para
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {processo.historicosAlteracoes.map((historico) => (
                                                    <tr
                                                    key={historico.id}
                                                    className="border-b last:border-b-0"
                                                    >
                                                        <td className="whitespace-nowrap px-3 py-3">
                                                            {new Date(historico.dataHora).toLocaleString("pt-BR")}
                                                        </td>

                                                        <td className="whitespace-nowrap px-3 py-3">
                                                            {historico.usuario || "CAP"}
                                                        </td>

                                                        <td className="px-3 py-3">
                                                            {historico.operacao || "Alteração"}
                                                        </td>

                                                        <td className="px-3 py-3">
                                                            {historico.campo || "—"}
                                                        </td>

                                                        <td className="px-3 py-3 text-muted-foreground">
                                                            {historico.valorAnterior || "—"}
                                                        </td>

                                                        <td className="px-3 py-3">
                                                            {historico.valorNovo || "—"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">
                                        Nenhuma alteração registrada.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
            <PdfAcompanhamento processo={processo} />

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

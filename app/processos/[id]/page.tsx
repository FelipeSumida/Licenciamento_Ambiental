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
              <Link
                href={`/processos/${id}/editar`}
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
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Dados do processo</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <Info label="Empreendimento" valor={processo.empreendimento} />

                <Info label="Identificação do Empreendimento" valor={processo.identificacaoEmpreendimento || "-"} />

                <Info label="Caracterização do Empreendimento" valor={processo.caracterizacaoEmpreendimento || "-"} />

                <Info
                  label="Trecho"
                  valor={
                    processo.trechos?.length > 0
                      ? processo.trechos
                          .map(
                            (t) =>
                              `${t.denominacao || "Sem denominação"} - ${t.rodovia || "Sem rodovia"} - KM ${t.kmInicial || "-"} ao KM ${t.kmFinal || "-"}`
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

                <div className="col-span-2">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Fases do trecho
                  </p>

                  <div className="mt-2 space-y-3">
                    {processo.trechos?.flatMap((trecho) => trecho.fases ?? []).map((fase, index) => (
                      <div key={index} className="rounded-md border bg-muted/40 p-3">
                        <p className="mb-2 font-medium">
                          Fase {index + 1}
                        </p>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Info label="Fase" valor={fase.fase || "-"} />
                          <Info label="Situação da fase" valor={fase.statusFase || "-"} />
                          <Info label="N°" valor={fase.numeroFase || "-"} />
                          <Info label="Data de emissão" valor={formatarData(fase.dataEmissaoFase)} />
                          <Info label="Data de validade" valor={formatarData(fase.dataValidadeFase)} />
                          <Info label="Anexo PDF" valor={fase.anexoFase || "-"} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
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

            <Card className="lg:col-span-3">
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
                          <Info label="Classificação" valor={pendencia.classificacao} />
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

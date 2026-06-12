"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { criarProcesso, atualizarProcesso } from "@/lib/api"
import { paraInputDate } from "@/lib/format"
import {
  CLASSIFICACOES,
  DIVISOES_CAP,
  type Classificacao,
  type DivisaoCap,
  type Pendencia,
  type Processo,
  type ProcessoInput,
  type SituacaoProcesso,
} from "@/lib/types"

function novoTrecho() {
    return {
      denominacao: "",
      rodovia: "",
      kmInicial: "",
      kmFinal: "",
    }
  }

function estadoInicial(p?: Processo | null): ProcessoInput {
  return {
    processo: p?.processo ?? "",
    empreendimento: p?.empreendimento ?? "",
    denominacao: p?.denominacao ?? "",
    trechos: p?.trechos ?? [novoTrecho()],
    interessado: p?.interessado ?? "",
    classificacao: p?.classificacao ?? "LI",
    pendencias: p?.pendencias ?? [],
    dataEntrada: p?.dataEntrada ?? null,
    prazo: p?.prazo ?? null,
    dataSaida: p?.dataSaida ?? null,
    divisaoCap: p?.divisaoCap ?? "Licenciamento",
    tecnicoResponsavel: p?.tecnicoResponsavel ?? "",
    situacao: p?.situacao ?? "Aberta",
  }
}

export function ProcessoForm({ processo }: { processo?: Processo | null }) {
  const router = useRouter()
  const editando = Boolean(processo)
  const [form, setForm] = useState<ProcessoInput>(estadoInicial(processo))
  const [salvando, setSalvando] = useState(false)

  function set<K extends keyof ProcessoInput>(campo: K, valor: ProcessoInput[K]) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function novaPendencia(): Pendencia {
    return {
      descricao: "",
      classificacao: "LI",
      divisaoCap: "Licenciamento",
      situacao: "Aberta",
      dataEntrada: null,
      prazo: null,
      dataSaida: null,
      historicos: [
        {
          texto: "",
          data: null,
        },
      ],
    }
  }

  function setPendencia<K extends keyof Pendencia>(
    index: number,
    campo: K,
    valor: Pendencia[K]
  ) {
    const novasPendencias = [...form.pendencias]
    novasPendencias[index] = {
      ...novasPendencias[index],
      [campo]: valor,
    }
    set("pendencias", novasPendencias)
  }


  function setTrecho(
    index: number,
    campo: "denominacao" | "rodovia" | "kmInicial" | "kmFinal",
    valor: string
  ) {
    const novos = [...form.trechos]

    novos[index] = {
      ...novos[index],
      [campo]: valor,
    }

    set("trechos", novos)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.processo.trim()) {
      toast.error("Informe o número do processo.")
      return
    }
    setSalvando(true)
    try {
      if (editando && processo) {
        await atualizarProcesso(processo.id, form)
        toast.success("Processo atualizado com sucesso.")
        router.push(`/processos/${processo.id}`)
      } else {
        const criado = await criarProcesso(form)
        toast.success("Processo cadastrado com sucesso.")
        router.push(`/processos/${criado.id}`)
      }
      router.refresh()
    } catch {
      toast.error(
        "Não foi possível salvar.",
      )
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Nº do processo" required>
            <Input
              value={form.processo}
              onChange={(e) => set("processo", e.target.value)}
              placeholder="CETESB.000000/0000-00"
            />
          </Campo>
          <Campo label="Empreendimento">
            <Select
              value={form.empreendimento}
              onValueChange={(value) =>
                set("empreendimento", value as ProcessoInput["empreendimento"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Gerencial">Gerencial</SelectItem>
                <SelectItem value="Rodovia">Rodovia</SelectItem>
                <SelectItem value="NÃO APLICÁVEL">NÃO APLICÁVEL</SelectItem>
              </SelectContent>
            </Select>
          </Campo>
          
          <div className="sm:col-span-2 space-y-4">
            <Campo label="Rodovias e KM">
              <div className="space-y-6 rounded-lg border p-6">
                {form.trechos.map((trecho, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-3 items-end"
                  >
                    <div className="col-span-12 space-y-3">
                      <div className="col-span-12">
                        <Label>Denominação</Label>
                        <Input
                          value={trecho.denominacao}
                          onChange={(e) =>
                            setTrecho(index, "denominacao", e.target.value)
                          }
                          placeholder="Ex.: RODOVIA RAPOSO TAVARES"
                        />
                      </div>

                      <div className="col-span-8">
                        <Label>Rodovia</Label>
                        <Input
                          value={trecho.rodovia}
                          onChange={(e) =>
                            setTrecho(index, "rodovia", e.target.value)
                          }
                          placeholder="Ex.: Estrada Municipal XYZ"
                        />
                      </div>

                      <div className="col-span-2">
                        <Label>KM Inicial</Label>
                        <Input
                          value={trecho.kmInicial}
                          onChange={(e) =>
                            setTrecho(index, "kmInicial", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-span-2">
                        <Label>KM Final</Label>
                        <Input
                          value={trecho.kmFinal}
                          onChange={(e) =>
                            setTrecho(index, "kmFinal", e.target.value)
                          }
                        />
                      </div>

                    <div className="col-span-12 flex justify-end">
                      <button
                        type="button"
                        className="rounded bg-red-500 px-3 py-2 text-white cursor-pointer"
                        onClick={() =>
                          set(
                            "trechos",
                            form.trechos.filter((_, i) => i !== index)
                          )
                        }
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}

                <button
                  type="button"
                  className="cursor-pointer rounded bg-green-600 px-4 py-2 text-white"
                  onClick={() =>
                    set("trechos", [...form.trechos, novoTrecho()])
                  }
                >
                  + Adicionar Trecho
                </button>
              </div>
            </Campo>
          </div>

          <Campo label="Interessado">
            <Input
              value={form.interessado}
              onChange={(e) => set("interessado", e.target.value)}
              placeholder="DER / Concessionária"
            />
          </Campo>
          <Campo label="Técnico responsável">
            <Input
              value={form.tecnicoResponsavel}
              onChange={(e) => set("tecnicoResponsavel", e.target.value)}
              placeholder="Nome do técnico"
            />
          </Campo>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pendências e histórico</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Campo label="Pendências">
            <div className="space-y-4">
              {form.pendencias.map((pendencia, index) => (
                <div
                  key={index}
                  className="space-y-4 rounded-lg border p-4"
                >
                  <div className="flex justify-between gap-3">
                    <h3 className="font-medium">Pendência {index + 1}</h3>

                    <button
                      type="button"
                      onClick={() => {
                        const novasPendencias = form.pendencias.filter(
                          (_, i) => i !== index
                        )
                        set("pendencias", novasPendencias)
                      }}
                      className="rounded-md bg-red-500 px-3 py-2 text-white hover:bg-red-600"
                    >
                      🗑
                    </button>
                  </div>

                  <Campo label="Descrição da pendência">
                    <Textarea
                      value={pendencia.descricao}
                      onChange={(e) =>
                        setPendencia(index, "descricao", e.target.value)
                      }
                      rows={3}
                      placeholder="Descreva a pendência..."
                    />
                  </Campo>

                  <Campo label="Históricos">

                    {pendencia.historicos.map((hist, histIndex) => (
                      <div
                        key={histIndex}
                        className="mb-3 rounded border p-3"
                      >
                        <Textarea
                          value={hist.texto}
                          placeholder="Registro do histórico..."
                          rows={3}
                          onChange={(e) => {
                            const novosHistoricos = [...pendencia.historicos]
                            novosHistoricos[histIndex].texto = e.target.value

                            const novasPendencias = [...form.pendencias]
                            novasPendencias[index].historicos = novosHistoricos

                            set("pendencias", novasPendencias)
                          }}
                        />

                        <button
                          type="button"
                          className="mt-2 rounded bg-red-500 px-2 py-1 text-white"
                          onClick={() => {
                            const novosHistoricos =
                              pendencia.historicos.filter(
                                (_, i) => i !== histIndex
                              )

                            const novasPendencias = [...form.pendencias]
                            novasPendencias[index].historicos = novosHistoricos

                            set("pendencias", novasPendencias)
                          }}
                        >
                          Excluir histórico
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="rounded bg-green-600 px-3 py-2 text-white"
                      onClick={() => {
                        const novasPendencias = [...form.pendencias]

                        novasPendencias[index].historicos.push({
                          texto: "",
                          data: null,
                        })

                        set("pendencias", novasPendencias)
                      }}
                    >
                      + Adicionar Histórico
                    </button>

                  </Campo>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Campo label="Classificação">
                      <Select
                        value={pendencia.classificacao}
                        onValueChange={(v) =>
                          setPendencia(index, "classificacao", v as Classificacao)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASSIFICACOES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Campo>

                    <Campo label="Divisão CAP">
                      <Select
                        value={pendencia.divisaoCap}
                        onValueChange={(v) =>
                          setPendencia(index, "divisaoCap", v as DivisaoCap)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIVISOES_CAP.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Campo>

                    <Campo label="Situação">
                      <Select
                        value={pendencia.situacao}
                        onValueChange={(v) =>
                          setPendencia(index, "situacao", v as SituacaoProcesso)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Aberta">Aberta</SelectItem>
                          <SelectItem value="Atendida">Atendida</SelectItem>
                        </SelectContent>
                      </Select>
                    </Campo>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Campo label="Data de entrada">
                      <Input
                        type="date"
                        value={paraInputDate(pendencia.dataEntrada)}
                        onChange={(e) =>
                          setPendencia(index, "dataEntrada", e.target.value || null)
                        }
                      />
                    </Campo>

                    <Campo label="Prazo">
                      <Input
                        type="date"
                        value={paraInputDate(pendencia.prazo)}
                        onChange={(e) =>
                          setPendencia(index, "prazo", e.target.value || null)
                        }
                      />
                    </Campo>

                    <Campo label="Data de saída">
                      <Input
                        type="date"
                        value={paraInputDate(pendencia.dataSaida)}
                        onChange={(e) =>
                          setPendencia(index, "dataSaida", e.target.value || null)
                        }
                      />
                    </Campo>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  set("pendencias", [...form.pendencias, novaPendencia()])
                }
                className="cursor-pointer rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                + Adicionar Pendência
              </button>
            </div>
          </Campo>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={salvando}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando}>
          {salvando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {editando ? "Salvar alterações" : "Cadastrar processo"}
        </Button>
      </div>
    </form>
  )
}

function Campo({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Save, Paperclip } from "lucide-react"
import { Trash2 } from "lucide-react"
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
  type FaseTrecho,
  type Trecho,
} from "@/lib/types"

function novoTrecho() {
  return {
    denominacao: "",
    rodovia: "",
    kmInicial: "",
    kmFinal: "",
    fasesComplementares: [],

    fases: [
      {
        fase: "",
        statusFase: "",
        numeroFase: "",
        dataEmissaoFase: null,
        dataValidadeFase: null,
        anexoFase: null,
      },
    ],
  }
}

function estadoInicial(p?: Processo | null): ProcessoInput {
  return {
    processo: p?.processo ?? "",
    empreendimento: p?.empreendimento ?? "",
    denominacao: p?.denominacao ?? "",
    trechos: (p?.trechos?.length ? p.trechos : [novoTrecho()]).map((trecho) => ({
      ...trecho,
      fases: trecho.fases?.length
        ? trecho.fases
        : [
            {
              fase: "",
              statusFase: "",
              numeroFase: "",
              dataEmissaoFase: null,
              dataValidadeFase: null,
              anexoFase: null,
            },
          ],
    })),
    interessado: p?.interessado ?? "",
    classificacao: p?.classificacao ?? "LI",
    pendencias: p?.pendencias ?? [],
    dataEntrada: p?.dataEntrada ?? null,
    prazo: p?.prazo ?? null,
    dataSaida: p?.dataSaida ?? null,
    divisaoCap: p?.divisaoCap ?? "Licenciamento",
    tecnicoResponsavel: p?.tecnicoResponsavel ?? "",
    situacao: p?.situacao ?? "Aberta",
    fase: p?.fase ?? "",
    statusFase: p?.statusFase ?? "",
    dataEmissaoFase: p?.dataEmissaoFase ?? null,
    dataValidadeFase: p?.dataValidadeFase ?? null,
    numeroFase: p?.numeroFase ?? "",
    anexoFase: p?.anexoFase ?? null,
    identificacaoEmpreendimento: p?.identificacaoEmpreendimento ?? "",
    caracterizacaoEmpreendimento: p?.caracterizacaoEmpreendimento ?? "",
    historicoProcessoData: p?.historicoProcessoData ?? "",
    historicoProcessoTexto: p?.historicoProcessoTexto ?? "",
    fasesComplementares: p?.fasesComplementares ?? [],
  }
}

export function ProcessoForm({
  processo,
  modo = "processos",
}: {
  processo?: Processo | null
  modo?: "processos" | "outros"
}) {
  const router = useRouter()
  const editando = Boolean(processo)
  const [form, setForm] = useState<ProcessoInput>(estadoInicial(processo))
  const [salvando, setSalvando] = useState(false)
  const [faseEditando, setFaseEditando] = useState<{
    trecho: number
    fase: number
  } | null>(null)
  const [fasePassadaAberta, setFasePassadaAberta] = useState(false)
  const hoje = new Date().toISOString().split("T")[0]
  const [pendenciasAbertas, setPendenciasAbertas] = useState<number[]>([])

  function set<K extends keyof ProcessoInput>(campo: K, valor: ProcessoInput[K]) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function novaPendencia(): Pendencia {
    return {
      atribuidoA: [],
      regionais: [],
      descricao: "",
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

  function setPendencia(
    index: number,
    campo: string,
    valor: unknown
  ) {
    setForm((atual) => {
      const novasPendencias = [...atual.pendencias]

      novasPendencias[index] = {
        ...novasPendencias[index],
        [campo]: valor,
      }

      return {
        ...atual,
        pendencias: novasPendencias,
      }
    })
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

  function adicionarFaseComplementar() {
    const novasFases = [
      ...(form.fasesComplementares ?? []),
      {
        fase: "",
        dataEmissao: null,
        anexoPdf: null,
      },
    ];

    set("fasesComplementares", novasFases);
  }

  function removerFaseComplementar(faseIndex: number) {
    const novasFases = (form.fasesComplementares ?? []).filter(
      (_, i) => i !== faseIndex
    );

    set("fasesComplementares", novasFases);
  }


  function atualizarFaseTrecho(
    trechoIndex: number,
    faseIndex: number,
    campo: keyof FaseTrecho,
    valor: any
  ) {
    setForm((atual) => {
      const trechos = [...atual.trechos]
      const fases = [...(trechos[trechoIndex].fases ?? [])]

      fases[faseIndex] = {
        ...fases[faseIndex],
        [campo]: valor,
      }

      trechos[trechoIndex] = {
        ...trechos[trechoIndex],
        fases,
      }

      return { ...atual, trechos }
    })
  }

  function finalizarFaseTrecho(trechoIndex: number, faseIndex: number) {
    setForm((atual) => {
      const trechos = [...atual.trechos]
      const fases = [...trechos[trechoIndex].fases]

      if (faseIndex !== fases.length - 1) {
        return atual
      }

      fases.push({
        fase: "",
        statusFase: "",
        numeroFase: "",
        dataEmissaoFase: null,
        dataValidadeFase: null,
        anexoFase: null,
      })

      trechos[trechoIndex] = {
        ...trechos[trechoIndex],
        fases,
      }

      return { ...atual, trechos }
    })
  }

  function removerFaseTrecho(trechoIndex: number, faseIndex: number) {
    setForm((atual) => {
      const trechos = [...atual.trechos]
      const fases = [...trechos[trechoIndex].fases]

      if (fases.length === 1) return atual

      fases.splice(faseIndex, 1)

      trechos[trechoIndex] = {
        ...trechos[trechoIndex],
        fases,
      }

      return { ...atual, trechos }
    })
  }

  function dataParaInput(valor?: string | null) {
    if (!valor) return ""

    if (valor.includes("T")) {
      return valor.split("T")[0]
    }

    if (valor.includes("/")) {
      const [dia, mes, ano] = valor.split("/")
      return `${ano}-${mes}-${dia}`
    }

    return valor
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.processo.trim()) {
      toast.error("Informe o número do processo.")
      return
    }

    for (let i = 0; i < form.pendencias.length; i++) {
      const pendencia = form.pendencias[i]

      if (
        pendencia.atribuidoA.includes("Regional") &&
        pendencia.regionais.length === 0
      ) {
        toast.error(`Pendência ${i + 1}: selecione pelo menos uma Regional.`)
        return
      }
    }

    setSalvando(true)

    console.log("FORM ENVIADO:", form)
    console.log(
      "REGIONAIS ENVIADAS:",
      form.pendencias.map((p) => ({
        descricao: p.descricao,
        atribuidoA: p.atribuidoA,
        regionais: p.regionais,
      }))
    )

    const payload = {
      ...form,

      fasesComplementares: (form.fasesComplementares ?? []).map((fc: any) => ({
        id: fc.id,
        fase: fc.fase,
        dataEmissao: fc.dataEmissao || null,
        anexoPdf: fc.anexoPdf ?? null,
      })),
    }

    try {
      if (editando && processo) {
        await atualizarProcesso(processo.id, payload)
        toast.success("Processo atualizado com sucesso.")
        router.push(`/processos/${processo.id}`)
      } else {
        const criado = await criarProcesso(payload)
        toast.success("Processo cadastrado com sucesso.")
        router.push(`/processos/${criado.id}`)
      }

      router.refresh()
    } catch (error) {
      console.error("Erro ao salvar processo:", error)
      toast.error("Não foi possível salvar. Veja o console.")
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
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <Campo label="N° do processo">
                <Input
                  value={form.processo}
                  onChange={(e) => set("processo", e.target.value)}
                  placeholder="CETESB-0000"
                />
              </Campo>
            </div>

            <div className="lg:col-span-4">
              <Campo label="Identificação do Empreendimento">
                <Textarea
                  value={form.identificacaoEmpreendimento ?? ""}
                  onChange={(e) => set("identificacaoEmpreendimento", e.target.value)}
                  placeholder="Digite a identificação do empreendimento"
                  className="min-h-24 resize-y"
                />
              </Campo>
            </div>

            <div className="lg:col-span-5">
              <Campo label="Caracterização do Empreendimento">
                <Textarea
                  value={form.caracterizacaoEmpreendimento ?? ""}
                  onChange={(e) => set("caracterizacaoEmpreendimento", e.target.value)}
                  placeholder="Digite a caracterização do empreendimento"
                  className="min-h-24 resize-y"
                />
              </Campo>
            </div>
          </div>
        

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
                      <div className="rounded-lg border bg-muted/20 p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="font-medium">Rodovia</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                          <div className="lg:col-span-3">
                            <Campo label="Código">
                              <Input
                                value={trecho.rodovia}
                                onChange={(e) => setTrecho(index, "rodovia", e.target.value)}
                                placeholder="Ex: SLM-030"
                              />
                            </Campo>
                          </div>

                          <div className="lg:col-span-5">
                            <Campo label="Denominação">
                              <Input
                                value={trecho.denominacao}
                                onChange={(e) => setTrecho(index, "denominacao", e.target.value)}
                                placeholder="Nome da rodovia/trecho"
                              />
                            </Campo>
                          </div>

                          <div className="lg:col-span-2">
                            <Campo label="KM Inicial">
                              <Input
                                value={trecho.kmInicial}
                                onChange={(e) => setTrecho(index, "kmInicial", e.target.value)}
                                placeholder="0"
                              />
                            </Campo>
                          </div>

                          <div className="lg:col-span-2">
                            <Campo label="KM Final">
                              <Input
                                value={trecho.kmFinal}
                                onChange={(e) => setTrecho(index, "kmFinal", e.target.value)}
                                placeholder="0"
                              />
                            </Campo>
                          </div>
                        </div>
                      </div>
                      
                      {trecho.fases.map((faseItem, faseIndex) => {
                        const bloqueada =
                          faseItem.statusFase === "Emitido" &&
                          faseIndex < trecho.fases.length - 1 &&
                          !(
                            faseEditando?.trecho === index &&
                            faseEditando?.fase === faseIndex
                          )

                        async function salvarAlteracoesFase() {
                          await handleSubmit({
                            preventDefault: () => {},
                          } as React.FormEvent)

                          setFaseEditando(null)
                        }

                        return (
                          <div
                            key={faseIndex}
                            className={`mt-4 rounded-md border p-4 ${
                              bloqueada ? "bg-muted opacity-80" : "bg-background"
                            }`}
                          >

                            <div className="flex justify-end gap-2 mb-2">
                              {trecho.fases.length > 1 && (
                                <button
                                  type="button"
                                  className="cursor-pointer rounded-md bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-700"
                                  onClick={() => removerFaseTrecho(index, faseIndex)}
                                >
                                  Excluir
                                </button>
                              )}

                              {faseItem.statusFase === "Emitido" && (
                                <button
                                  type="button"
                                  className="cursor-pointer rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-800"
                                  onClick={() =>
                                    setFaseEditando({
                                      trecho: index,
                                      fase: faseIndex,
                                    })
                                  }
                                >
                                  Editar
                                </button>
                              )}

                              {faseEditando?.trecho === index &&
                                faseEditando?.fase === faseIndex && (
                                  <button
                                    type="button"
                                    className="cursor-pointer rounded-md bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
                                    onClick={salvarAlteracoesFase}
                                  >
                                    Salvar alterações
                                  </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <Campo
                                  label={
                                    bloqueada
                                      ? "Fase passada"
                                      : "Fase atual"
                                  }
                                >
                                <Select
                                  value={faseItem.fase}
                                  onValueChange={(value) =>
                                    atualizarFaseTrecho(index, faseIndex, "fase", value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a fase" />
                                  </SelectTrigger>

                                  <SelectContent>
                                    <SelectItem value="CP">CP</SelectItem>
                                    <SelectItem value="LP">LP</SelectItem>
                                    <SelectItem value="LI">LI</SelectItem>
                                    <SelectItem value="LO">LO</SelectItem>
                                    <SelectItem value="ASV">ASV</SelectItem>
                                  </SelectContent>
                                </Select>
                              </Campo>

                              <Campo label="Situação">
                                <Select
                                  value={faseItem.statusFase}
                                  onValueChange={(value) =>
                                    atualizarFaseTrecho(index, faseIndex, "statusFase", value)
                                  }
                                >
                                  <SelectTrigger className="w-[320px]">
                                    <span>
                                      {faseItem.statusFase === "Dispensado"
                                        ? "Dispensado de licenciamento ambiental"
                                        : faseItem.statusFase || "Selecione a situação"}
                                    </span>
                                  </SelectTrigger>

                                  <SelectContent>
                                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                                    <SelectItem value="Emitido">Emitido</SelectItem>

                                    {faseItem.fase !== "CP" && (
                                      <SelectItem value="Dispensado">Dispensado de licenciamento ambiental</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </Campo>
                            </div>

                            {faseItem.statusFase === "Emitido" && (
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Campo label="N°">
                                  <Input
                                    value={faseItem.numeroFase ?? ""}
                                    onChange={(e) =>
                                      atualizarFaseTrecho(index, faseIndex, "numeroFase", e.target.value)
                                    }
                                    placeholder="Digite o número"
                                    disabled={bloqueada}
                                  />
                                </Campo>

                                <Campo label="Data de emissão">
                                  <Input
                                    type="date"
                                    value={dataParaInput(faseItem.dataEmissaoFase)}
                                    max={hoje}
                                    onChange={(e) =>
                                      atualizarFaseTrecho(index, faseIndex, "dataEmissaoFase", e.target.value || null)
                                    }
                                    disabled={bloqueada}
                                  />
                                </Campo>

                                {faseItem.fase !== "CP" && (
                                  <Campo label="Data de validade">
                                    <Input
                                      value={faseItem.dataValidadeFase ?? ""}
                                      onChange={(e) =>
                                        atualizarFaseTrecho(
                                          index,
                                          faseIndex,
                                          "dataValidadeFase",
                                          e.target.value
                                        )
                                      }
                                      type="date"
                                      max="9999-12-31"
                                    />
                                  </Campo>
                                )}

                                <Campo label="Anexo PDF">
                                  <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed bg-background px-4 text-sm text-muted-foreground hover:bg-muted">
                                    <Paperclip className="size-4" />
                                    {faseItem.anexoFase ? faseItem.anexoFase : "Selecionar PDF"}

                                    <Input
                                      type="file"
                                      accept="application/pdf"
                                      className="hidden"
                                      disabled={bloqueada}
                                      onChange={(e) => {
                                        const arquivo = e.target.files?.[0]
                                        atualizarFaseTrecho(
                                          index,
                                          faseIndex,
                                          "anexoFase",
                                          arquivo ? arquivo.name : null
                                        )
                                      }}
                                    />
                                  </label>
                                </Campo>

                                {faseItem.statusFase === "Emitido" &&
                                  faseIndex === trecho.fases.length - 1 && (
                                  <button
                                    type="button"
                                    className="cursor-pointer mt-4 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
                                    onClick={() => finalizarFaseTrecho(index, faseIndex)}
                                  >
                                    Finalizar fase
                                  </button>
                                )}

                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-4 w-376 rounded-lg border bg-muted/30 p-4">
                      <h4 className="mb-3 text-sm font-semibold">
                        Fases Complementares
                      </h4>

                      {(form.fasesComplementares ?? []).map((fase, faseIndex) => (
                        <div
                          key={faseIndex}
                          className="mb-3 flex items-center gap-3"
                        >
                          <Select
                            value={fase.fase}
                            onValueChange={(value) => {
                              const novasFases = [...(form.fasesComplementares ?? [])];

                              const faseAtual = novasFases[faseIndex];

                              if (!faseAtual) return;

                              novasFases[faseIndex] = {
                                ...faseAtual,
                                fase: value as string,
                              };

                              set("fasesComplementares", novasFases);
                            }}
                          >
                            <SelectTrigger className="w-64">
                              <SelectValue placeholder="Selecione a fase" />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="ASV">ASV</SelectItem>
                              <SelectItem value="TCRA">TCRA</SelectItem>
                              <SelectItem value="AMIS">AMIS</SelectItem>
                            </SelectContent>
                          </Select>

                          <Input
                            type="date"
                            value={fase.dataEmissao ? fase.dataEmissao.substring(0, 10) : ""}
                            onChange={(e) => {
                              const novasFases = [...(form.fasesComplementares ?? [])];

                              const faseAtual = novasFases[faseIndex];
                              if (!faseAtual) return;

                              novasFases[faseIndex] = {
                                ...faseAtual,
                                dataEmissao: e.target.value || null,
                              };

                              set("fasesComplementares", novasFases);
                            }}
                          />

                          <label className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 bg-white text-sm text-gray-500 transition hover:bg-gray-50">
                            <Paperclip className="h-4 w-4" />

                            <span>
                              {fase.anexoPdf || "Selecionar PDF"}
                            </span>

                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                const arquivo = e.target.files?.[0];

                                const novasFases = [...(form.fasesComplementares ?? [])];

                                const faseAtual = novasFases[faseIndex];
                                if (!faseAtual) return;

                                novasFases[faseIndex] = {
                                  ...faseAtual,
                                  anexoPdf: arquivo ? arquivo.name : null,
                                };

                                set("fasesComplementares", novasFases);
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => removerFaseComplementar(faseIndex)}
                            className="cursor-pointer rounded bg-red-500 px-4 py-2 text-white hover:bg-red-700"
                          >
                            Excluir
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={adicionarFaseComplementar}
                        className="cursor-pointer mt-3 w-fit rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                      >
                        + Adicionar Fase Complementar
                      </button>
                    </div>
                  </div>
                ))}

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    className="cursor-pointer rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                    onClick={() =>
                      set("trechos", [...form.trechos, novoTrecho()])
                    }
                  >
                    + Adicionar Trecho
                  </button>

                  
                  <button
                    type="button"
                    className="cursor-pointer rounded-md bg-red-500 px-4 py-3 text-xs text-white hover:bg-red-700"
                    onClick={() =>
                      set(
                        "trechos",
                        form.trechos.filter((_, i) => i !== form.trechos.length - 1)
                      )
                    }
                  >
                    Excluir
                  </button>
                </div>
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
          <Campo label="Adicionar Técnico Responsável">
            {(form.tecnicoResponsavel
              ? form.tecnicoResponsavel.split("; ")
              : [""]
            ).map((tecnico, index, lista) => (
              <div key={index} className="mb-2 flex gap-2">
                <Input
                  value={tecnico}
                  onChange={(e) => {
                    const novos = [...lista]
                    novos[index] = e.target.value
                    set("tecnicoResponsavel", novos.filter(Boolean).join("; "))
                  }}
                  placeholder="Nome do técnico"
                />

                {lista.length > 1 && (
                  <button
                    type="button"
                    className="cursor-pointer rounded-md bg-red-500 px-3 py-2 text-white hover:bg-red-700"
                    onClick={() => {
                      const novos = lista.filter((_, i) => i !== index)
                      set("tecnicoResponsavel", novos.join("; "))
                    }}
                  >
                    Excluir
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              className="cursor-pointer mt-2 rounded-md bg-green-600 px-3 py-2 text-white hover:bg-green-800"
              onClick={() => {
                const lista = form.tecnicoResponsavel
                  ? form.tecnicoResponsavel.split("; ")
                  : []

                set("tecnicoResponsavel", [...lista, ""].join("; "))
              }}
            >
              + Adicionar Técnico
            </button>
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
              {form.pendencias.map((pendencia, index) => {
                const pendenciaFechada =
                  pendencia.cadastrada === true && !pendenciasAbertas.includes(index)

                return (
                  <div key={index} className="space-y-4 rounded-lg border p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setPendenciasAbertas((atual) =>
                            atual.includes(index)
                              ? atual.filter((i) => i !== index)
                              : [...atual, index]
                          )
                        }
                        className="flex cursor-pointer items-center gap-2 font-medium"
                      >
                        <span>{pendenciaFechada ? "▶" : "▼"}</span>
                        <span>Pendência {index + 1}</span>
                        <span className="rounded-full border px-2 py-0.5 text-xs">
                          {pendencia.situacao}
                        </span>
                      </button>

                      <button
                        type="button"
                        className="cursor-pointer rounded-md bg-red-500 px-3 py-2 text-xs text-white hover:bg-red-700"
                        onClick={() =>
                          set(
                            "pendencias",
                            form.pendencias.filter((_, i) => i !== index)
                          )
                        }
                      >
                        Excluir
                      </button>
                    </div>
                  
                    {!pendenciaFechada && (
                      <>
                      <div className="mb-4 space-y-3">
                        <Label>Atribuído a</Label>

                        <div className="flex flex-wrap gap-3">
                          {["DE", "DO", "CAP", "Regional"].map((opcao) => (
                            <label key={opcao} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={pendencia.atribuidoA.includes(
                                  opcao as "DE" | "DO" | "CAP" | "Regional"
                                )}
                                onChange={(e) => {
                                  const valor = opcao as "DE" | "DO" | "CAP" | "Regional"

                                  const novoAtribuidoA = e.target.checked
                                    ? [...pendencia.atribuidoA, valor]
                                    : pendencia.atribuidoA.filter((item) => item !== valor)

                                  setPendencia(index, "atribuidoA", novoAtribuidoA)
                                }}
                              />

                              {opcao}
                            </label>
                          ))}
                        </div>

                        {pendencia.atribuidoA.includes("Regional") && (
                          <div className="space-y-2 rounded-md border p-3">
                            <Label>Regionais</Label>

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {Array.from({ length: 14 }, (_, i) => `CGR${i + 1}`).map((regional) => (
                                <label key={regional} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={pendencia.regionais.includes(regional)}
                                    onChange={(e) => {
                                      const novasRegionais = e.target.checked
                                        ? [...(pendencia.regionais ?? []), regional]
                                        : (pendencia.regionais ?? []).filter((r) => r !== regional)

                                      setPendencia(index, "regionais", novasRegionais)
                                    }}
                                  />

                                  {regional}
                                </label>
                              ))}
                            </div>

                            {pendencia.atribuidoA.includes("Regional") &&
                              pendencia.regionais.length === 0 && (
                                <p className="mt-2 text-sm text-red-500">
                                  Selecione pelo menos uma Regional.
                                </p>
                            )}
                            
                          </div>
                        )}
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

                            <div className="mb-3">
                              <Label>Data do histórico</Label>

                              <Input
                                type="date"
                                value={hist.data ? hist.data.substring(0, 10) : ""}
                                onChange={(e) => {
                                  const novosHistoricos = [...pendencia.historicos]
                                  novosHistoricos[histIndex].data = e.target.value

                                  const novasPendencias = [...form.pendencias]
                                  novasPendencias[index].historicos = novosHistoricos

                                  set("pendencias", novasPendencias)
                                }}
                              />
                            </div>

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
                              className="cursor-pointer mt-2 rounded bg-red-500 px-2 py-1 text-white hover:bg-red-700"
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
                          className="cursor-pointer rounded bg-green-600 px-3 py-2 text-white hover:bg-green-800"
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
                            max={hoje}
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

                      {!pendencia.cadastrada && (
                        <Button
                          type="button"
                          onClick={() => setPendencia(index, "cadastrada", true)}
                          className="cursor-pointer bg-green-600 hover:bg-green-700"
                        >
                          Cadastrar pendência
                        </Button>
                      )}
                    </>
                  )}

                  </div>
                  )
                })}      

             

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

      <Campo label="Histórico do Processo">
        <div className="space-y-3 rounded-lg border p-4">
          <Campo label="Data do histórico">
            <Input
              type="date"
              value={form.historicoProcessoData ?? ""}
              onChange={(e) =>
                set("historicoProcessoData", e.target.value)
              }
            />
          </Campo>

          <Campo label="Descrição do histórico">
            <Textarea
              value={form.historicoProcessoTexto ?? ""}
              onChange={(e) =>
                set("historicoProcessoTexto", e.target.value)
              }
              placeholder="Digite o histórico do processo"
            />
          </Campo>
        </div>
      </Campo>

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

"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Plus, FileX, Trash2, Pencil } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { MoreVertical, Eye, Download} from "lucide-react"

import { SituacaoBadge } from "@/components/situacao-badge"
import { formatarData } from "@/lib/format"
import { excluirProcesso } from "@/lib/api"
import {
  DIVISOES_CAP,
  type Processo,
  type DivisaoCap,
} from "@/lib/types"

const TODOS = "__todos__"

export function TabelaProcessos({
  processos,
  isLoading,
  modo = "processos",
}: {
  processos: Processo[]
  isLoading: boolean
  modo?: "processos" | "outros"
}) {
  const router = useRouter()

  const [busca, setBusca] = useState("")
  const [situacao, setSituacao] = useState<string>(TODOS)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)
  const [tecnicoResponsavel, setTecnicoResponsavel] = useState<string>(TODOS)
  const [atribuidoFiltro, setAtribuidoFiltro] = useState(TODOS)
  const [classificacaoFiltro, setClassificacaoFiltro] = useState("TODAS")
  const [divisoesCapSelecionadas, setDivisoesCapSelecionadas] = useState<DivisaoCap[]>([])
  const [rodoviasSelecionadas, setRodoviasSelecionadas] = useState<string[]>([])
  const [faseAtual, setFaseAtual] = useState(TODOS)

  const [processoParaExcluir, setProcessoParaExcluir] = useState<Processo | null>(null)

  async function handleExcluir(id: string) {
    const confirmou = confirm("Tem certeza que deseja excluir este processo?")

    if (!confirmou) return

    try {
      setExcluindoId(id)
      await excluirProcesso(id)
      router.refresh()
      window.location.reload()
    } catch (error) {
      console.error("Erro ao excluir processo:", error)
      alert("Não foi possível excluir o processo.")
    } finally {
      setExcluindoId(null)
    }
  }

  const rodoviasDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        processos
          .flatMap((p) => p.trechos ?? [])
          .map((t) => t.rodovia)
          .filter(Boolean),
      ),
    ).sort()
  }, [processos])

  const atribuicoesDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        processos.flatMap((p) =>
          (p.pendencias ?? [])
            .filter((pendencia) => pendencia.situacao === "Aberta")
            .flatMap((pendencia) => pendencia.atribuidoA ?? [])
        )
      )
    ).sort()
  }, [processos])

  const tecnicosDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        processos
          .map((p) => p.tecnicoResponsavel)
          .filter(Boolean),
      ),
    ).sort()
  }, [processos])

  const divisoesCapDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        processos.flatMap((p) =>
          (p.pendencias ?? []).map(
            (pendencia) => pendencia.divisaoCap
          )
        )
      )
    ).sort()
  }, [processos])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return processos.filter((p) => {
      if (
        modo !== "outros" &&
        ["SUP.OBRA", "OP-FAUNA", "OUTROS"].includes(p.classificacao ?? "")
      ) {
        return false
      }
      const pendencias = p.pendencias ?? []
      const classificacaoProcesso = p.classificacao ?? ""
      const trechos = p.trechos ?? []

      const rodoviasDoProcesso = trechos.map((t) => t.rodovia)

      const casaRodovia =
        rodoviasSelecionadas.length === 0 ||
        rodoviasSelecionadas.every((rodovia) =>
          rodoviasDoProcesso.includes(rodovia),
        )

      const casaTecnico =
        tecnicoResponsavel === TODOS ||
        p.tecnicoResponsavel === tecnicoResponsavel
      
      const casaFase =
        modo === "outros" ||
        faseAtual === TODOS ||
        obterFaseAtual(p) === faseAtual

      const casaAtribuido =
        atribuidoFiltro === TODOS ||
        pendencias.some(
          (pendencia) =>
            pendencia.situacao === "Aberta" &&
            (pendencia.atribuidoA ?? []).includes(atribuidoFiltro)
        )
      
      const casaClassificacao =
        modo !== "outros" ||
        classificacaoFiltro === "TODAS" ||
        p.classificacao === classificacaoFiltro
      
      const divisoesDoProcesso = pendencias.map((pendencia) => pendencia.divisaoCap)

      const casaDivisaoCap =
        divisoesCapSelecionadas.length === 0 ||
        divisoesCapSelecionadas.every((divisao: DivisaoCap) =>
          divisoesDoProcesso.includes(divisao)
        )
      const situacaoCalculada =
        pendencias.length === 0
          ? "Sem pendência"
          : pendencias.every((pendencia) => pendencia.situacao === "Atendida")
            ? "Atendida"
            : "Aberta"

      const casaBusca =
        !termo ||
        [
          p.processo,
          p.empreendimento,
          p.denominacao,
          p.interessado,
          ...trechos.map(
            (t) =>
              `${t.denominacao} ${t.rodovia} ${t.kmInicial} ${t.kmFinal}`,
          ),
          ...pendencias.map(
            (pendencia) =>
              `${pendencia.descricao} ${pendencia.divisaoCap} ${pendencia.situacao}`,
          ),
        ]
          .filter(Boolean)
          .some((campo) => campo.toLowerCase().includes(termo))

      const casaSituacao =
        situacao === TODOS || situacaoCalculada === situacao

      return (
        casaBusca &&
        casaSituacao &&
        casaRodovia &&
        casaTecnico &&
        casaFase &&
        casaAtribuido &&
        casaDivisaoCap &&
        casaClassificacao
      )
    })
    .sort((a, b) => {
      if (situacao !== "Aberta") return 0

      const prazoA =
        a.pendencias
          ?.filter((p) => p.situacao === "Aberta" && p.prazo)
          .map((p) => new Date(p.prazo!).getTime())
          .sort((x, y) => x - y)[0] ?? Infinity

      const prazoB =
        b.pendencias
          ?.filter((p) => p.situacao === "Aberta" && p.prazo)
          .map((p) => new Date(p.prazo!).getTime())
          .sort((x, y) => x - y)[0] ?? Infinity

      return prazoA - prazoB
    })
  }, [
    processos,
    busca,
    situacao,
    faseAtual,
    rodoviasSelecionadas,
    tecnicoResponsavel,
    atribuidoFiltro,
    classificacaoFiltro,
    divisoesCapSelecionadas,
  ])

  function exportarExcel() {
    const dados = filtrados.map((p: any) => {
      const pendenciaAberta =
        p.pendencias?.find((x: any) => x.situacao === "Aberta") ?? p.pendencias?.[0]

      return {
        Processo: p.processo ?? "",
        Codigo: p.trechos?.[0]?.rodovia ?? "",
        Denominacao: p.trechos?.[0]?.denominacao ?? "",
        KmInicial: p.trechos?.[0]?.kmInicial ?? "",
        KmFinal: p.trechos?.[0]?.kmFinal ?? "",
        Empreendimento: p.empreendimento ?? "",
        IdentificacaoEmpreendimento: p.identificacaoEmpreendimento ?? "",
        CaracterizacaoEmpreendimento: p.caracterizacaoEmpreendimento ?? "",
        Interessado: p.interessado ?? "",
        TecnicoResponsavel: p.tecnicoResponsavel ?? "",
        Classificacao: p.classificacao ?? "",
        DivisaoCAP: pendenciaAberta?.divisaoCap ?? "",
        Situacao: pendenciaAberta?.situacao ?? "",
        DataEntrada: pendenciaAberta?.dataEntrada ?? "",
        Prazo: pendenciaAberta?.prazo ?? "",
        DataSaida: pendenciaAberta?.dataSaida ?? "",
        DescricaoPendencia: pendenciaAberta?.descricao ?? "",
        AtribuidoA: pendenciaAberta?.atribuidoA?.join(", ") ?? "",
        Regionais: pendenciaAberta?.regionais?.join(", ") ?? "",
        Historicos: pendenciaAberta?.historicos
          ?.map((h: any) => `${h.data ?? ""} - ${h.texto ?? ""}`)
          .join(" | ") ?? "",
      }
    })

    const cabecalho = Object.keys(dados[0]).join(";")
    const linhas = dados.map((linha) =>
      Object.values(linha).map((valor) => `"${valor}"`).join(";")
    )

    const csv = [cabecalho, ...linhas].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download =
      modo === "outros"
        ? "outros_acompanhamentos.csv"
        : "processos.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  function obterFaseAtual(p: Processo) {
        const fases = p.trechos?.flatMap((t) => t.fases ?? []) ?? []

        const faseAberta = fases.find((f) => f.statusFase !== "Emitido")

        return faseAberta?.fase || fases.at(-1)?.fase || "—"
      }

  return (
    <div className="space-y-4">
      <div className="mb-5 rounded-xl border bg-white/70 p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative md:col-span-2 xl:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar processo, empreendimento, interessado..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-11 pl-9"
            />
          </div>

          <div className="min-w-0">
            <label className="mb-1 block text-sm font-medium">
              Situação
            </label>
            
            <Select
              value={situacao}
              onValueChange={(v) => setSituacao(v as typeof TODOS | "Aberta" | "Atendida")}
            >
              <SelectTrigger className="cursor-pointer h-11 w-full">
                <span>
                  {situacao === TODOS ? "Todas as situações" : situacao}
                </span>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={TODOS}>Todas as situações</SelectItem>
                <SelectItem value="Aberta">Aberta</SelectItem>
                <SelectItem value="Atendida">Atendida</SelectItem>
                <SelectItem value="Sem pendência">Sem pendência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0">

            <label className="mb-1 block text-sm font-medium">
              Técnico Responsável
            </label>

            <Select
              value={tecnicoResponsavel}
              onValueChange={(v: any) => setTecnicoResponsavel(v)}
            >
              <SelectTrigger className="cursor-pointer h-11 w-full">
                <span>
                  {tecnicoResponsavel === TODOS ? "Todos os técnicos" : tecnicoResponsavel}
                </span>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={TODOS}>Todos os técnicos</SelectItem>

                {tecnicosDisponiveis.map((tecnico) => (
                  <SelectItem key={tecnico} value={tecnico}>
                    {tecnico}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {modo === "processos" && (
            <div className="min-w-0">
              <label className="mb-1 block text-sm font-medium">
                Fase Atual
              </label>

              <Select value={faseAtual} onValueChange={(v: any) => setFaseAtual(v)}>
                <SelectTrigger className="cursor-pointer h-11 w-full">
                  <span>{faseAtual === TODOS ? "Todas as fases" : faseAtual}</span>
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={TODOS}>Todas as fases</SelectItem>
                  {["CP", "LP", "LI", "LO", "ASV"].map((fase) => (
                    <SelectItem key={fase} value={fase}>
                      {fase}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="min-w-0">
            <label className="mb-1 block text-sm font-medium">
              Atribuído a
            </label>

            <Select
              value={atribuidoFiltro}
              onValueChange={(v: any) => setAtribuidoFiltro(v)}
            >
              <SelectTrigger className="cursor-pointer h-11 w-full">
                <span>
                  {atribuidoFiltro === TODOS ? "Todos os atribuídos" : atribuidoFiltro}
                </span>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={TODOS}>Todos os atribuídos</SelectItem>
                <SelectItem value="DE">DE</SelectItem>
                <SelectItem value="DO">DO</SelectItem>
                <SelectItem value="CAP">CAP</SelectItem>
                <SelectItem value="Regional">Regional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {modo === "outros" && (
            <div className="min-w-[220px]">
              <label className="mb-1 block text-sm font-medium">Classificação</label>
              <Select
                value={classificacaoFiltro}
                onValueChange={(v: any) => setClassificacaoFiltro(v)}
              >
                <SelectTrigger className="cursor-pointer h-11 w-full min-w-[220px]">
                  <SelectValue placeholder="Todas as classificações" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="TODAS">Todas as classificações</SelectItem>
                  <SelectItem value="SUP.OBRA">SUP.OBRA</SelectItem>
                  <SelectItem value="OP-FAUNA">OP-FAUNA</SelectItem>
                  <SelectItem value="OUTROS">OUTROS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="min-w-0">
            <details className="w-full">
              <summary className="flex h-11 cursor-pointer items-center justify-between rounded-md border bg-background px-3 text-sm">
                {divisoesCapSelecionadas.length === 0
                  ? "Todas as divisões"
                  : `${divisoesCapSelecionadas.length} selecionada(s)`}
              </summary>

              <div className="mt-2 space-y-2 rounded-md border bg-background p-3">
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => setDivisoesCapSelecionadas([])}
                >
                  Limpar seleção
                </button>

                {DIVISOES_CAP.map((divisao: DivisaoCap) => (
                  <label
                    key={divisao}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={divisoesCapSelecionadas.includes(divisao)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDivisoesCapSelecionadas((atual) => [
                            ...atual,
                            divisao as DivisaoCap,
                          ])
                        } else {
                          setDivisoesCapSelecionadas((atual) =>
                            atual.filter((d) => d !== divisao)
                          )
                        }
                      }}
                    />

                    {divisao}
                  </label>
                ))}
              </div>
            </details>
          </div>

          <div className="min-w-0">
            <details className="w-full">
              <summary className="flex h-11 cursor-pointer items-center justify-between rounded-md border bg-background px-3 text-sm">
                {rodoviasSelecionadas.length === 0
                  ? "Todas as rodovias"
                  : `${rodoviasSelecionadas.length} selecionada(s)`}
              </summary>

              <div className="mt-2 space-y-2 rounded-md border bg-background p-3">
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => setRodoviasSelecionadas([])}
                >
                  Limpar seleção
                </button>

                {rodoviasDisponiveis.map((rodovia) => (
                  <label
                    key={rodovia}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={rodoviasSelecionadas.includes(rodovia)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRodoviasSelecionadas((atual) => [
                            ...atual,
                            rodovia,
                          ])
                        } else {
                          setRodoviasSelecionadas((atual) =>
                            atual.filter((r) => r !== rodovia)
                          )
                        }
                      }}
                    />

                    {rodovia}
                  </label>
                ))}
              </div>
            </details>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Processo</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Identificação do Empreendimento</TableHead>
                {modo === "processos" && (
                  <TableHead>Fase Atual</TableHead>
                )}
                {modo === "outros" && (
                  <TableHead>Classificação</TableHead>
                )}
                <TableHead>Divisão CAP</TableHead>
                <TableHead>Técnico Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <EstadoLinha texto="Carregando processos..." />
              ) : filtrados.length === 0 ? (
                <EstadoVazio
                  temProcessos={processos.length > 0}
                  modo={modo}
                />
              ) : (
                filtrados.map((p) => {
                  const pendencias = p.pendencias ?? []

                  const pendenciaAberta =
                    pendencias.find((x) => x.situacao === "Aberta") ?? pendencias[0]

                  const situacaoProcesso =
                    pendencias.length === 0
                      ? "Sem pendência"
                      : pendencias.some((pendencia) => pendencia.situacao === "Aberta")
                        ? "Aberta"
                        : "Atendida"

                  return (
                    <TableRow key={p.id} className="group">
                      <TableCell className="whitespace-nowrap font-medium">
                        <Link href={`/processos/${p.id}`} className="text-primary hover:underline">
                          {p.processo || "Sem número"}
                        </Link>
                      </TableCell>

                      <TableCell>
                        {p.trechos?.[0]?.rodovia || "—"}
                      </TableCell>

                      <TableCell className="max-w-72 truncate">
                        {p.identificacaoEmpreendimento || "—"}
                      </TableCell>

                      {modo === "processos" && (
                        <TableCell>{obterFaseAtual(p)}</TableCell>
                      )}

                      {modo === "outros" && (
                        <TableCell>{p.classificacao || "-"}</TableCell>
                      )}

                      <TableCell>
                        {p.pendencias?.[0]?.divisaoCap || "—"}
                      </TableCell>

                      <TableCell>
                        {p.tecnicoResponsavel || "—"}
                      </TableCell>

                      <TableCell>
                        {pendenciaAberta?.situacao === "Atendida"
                          ? "—"
                          : formatarData(pendenciaAberta?.prazo)}
                      </TableCell>

                      <TableCell>
                        <SituacaoBadge situacao={situacaoProcesso} />
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted">
                              <MoreVertical className="size-4" />
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">

                              <DropdownMenuItem>
                                <Link href={modo === "outros" ? `/outros-acompanhamentos/${p.id}` : `/processos/${p.id}`} className="flex w-full items-center">
                                  <Eye className="mr-2 size-4" />
                                  Ver detalhes
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuItem>
                                <Link href={
                                        modo === "outros"
                                          ? `/outros-acompanhamentos/${p.id}/editar`
                                          : `/processos/${p.id}/editar`
                                      }
                                      className="flex w-full items-center"
                                    >
                                  <Pencil className="mr-2 size-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                className="cursor-pointer text-red-600"
                                onClick={() => setProcessoParaExcluir(p)}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Excluir
                              </DropdownMenuItem>

                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                )
              })
            )}
            </TableBody>
          </Table>
        </div>
      </Card>
      <div className="mt-4 flex w-full items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {filtrados.length} processo(s) exibido(s)
          {processos.length !== filtrados.length &&
            ` de ${processos.length} no total`}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={exportarExcel}
            className="gap-2 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            {modo === "outros"
              ? "Exportar Acompanhamentos (.csv)"
              : "Exportar Processos (.csv)"}
          </Button>

          <Link
            href={modo === "outros" ? "/outros-acompanhamentos/novo" : "/processos/novo"}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 cursor-pointer"
          >
            <Plus className="size-4" />
            {modo === "outros" ? "Novo acompanhamento" : "Novo processo"}
          </Link>
        </div>
      </div>

      <Dialog
        open={!!processoParaExcluir}
        onOpenChange={() => setProcessoParaExcluir(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir processo</DialogTitle>

            <DialogDescription>
              Tem certeza que deseja excluir o processo{" "}
              <strong>
                {processoParaExcluir?.processo || "sem número"}
              </strong>
              ?
              <br />
              Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setProcessoParaExcluir(null)}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (processoParaExcluir) {
                  handleExcluir(processoParaExcluir.id)
                  setProcessoParaExcluir(null)
                }
              }}
            >
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}

function EstadoLinha({ texto }: { texto: string }) {
  return (
    <TableRow>
      <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
        {texto}
      </TableCell>
    </TableRow>
  )
}

function EstadoVazio({
  temProcessos,
  modo,
}: {
  temProcessos: boolean
  modo: "processos" | "outros"
}) {
  return (
    <TableRow>
      <TableCell colSpan={9} className="py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <FileX className="size-6 text-muted-foreground" />
          </div>

          <div>
            <p className="font-medium text-foreground">
              {temProcessos
                ? "Nenhum processo corresponde aos filtros"
                : "Nenhum processo cadastrado"}
            </p>
            <p className="text-sm text-muted-foreground">
              {temProcessos
                ? "Ajuste a busca ou os filtros acima."
                : "Cadastre um novo processo!"}
            </p>
          </div>

          {!temProcessos && (
            <Link
              href={modo === "outros" ? "/outros-acompanhamentos/novo" : "/processos/novo"}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Plus className="size-4" />
              {modo === "outros" ? "Novo acompanhamento" : "Novo processo"}
            </Link>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
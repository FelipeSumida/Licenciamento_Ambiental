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

import { SituacaoBadge } from "@/components/situacao-badge"
import { formatarData } from "@/lib/format"
import { excluirProcesso } from "@/lib/api"
import {
  CLASSIFICACOES,
  DIVISOES_CAP,
  type Processo,
  type DivisaoCap,
} from "@/lib/types"

const TODOS = "__todos__"

export function TabelaProcessos({
  processos,
  isLoading,
}: {
  processos: Processo[]
  isLoading: boolean
}) {
  const router = useRouter()

  const [busca, setBusca] = useState("")
  const [situacao, setSituacao] = useState<string>(TODOS)
  const [classificacao, setClassificacao] = useState<string>(TODOS)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)
  const [tecnicoResponsavel, setTecnicoResponsavel] = useState<string>(TODOS)
  const [atribuidoFiltro, setAtribuidoFiltro] = useState(TODOS)
  const [divisoesCapSelecionadas, setDivisoesCapSelecionadas] = useState<DivisaoCap[]>([])
  const [rodoviasSelecionadas, setRodoviasSelecionadas] = useState<string[]>([])

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
      const pendencias = p.pendencias ?? []
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

      const casaAtribuido =
        atribuidoFiltro === TODOS ||
        pendencias.some(
          (pendencia) =>
            pendencia.situacao === "Aberta" &&
            (pendencia.atribuidoA ?? []).includes(atribuidoFiltro)
        )
      
      const divisoesDoProcesso = pendencias.map((pendencia) => pendencia.divisaoCap)

      const casaDivisaoCap =
        divisoesCapSelecionadas.length === 0 ||
        divisoesCapSelecionadas.every((divisao: DivisaoCap) =>
          divisoesDoProcesso.includes(divisao)
        )
      const situacaoCalculada =
        pendencias.length > 0 && pendencias.every((pendencia) => pendencia.situacao === "Atendida")
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
              `${pendencia.descricao} ${pendencia.classificacao} ${pendencia.divisaoCap} ${pendencia.situacao}`,
          ),
        ]
          .filter(Boolean)
          .some((campo) => campo.toLowerCase().includes(termo))

      const casaSituacao =
        situacao === TODOS || situacaoCalculada === situacao

      const casaClassificacao =
        classificacao === TODOS ||
        pendencias.some((pendencia) => pendencia.classificacao === classificacao)


      return (
        casaBusca &&
        casaSituacao &&
        casaClassificacao &&
        casaRodovia &&
        casaTecnico &&
        casaAtribuido &&
        casaDivisaoCap
      )
    })
  }, [
    processos,
    busca,
    situacao,
    classificacao,
    rodoviasSelecionadas,
    tecnicoResponsavel,
    atribuidoFiltro,
    divisoesCapSelecionadas,
  ])

  function faseAtual(p: Processo) {
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
              <SelectTrigger className="h-11 w-full">
                <span>
                  {situacao === TODOS ? "Todas as situações" : situacao}
                </span>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={TODOS}>Todas as situações</SelectItem>
                <SelectItem value="Aberta">Aberta</SelectItem>
                <SelectItem value="Atendida">Atendida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0">
            <label className="mb-1 block text-sm font-medium">
              Classificação
            </label>

            <Select
              value={classificacao}
              onValueChange={(v: any) => setClassificacao(v)}
            >
              <SelectTrigger className="h-11 w-full">
                <span>
                  {classificacao === TODOS ? "Todas as classificações" : classificacao}
                </span>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={TODOS}>Todas as classificações</SelectItem>

                {CLASSIFICACOES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
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
              <SelectTrigger className="h-11 w-full">
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

          <div className="min-w-0">
            <label className="mb-1 block text-sm font-medium">
              Atribuído a
            </label>

            <Select
              value={atribuidoFiltro}
              onValueChange={(v: any) => setAtribuidoFiltro(v)}
            >
              <SelectTrigger className="h-11 w-full">
                <span>
                  {atribuidoFiltro === TODOS ? "Todos os atribuídos" : atribuidoFiltro}
                </span>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                <SelectItem value="DE">DE</SelectItem>
                <SelectItem value="DO">DO</SelectItem>
                <SelectItem value="CAP">CAP</SelectItem>
                <SelectItem value="Regional">Regional</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                <TableHead>Fase Atual</TableHead>
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
                <EstadoVazio temProcessos={processos.length > 0} />
              ) : (
                filtrados.map((p) => {
                  const pendenciaAberta =
                    p.pendencias?.find(x => x.situacao === "Aberta") ?? p.pendencias?.[0]

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

                      <TableCell>
                        {faseAtual(p)}
                      </TableCell>

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
                        <SituacaoBadge
                          situacao={
                            p.pendencias?.some((pendencia) => pendencia.situacao === "Aberta")
                              ? "Aberta"
                              : "Atendida"
                          }
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/processos/${p.id}/editar`}
                            className="inline-flex h-10 items-center justify-center gap-1 rounded-md border px-3 text-sm hover:bg-muted"
                          >
                            <Pencil className="size-4" />
                            Editar
                          </Link>

                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 px-3 cursor-pointer text-red-600 hover:text-red-700"
                            disabled={excluindoId === p.id}
                            onClick={() => setProcessoParaExcluir(p)}
                          >
                            <Trash2 className="size-4" />
                            Excluir
                          </Button>
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

      <p className="text-xs text-muted-foreground">
        {filtrados.length} processo(s) exibido(s)
        {processos.length !== filtrados.length &&
          ` de ${processos.length} no total`}
      </p>

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

function EstadoVazio({ temProcessos }: { temProcessos: boolean }) {
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
              href="/processos/novo"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Plus className="size-4" />
              Novo processo
            </Link>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
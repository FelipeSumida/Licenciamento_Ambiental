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
import { CLASSIFICACOES, type Processo } from "@/lib/types"

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

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return processos.filter((p) => {
      const pendencias = p.pendencias ?? []
      const trechos = p.trechos ?? []

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

      return casaBusca && casaSituacao && casaClassificacao
    })
  }, [processos, busca, situacao, classificacao])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por processo, empreendimento, interessado..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={situacao} onValueChange={(v) => setSituacao(v ?? TODOS)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas as situações</SelectItem>
            <SelectItem value="Aberta">Aberta</SelectItem>
            <SelectItem value="Atendida">Atendida</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={classificacao}
          onValueChange={(v) => setClassificacao(v ?? TODOS)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Classificação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas as classes</SelectItem>
            {CLASSIFICACOES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="whitespace-nowrap">Processo</TableHead>
                <TableHead className="whitespace-nowrap">
                  Empreendimento
                </TableHead>
                <TableHead className="min-w-48">Denominação</TableHead>
                <TableHead className="whitespace-nowrap">Interessado</TableHead>
                <TableHead className="whitespace-nowrap">
                  Classificação
                </TableHead>
                <TableHead className="whitespace-nowrap">Divisão CAP</TableHead>
                <TableHead className="whitespace-nowrap">Entrada</TableHead>
                <TableHead className="whitespace-nowrap">Situação</TableHead>
                <TableHead className="whitespace-nowrap text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <EstadoLinha texto="Carregando processos..." />
              ) : filtrados.length === 0 ? (
                <EstadoVazio temProcessos={processos.length > 0} />
              ) : (
                filtrados.map((p) => (
                  <TableRow key={p.id} className="group">
                    <TableCell className="whitespace-nowrap font-medium">
                      <Link
                        href={`/processos/${p.id}`}
                        className="text-primary hover:underline"
                      >
                        {p.processo || "Sem número"}
                      </Link>
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {p.empreendimento || "—"}
                    </TableCell>

                    <TableCell className="max-w-64 truncate">
                      {p.trechos?.length
                        ? p.trechos.map((t) => t.denominacao).join(", ")
                        : "—"}
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {p.interessado || "—"}
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {p.pendencias?.length ? (
                          [...new Set(p.pendencias.map((pendencia) => pendencia.classificacao))]
                            .filter(Boolean)
                            .map((classificacao) => (
                              <span
                                key={classificacao}
                                className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                              >
                                {classificacao}
                              </span>
                            ))
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {p.pendencias?.[0]?.divisaoCap || "—"}
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatarData(p.pendencias?.[0]?.dataEntrada)}
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
                ))
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
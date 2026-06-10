"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, Plus, FileX } from "lucide-react"
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
import { SituacaoBadge } from "@/components/situacao-badge"
import { formatarData } from "@/lib/format"
import { CLASSIFICACOES, type Processo } from "@/lib/types"

const TODOS = "__todos__"

export function TabelaProcessos({
  processos,
  isLoading,
}: {
  processos: Processo[]
  isLoading: boolean
}) {
  const [busca, setBusca] = useState("")
  const [situacao, setSituacao] = useState<string>(TODOS)
  const [classificacao, setClassificacao] = useState<string>(TODOS)

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return processos.filter((p) => {
      const casaBusca =
        !termo ||
        [
          p.processo,
          p.empreendimento,
          p.denominacao,
          p.interessado,
          ...p.trechos.map((t) => `${t.rodovia} ${t.kmInicial} ${t.kmFinal}`),
        ]
          .filter(Boolean)
          .some((campo) => campo.toLowerCase().includes(termo))
      const casaSituacao = situacao === TODOS || p.situacao === situacao
      const casaClassificacao =
        classificacao === TODOS || p.classificacao === classificacao
      return casaBusca && casaSituacao && casaClassificacao
    })
  }, [processos, busca, situacao, classificacao])

  return (
    <div className="space-y-4">
      {/* Filtros */}
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
                <TableHead className="whitespace-nowrap">Empreend.</TableHead>
                <TableHead className="min-w-48">Denominação</TableHead>
                <TableHead className="whitespace-nowrap">Interessado</TableHead>
                <TableHead className="whitespace-nowrap">Classif.</TableHead>
                <TableHead className="whitespace-nowrap">Divisão CAP</TableHead>
                <TableHead className="whitespace-nowrap">Entrada</TableHead>
                <TableHead className="whitespace-nowrap">Situação</TableHead>
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
                        {p.processo}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {p.empreendimento || "—"}
                    </TableCell>
                    <TableCell className="max-w-64 truncate">
                      {p.denominacao || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {p.interessado || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {p.classificacao}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {p.divisaoCap || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatarData(p.dataEntrada)}
                    </TableCell>
                    <TableCell>
                      <SituacaoBadge situacao={p.situacao} />
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
        {processos.length !== filtrados.length && ` de ${processos.length} no total`}
      </p>
    </div>
  )
}

function EstadoLinha({ texto }: { texto: string }) {
  return (
    <TableRow>
      <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
        {texto}
      </TableCell>
    </TableRow>
  )
}

function EstadoVazio({ temProcessos }: { temProcessos: boolean }) {
  return (
    <TableRow>
      <TableCell colSpan={8} className="py-12">
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

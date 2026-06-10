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
  type Processo,
  type ProcessoInput,
  type SituacaoProcesso,
} from "@/lib/types"

function estadoInicial(p?: Processo | null): ProcessoInput {
  return {
    processo: p?.processo ?? "",
    empreendimento: p?.empreendimento ?? "",
    denominacao: p?.denominacao ?? "",
    trecho: p?.trecho ?? "",
    interessado: p?.interessado ?? "",
    classificacao: p?.classificacao ?? "LI",
    pendencias: p?.pendencias ?? [""],
    dataEntrada: p?.dataEntrada ?? null,
    prazo: p?.prazo ?? null,
    dataSaida: p?.dataSaida ?? null,
    divisaoCap: p?.divisaoCap ?? "Licenciamento",
    historico: p?.historico ?? "",
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
            <Input
              value={form.empreendimento}
              onChange={(e) => set("empreendimento", e.target.value)}
              placeholder="SP-000"
            />
          </Campo>
          <Campo label="Denominação">
            <Input
              value={form.denominacao}
              onChange={(e) => set("denominacao", e.target.value)}
              placeholder="RODOVIA ..."
            />
          </Campo>
          <Campo label="Trecho">
            <Input
              value={form.trecho}
              onChange={(e) => set("trecho", e.target.value)}
              placeholder="KM 00+000 ao KM 00+000"
            />
          </Campo>
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
          <CardTitle className="text-base">Classificação e situação</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo label="Classificação">
            <Select
              value={form.classificacao}
              onValueChange={(v) => set("classificacao", v as Classificacao)}
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
              value={form.divisaoCap as string}
              onValueChange={(v) => set("divisaoCap", v as DivisaoCap)}
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
              value={form.situacao}
              onValueChange={(v) => set("situacao", v as SituacaoProcesso)}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prazos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo label="Data de entrada">
            <Input
              type="date"
              value={paraInputDate(form.dataEntrada)}
              onChange={(e) => set("dataEntrada", e.target.value || null)}
            />
          </Campo>
          <Campo label="Prazo">
            <Input
              type="date"
              value={paraInputDate(form.prazo)}
              onChange={(e) => set("prazo", e.target.value || null)}
            />
          </Campo>
          <Campo label="Data de saída">
            <Input
              type="date"
              value={paraInputDate(form.dataSaida)}
              onChange={(e) => set("dataSaida", e.target.value || null)}
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
            <div className="space-y-3">
              {form.pendencias.map((pendencia: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={pendencia}
                    onChange={(e) => {
                      const novasPendencias = [...form.pendencias]
                      novasPendencias[index] = e.target.value
                      set("pendencias", novasPendencias)
                    }}
                    rows={3}
                    placeholder={`Descreva a pendência ${index + 1}...`}
                    className="flex-1"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const novasPendencias = form.pendencias.filter(
                        (_: string, i: number) => i !== index
                      )
                      set(
                        "pendencias",
                        novasPendencias.length ? novasPendencias : [""]
                      )
                    }}
                    className="rounded-md bg-red-500 px-3 text-white hover:bg-red-600"
                  >
                    🗑
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  set("pendencias", [...form.pendencias, ""])
                }
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
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

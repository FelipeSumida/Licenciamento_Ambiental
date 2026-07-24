"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type React from "react"
import type { ProcessoInput } from "@/lib/types"
import { paraInputDate } from "@/lib/format"
import { criarProcesso, atualizarProcesso } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Loader2, Save, Search, ChevronDown, Check, } from "lucide-react"


import {
  DIVISOES_CAP,
  type DivisaoCap,
  type SituacaoProcesso,
  type Trecho,
  type SirgeoRodovia,
} from "@/lib/types"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AcompanhamentoForm({
  processo,
}: {
  processo?: any
}) {
    const [form, setForm] = useState(() => ({
        processo: processo?.processo ?? "",
        identificacaoEmpreendimento: processo?.identificacaoEmpreendimento ?? "",
        caracterizacaoEmpreendimento: processo?.caracterizacaoEmpreendimento ?? "",
        empreendimento: processo?.empreendimento ?? "",
        classificacao: processo?.classificacao ?? "",

        trechos: processo?.trechos?.length
            ? processo.trechos
            : [
                {
                    rodId: null,
                    rodovia: null,
                    kmInicial: "",
                    kmFinal: "",
                    fases: [],
                },
            ],

        pendencias: processo?.pendencias?.length
            ? processo.pendencias
            : [
                {
                descricao: "",
                situacao: "Aberta",
                prazo: "",
                divisaoCap: "",
                dataEntrada: "",
                dataSaida: "",
                atribuidoA: [],
                regionais: [],
                historicos: [],
                cadastrada: false,
                },
            ],

        interessado: processo?.interessado ?? "",
        tecnicoResponsavel: processo?.tecnicoResponsavel ?? "",
        historicoProcessoData: processo?.historicoProcessoData ?? "",
        historicoProcessoTexto: processo?.historicoProcessoTexto ?? "",
    }))
    const router = useRouter()
    const [salvando, setSalvando] = useState(false)
    const editando = !!processo
    const [pendenciasAbertas, setPendenciasAbertas] = useState<number[]>([0])
    const [buscaRodovia, setBuscaRodovia] = useState<Record<number, string>>({})
    const [resultadosRodovia, setResultadosRodovia] = useState<Record<number, SirgeoRodovia[]>>({})
    const [carregandoRodovia, setCarregandoRodovia] = useState<Record<number, boolean>>({})
    const [rodoviaAberta, setRodoviaAberta] = useState<number | null>(null)
    const hoje = new Date().toISOString().split("T")[0]

    function setTrecho<K extends keyof Trecho>(
        index: number,
        campo: K,
        valor: Trecho[K]
    ) {
        setForm((anterior: any) => {
            const novosTrechos = [...anterior.trechos]

            novosTrechos[index] = {
                ...novosTrechos[index],
                [campo]: valor,
            }

            return {
                ...anterior,
                trechos: novosTrechos,
            }
        })
    }

    async function buscarRodovias(index: number, busca = "") {
        const termo = busca.trim()

        try {
            setCarregandoRodovia((anterior) => ({
                ...anterior,
                [index]: true,
            }))

            const parametros = termo
                ? `?busca=${encodeURIComponent(termo)}`
                : ""

            const resposta = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/processos/rodovias${parametros}`
            )

            if (!resposta.ok) {
                throw new Error(`Erro ${resposta.status} ao buscar rodovias`)
            }

            const rodovias: SirgeoRodovia[] = await resposta.json()

            setResultadosRodovia((anterior) => ({
                ...anterior,
                [index]: rodovias,
            }))
        } catch (erro) {
            console.error("Erro ao buscar rodovias:", erro)

            setResultadosRodovia((anterior) => ({
                ...anterior,
                [index]: [],
            }))
        } finally {
            setCarregandoRodovia((anterior) => ({
                ...anterior,
                [index]: false,
            }))
        }
    }

    function validarIntervaloTrecho(trecho: Trecho) {
        if (!trecho.rodovia) {
            return null
        }

        const kmTrechoInicial = Number(trecho.kmInicial)
        const kmTrechoFinal = Number(trecho.kmFinal)

        const kmRodoviaInicial = Number(trecho.rodovia.kmInicial)
        const kmRodoviaFinal = Number(trecho.rodovia.kmFinal)

        if (
            Number.isNaN(kmTrechoInicial) ||
            Number.isNaN(kmTrechoFinal)
        ) {
            return "Informe valores válidos para KM inicial e KM final."
        }

        if (kmTrechoInicial > kmTrechoFinal) {
            return "O KM inicial não pode ser maior que o KM final."
        }

        if (
            kmTrechoInicial < kmRodoviaInicial ||
            kmTrechoFinal > kmRodoviaFinal
        ) {
            return `O trecho informado deve estar entre o KM ${kmRodoviaInicial} e o KM ${kmRodoviaFinal} da rodovia selecionada.`
        }

        return null
    }

    function novoTrecho() {
        return {
            rodId: null,
            rodovia: null,
            kmInicial: "",
            kmFinal: "",
            fases: [],
        }
    }

    function novaPendencia() {
        return {
            descricao: "",
            situacao: "Aberta",
            prazo: "",
            dataEntrada: "",
            dataSaida: "",
            divisaoCap: "",
            atribuidoA: [] as string[],
            regionais: [] as string[],
            historicos: [] as { data: string; texto: string }[],
            cadastrada: false,
        }
    }

    function set(campo: string, valor: any) {
        setForm({
            ...form,
            [campo]: valor,
        })
    }

    function setPendencia(index: number, campo: string, valor: any) {
        const novasPendencias = [...form.pendencias]

        novasPendencias[index] = {
            ...novasPendencias[index],
            [campo]: valor,
        }

        set("pendencias", novasPendencias)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const trechoInvalido = form.trechos.find(
            (trecho: Trecho) => validarIntervaloTrecho(trecho) !== null
        )

        if (trechoInvalido) {
            const mensagem = validarIntervaloTrecho(trechoInvalido)

            toast.error(mensagem ?? "Existe um trecho com KM inválido.")
            return
        }

        if (!form.classificacao) {
            alert("Selecione uma classificação antes de salvar.")
            return
        }
        setSalvando(true)

        try {
            const payload = {
                ...form,

                trechos: form.trechos.map((t: Trecho) => ({
                    id: t.id,
                    rodId: t.rodId,
                    kmInicial: Number(t.kmInicial),
                    kmFinal: Number(t.kmFinal),
                    fases: [],
                })),

                pendencias: form.pendencias.map((pendencia: any) => ({
                    atribuidoA: pendencia.atribuidoA ?? [],
                    regionais: pendencia.regionais ?? [],
                    descricao: pendencia.descricao ?? "",
                    divisaoCap: pendencia.divisaoCap ?? "",
                    situacao: pendencia.situacao ?? "Aberta",
                    dataEntrada: pendencia.dataEntrada || null,
                    prazo: pendencia.prazo || null,
                    dataSaida: pendencia.dataSaida || null,
                    cadastrada: pendencia.cadastrada ?? true,

                    historicos: (pendencia.historicos ?? [])
                    .filter((h: any) => h.texto || h.data)
                    .map((h: any) => ({
                        texto: h.texto ?? "",
                        data: h.data || null,
                    })),
                })),
            } as ProcessoInput

            if (processo?.id) {
                await atualizarProcesso(String(processo.id), payload)

                toast.success("Acompanhamento atualizado com sucesso.")

                router.push(`/outros-acompanhamentos/${processo.id}`)
            } else {
                const criado = await criarProcesso(payload)

                toast.success("Acompanhamento cadastrado com sucesso.")

                router.push(`/outros-acompanhamentos/${criado.id}`)
            }

            router.refresh()
        } catch (error) {
            console.error("Erro ao salvar acompanhamento:", error)
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

                <div className="lg:col-span-3">
                    <Campo label="Classificação" required>
                        <Select
                        value={form.classificacao}
                        onValueChange={(value) => set("classificacao", value)}
                        >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="SUP.OBRA">SUP.OBRA</SelectItem>
                            <SelectItem value="OP-FAUNA">OP-FAUNA</SelectItem>
                            <SelectItem value="OUTROS">OUTROS</SelectItem>
                        </SelectContent>
                        </Select>
                    </Campo>
                </div>
                
                <div className="sm:col-span-2 space-y-4">
                    <Campo label="Rodovias e KM">
                        <div className="space-y-6 rounded-lg border p-6">
                            {form.trechos.map((trecho: any, index: number) => (
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
                                                <div className="relative lg:col-span-5">
                                                    <Campo label="Código">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const vaiAbrir = rodoviaAberta !== index

                                                                setRodoviaAberta(vaiAbrir ? index : null)

                                                                if (vaiAbrir) {
                                                                    setBuscaRodovia((anterior) => ({
                                                                        ...anterior,
                                                                        [index]: "",
                                                                }))

                                                                    buscarRodovias(index, "")
                                                                }
                                                            }}
                                                                className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                        >
                                                            <span
                                                                className={
                                                                    trecho.rodovia?.rodCodigo
                                                                        ? "text-foreground"
                                                                        : "text-muted-foreground"
                                                                }
                                                            >
                                                                {trecho.rodovia?.rodCodigo || "Selecione a rodovia"}
                                                            </span>

                                                            <ChevronDown
                                                                className={`h-4 w-4 text-muted-foreground transition-transform ${
                                                                    rodoviaAberta === index ? "rotate-180" : ""
                                                                }`}
                                                            />
                                                        </button>
                                                    </Campo>

                                                    {rodoviaAberta === index && (
                                                        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border bg-background shadow-xl">
                                                            <div className="border-b p-3">
                                                                <div className="relative">
                                                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                                                    <Input
                                                                        value={buscaRodovia[index] ?? ""}
                                                                        onChange={(e) => {
                                                                            const valor = e.target.value

                                                                            setBuscaRodovia((anterior) => ({
                                                                                ...anterior,
                                                                                [index]: valor,
                                                                            }))

                                                                            buscarRodovias(index, valor)
                                                                        }}
                                                                        placeholder="Pesquisar código da rodovia..."
                                                                        autoComplete="off"
                                                                        autoFocus
                                                                        className="h-10 pl-9"
                                                                    />
                                                                </div>
                                                            </div>

                                                        <div className="border-b bg-muted/30 px-3 py-2">
                                                            <p className="text-xs text-muted-foreground">
                                                                {carregandoRodovia[index]
                                                                    ? "Buscando rodovias..."
                                                                    : `${resultadosRodovia[index]?.length ?? 0} rodovia(s) encontrada(s)`}
                                                            </p>
                                                        </div>

                                                        <div className="max-h-64 overflow-y-auto p-1">
                                                            {carregandoRodovia[index] ? (
                                                                <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                    Carregando rodovias...
                                                                </div>
                                                            ) : resultadosRodovia[index]?.length > 0 ? (
                                                                resultadosRodovia[index].map((rodovia) => {
                                                                    const selecionada = trecho.rodId === rodovia.rodId

                                                                    return (
                                                                        <button
                                                                            key={rodovia.rodId}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setForm((anterior: any) => {
                                                                                    const novosTrechos = [...anterior.trechos]

                                                                                    novosTrechos[index] = {
                                                                                        ...novosTrechos[index],
                                                                                        rodId: rodovia.rodId,
                                                                                        rodovia,
                                                                                    }

                                                                                    return {
                                                                                        ...anterior,
                                                                                        trechos: novosTrechos,
                                                                                    }
                                                                                })

                                                                                setBuscaRodovia((anterior) => ({
                                                                                    ...anterior,
                                                                                    [index]: "",
                                                                                }))

                                                                                setResultadosRodovia((anterior) => ({
                                                                                    ...anterior,
                                                                                    [index]: [],
                                                                                }))

                                                                                setRodoviaAberta(null)
                                                                            }}
                                                                            className={`flex w-full items-center justify-between rounded-md px-3 py-3 text-left transition-colors ${
                                                                                selecionada
                                                                                    ? "bg-primary/10 text-primary"
                                                                                    : "hover:bg-muted"
                                                                            }`}
                                                                        >
                                                                            <div>
                                                                                <p className="text-sm font-medium">
                                                                                    {rodovia.rodCodigo}
                                                                                </p>

                                                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                                                    KM {rodovia.kmInicial ?? "—"} até KM{" "}
                                                                                    {rodovia.kmFinal ?? "—"}
                                                                                </p>
                                                                            </div>

                                                                            {selecionada && (
                                                                                <Check className="h-4 w-4 text-primary" />
                                                                            )}
                                                                        </button>
                                                                    )
                                                                })
                                                            ) : (
                                                                <div className="px-4 py-6 text-center">
                                                                    <p className="text-sm font-medium">
                                                                        Nenhuma rodovia encontrada
                                                                    </p>

                                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                                        Tente pesquisar utilizando outro código.
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
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

                                            {validarIntervaloTrecho(trecho) && (
                                                <div className="lg:col-span-12">
                                                    <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                                    {validarIntervaloTrecho(trecho)}
                                                    </p>
                                                </div>
                                            )}
                                            </div>
                                        </div>   
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
                                        form.trechos.filter((_: any, i: number) => i !== form.trechos.length - 1)
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
                    ).map((tecnico: string, index: number, lista: string[]) => (
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
                            const novos = lista.filter((_: string, i: number) => i !== index)
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
                            {form.pendencias.map((pendencia: any, index: number) => {
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
                                            ? atual.filter((i: number) => i !== index)
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
                                            form.pendencias.filter((_: any, i: number) => i !== index)
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
                                                    : pendencia.atribuidoA.filter((item: string) => item !== valor)

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
                                                        ? [...pendencia.regionais, regional]
                                                        : pendencia.regionais.filter((r: string) => r !== regional)

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

                                        {pendencia.historicos.map((hist: any, histIndex: number) => (
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
                                                pendencia.historicos.filter((_: any, i: number) => i !== histIndex)
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
                                                data: "",
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
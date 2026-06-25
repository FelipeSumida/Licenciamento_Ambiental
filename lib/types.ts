
export type SituacaoProcesso = "Aberta" | "Atendida"

export const CLASSIFICACOES = [
  "ASV",
  "CP",
  "LP",
  "LI",
  "LO",
  "TCRA",
  "OP-FAUNA",
  "SUP.OBRA",
  "AMIS",
  "OUTROS",
] as const

export type Classificacao = (typeof CLASSIFICACOES)[number]

export const DIVISOES_CAP = [
  "Supervisão obra",
  "Não Aplicável",
  "Meio Sócio",
  "Meio Físico",
  "Licenciamento",
  "INFRAÇÃO AMBIENTAL",
  "Flora",
  "Fauna",
  "Concessionária",
] as const

export type DivisaoCap = (typeof DIVISOES_CAP)[number]

export type Trecho = {
  denominacao: string
  rodovia: string
  kmInicial: string
  kmFinal: string
  fases: FaseTrecho[]
}

export type FaseTrecho = {
  id?: number
  fase: string
  statusFase: string
  numeroFase: string
  dataEmissaoFase: string | null
  dataValidadeFase: string | null
  anexoFase: string | null
}

export type Historico = {
  texto: string
  data: string | null
}

export type Pendencia = {
  atribuidoA: string[]
  regionais: string[]
  descricao: string
  classificacao: Classificacao
  divisaoCap: DivisaoCap
  situacao: SituacaoProcesso
  dataEntrada: string | null
  prazo: string | null
  dataSaida: string | null
  historicos: Historico[]
}

export interface Processo {
  id: string
  processo: string
  empreendimento: string
  denominacao: string
  trechos: Trecho[]
  interessado: string
  classificacao: Classificacao
  pendencias: Pendencia[]
  dataEntrada: string | null
  prazo: string | null
  dataSaida: string | null
  divisaoCap: DivisaoCap | string
  tecnicoResponsavel: string
  situacao: SituacaoProcesso
  fase: string
  statusFase: string
  dataEmissaoFase: string | null
  dataValidadeFase: string | null
  numeroFase: string
  anexoFase: string | null
  identificacaoEmpreendimento: string
  caracterizacaoEmpreendimento: string
  historicosAlteracoes?: {
    id: number
    processoId: number
    dataHora: string
    descricao: string
  }[]
  }

export type ProcessoInput = Omit<Processo, "id">

export interface ResumoDashboard {
  abertos: number
  concluidos: number
  porArea: { area: string; total: number }[]
  porTematica: { classificacao: string; total: number }[]
}

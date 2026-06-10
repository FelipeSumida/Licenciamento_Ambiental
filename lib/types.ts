// Tipos de domínio para o acompanhamento de processos (Comunique-se)

export type SituacaoProcesso = "Aberta" | "Atendida"

// Classificações observadas na planilha / gráfico de temática
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

// Divisões/áreas da CAP observadas no gráfico "por áreas"
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
  rodovia: string
  kmInicial: string
  kmFinal: string
}

export type Pendencia = {
  descricao: string
  classificacao: Classificacao
  divisaoCap: DivisaoCap
  situacao: SituacaoProcesso
  dataEntrada: string | null
  prazo: string | null
  dataSaida: string | null
  historico: string
}

export interface Processo {
  id: string
  /** Nº do processo, ex: CETESB.022396/2017-48 */
  processo: string
  /** Empreendimento, ex: SP-250 */
  empreendimento: string
  /** Denominação, ex: RODOVIA BUNJIRO NAKAO */
  denominacao: string
  /** Trecho, ex: KM 45+250 E O KM 74+000 */
  trechos: Trecho[]
  /** Interessado, ex: DER, Concessionária Rota Sorocabana */
  interessado: string
  classificacao: Classificacao
  /** Texto das pendências */
  pendencias: Pendencia[]
  /** ISO date string (yyyy-mm-dd) */
  dataEntrada: string | null
  /** Prazo (ISO date string) */
  prazo: string | null
  /** Data de saída (ISO date string) */
  dataSaida: string | null
  divisaoCap: DivisaoCap | string
  /** Histórico do processo (texto longo) */
  tecnicoResponsavel: string
  situacao: SituacaoProcesso
}

// Payload usado para criar/editar (sem id)
export type ProcessoInput = Omit<Processo, "id">

export interface ResumoDashboard {
  abertos: number
  concluidos: number
  porArea: { area: string; total: number }[]
  porTematica: { classificacao: string; total: number }[]
}

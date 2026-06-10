import type { Processo, ProcessoInput, ResumoDashboard } from "./types"

/**
 * Cliente HTTP para a API ASP.NET Core.
 *
 * A URL base vem da variável de ambiente NEXT_PUBLIC_API_URL.
 * Ex.: NEXT_PUBLIC_API_URL=https://localhost:7001/api
 *
 * Enquanto a API .NET não estiver conectada, as funções retornam
 * dados vazios (em vez de quebrar a interface). Quando você definir
 * NEXT_PUBLIC_API_URL, o front passa a consumir a API de verdade.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""

export const API_CONFIGURADA = API_URL.length > 0

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_CONFIGURADA) {
    throw new ApiError("API .NET não configurada (defina NEXT_PUBLIC_API_URL)", 0)
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new ApiError(`Erro ${res.status} ao chamar ${path}`, res.status)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

// Endpoints esperados na API .NET:
//   GET    /processos
//   GET    /processos/{id}
//   POST   /processos
//   PUT    /processos/{id}
//   DELETE /processos/{id}
//   GET    /dashboard/resumo

export async function listarProcessos(): Promise<Processo[]> {
  if (!API_CONFIGURADA) return []
  return request<Processo[]>("/processos")
}

export async function obterProcesso(id: string): Promise<Processo | null> {
  if (!API_CONFIGURADA) return null
  return request<Processo>(`/processos/${id}`)
}

export async function criarProcesso(input: ProcessoInput): Promise<Processo> {
  return request<Processo>("/processos", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function atualizarProcesso(
  id: string,
  input: ProcessoInput,
): Promise<Processo> {
  return request<Processo>(`/processos/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export async function excluirProcesso(id: string): Promise<void> {
  return request<void>(`/processos/${id}`, { method: "DELETE" })
}

export async function obterResumoDashboard(): Promise<ResumoDashboard> {
  if (!API_CONFIGURADA) {
    return { abertos: 0, concluidos: 0, porArea: [], porTematica: [] }
  }
  return request<ResumoDashboard>("/dashboard/resumo")
}

// Fetcher genérico para uso com SWR
export const swrFetcher = <T>(path: string): Promise<T> => request<T>(path)

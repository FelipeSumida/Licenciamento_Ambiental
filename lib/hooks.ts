"use client"

import useSWR from "swr"
import {
  listarProcessos,
  obterResumoDashboard,
  obterProcesso,
} from "@/lib/api"
import type { Processo, ResumoDashboard } from "@/lib/types"

export function useProcessos() {
  const { data, error, isLoading, mutate } = useSWR<Processo[]>(
    "processos",
    listarProcessos,
  )
  return {
    processos: data ?? [],
    isLoading,
    error,
    mutate,
  }
}

export function useProcesso(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Processo | null>(
    id ? ["processo", id] : null,
    () => obterProcesso(id as string),
  )
  return { processo: data ?? null, isLoading, error, mutate }
}

export function useResumoDashboard() {
  const { data, error, isLoading, mutate } = useSWR<ResumoDashboard>(
    "dashboard-resumo",
    obterResumoDashboard,
  )
  return {
    resumo: data ?? {
      abertos: 0,
      concluidos: 0,
      total: 0,
      porArea: [],
    },
    isLoading,
    error,
    mutate,
  }
}

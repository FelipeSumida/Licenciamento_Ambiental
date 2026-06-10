"use client"

import { AlertCircle } from "lucide-react"
import { API_CONFIGURADA } from "@/lib/api"

export function ApiStatusBanner() {
  if (API_CONFIGURADA) return null

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-0.5">
        <p className="font-medium">Banco de dados ainda não conectado</p>
        <p className="text-amber-700">
          Defina a variável{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">
            NEXT_PUBLIC_API_URL
          </code>{" "}
          apontando para a sua API .NET (ex.:{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">
            https://localhost:7001/api
          </code>
          )
        </p>
      </div>
    </div>
  )
}

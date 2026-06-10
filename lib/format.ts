export function formatarData(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  })
}

/** Converte ISO (com hora) para o formato aceito por <input type="date"> */
export function paraInputDate(iso: string | null | undefined): string {
  if (!iso) return ""
  return iso.slice(0, 10)
}

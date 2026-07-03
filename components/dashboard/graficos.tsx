"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

const CORES_GRAFICO = [
  "#16a34a",
  "#2563eb",
  "#ca8a04",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#ea580c",
]

const PIE_COLORS = [
  "#16a34a", // verde
  "#2563eb", // azul
  "#f59e0b", // amarelo
  "#dc2626", // vermelho
  "#9333ea", // roxo
  "#06b6d4", // ciano
  "#f97316", // laranja
  "#ec4899", // rosa
  "#64748b", // cinza
]

export function GraficoPorArea({
  dados,
}: {
  dados: { divisao: string; total: number }[]
}) {
  const temDados = dados.length > 0
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-base">Comunique-se por áreas da CAP</CardTitle>
        <CardDescription>Distribuição de processos por divisão</CardDescription>
      </CardHeader>
      <CardContent>
        {temDados ? (
          <ChartContainer
            config={{ total: { label: "Processos", color: "var(--chart-1)" } }}
            className="h-[300px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={dados}
              layout="vertical"
              margin={{ left: 12, right: 16 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="area"
                tickLine={false}
                axisLine={false}
                width={120}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total">
                {dados.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CORES_GRAFICO[index % CORES_GRAFICO.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <EmptyChart />
        )}
      </CardContent>
    </Card>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
      Sem dados para exibir
    </div>
  )
}

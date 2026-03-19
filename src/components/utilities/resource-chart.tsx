import { useMemo } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

// Generate mock data for different resources
const generateMonthlyData = (resource: string, scope: string) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const baseValues: Record<string, number> = {
    electricity: scope === "city" ? 450000 : scope === "district" ? 45000 : 450,
    water: scope === "city" ? 320000 : scope === "district" ? 32000 : 320,
    gas: scope === "city" ? 280000 : scope === "district" ? 28000 : 280,
    transport: scope === "city" ? 150000 : scope === "district" ? 15000 : 150,
  }
  
  const base = baseValues[resource] || 100000
  
  return months.map((month, i) => {
    // Seasonal variation
    const seasonalFactor = resource === "gas" 
      ? (i < 3 || i > 9 ? 1.4 : 0.7) // Higher gas in winter
      : resource === "electricity"
      ? (i > 4 && i < 9 ? 1.2 : 0.9) // Higher electricity in summer
      : 1 + Math.sin(i / 2) * 0.15
    
    const current = Math.round(base * seasonalFactor * (0.9 + Math.random() * 0.2))
    const previous = Math.round(current * (0.85 + Math.random() * 0.3))
    const predicted = Math.round(current * (0.95 + Math.random() * 0.1))
    
    return {
      month,
      current,
      previous,
      predicted,
    }
  })
}

const resourceConfigs: Record<string, ChartConfig> = {
  electricity: {
    current: { label: "Current Year", color: "oklch(0.85 0.18 85)" },
    previous: { label: "Previous Year", color: "oklch(0.65 0.12 85)" },
    predicted: { label: "AI Predicted", color: "oklch(0.75 0.15 195)" },
  },
  water: {
    current: { label: "Current Year", color: "oklch(0.7 0.15 230)" },
    previous: { label: "Previous Year", color: "oklch(0.5 0.1 230)" },
    predicted: { label: "AI Predicted", color: "oklch(0.75 0.15 195)" },
  },
  gas: {
    current: { label: "Current Year", color: "oklch(0.75 0.18 45)" },
    previous: { label: "Previous Year", color: "oklch(0.55 0.12 45)" },
    predicted: { label: "AI Predicted", color: "oklch(0.75 0.15 195)" },
  },
  transport: {
    current: { label: "Current Year", color: "oklch(0.7 0.18 145)" },
    previous: { label: "Previous Year", color: "oklch(0.5 0.12 145)" },
    predicted: { label: "AI Predicted", color: "oklch(0.75 0.15 195)" },
  },
}

const units: Record<string, string> = {
  electricity: "kWh",
  water: "m³",
  gas: "m³",
  transport: "trips",
}

interface ResourceChartProps {
  resource: string
  scope: string
  chartType: "area" | "bar" | "line"
}

export function ResourceChart({ resource, scope, chartType }: ResourceChartProps) {
  const data = useMemo(() => generateMonthlyData(resource, scope), [resource, scope])
  const config = resourceConfigs[resource] || resourceConfigs.electricity
  const unit = units[resource] || "units"

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toString()
  }

  return (
    <ChartContainer config={config} className="h-[350px] w-full">
      {chartType === "area" ? (
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${resource}-current`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-current)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--color-current)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`gradient-${resource}-previous`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-previous)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--color-previous)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke="var(--muted-foreground)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="var(--muted-foreground)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
          />
          <ChartTooltip 
            content={
              <ChartTooltipContent 
                labelFormatter={(value) => `${value} (${unit})`}
              />
            } 
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            type="monotone"
            dataKey="previous"
            stroke="var(--color-previous)"
            fill={`url(#gradient-${resource}-previous)`}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="current"
            stroke="var(--color-current)"
            fill={`url(#gradient-${resource}-current)`}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="predicted"
            stroke="var(--color-predicted)"
            fill="transparent"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </AreaChart>
      ) : chartType === "bar" ? (
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke="var(--muted-foreground)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="var(--muted-foreground)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
          />
          <ChartTooltip 
            content={
              <ChartTooltipContent 
                labelFormatter={(value) => `${value} (${unit})`}
              />
            } 
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="previous" fill="var(--color-previous)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="current" fill="var(--color-current)" radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : (
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke="var(--muted-foreground)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="var(--muted-foreground)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
          />
          <ChartTooltip 
            content={
              <ChartTooltipContent 
                labelFormatter={(value) => `${value} (${unit})`}
              />
            } 
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="previous"
            stroke="var(--color-previous)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="current"
            stroke="var(--color-current)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="var(--color-predicted)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      )}
    </ChartContainer>
  )
}


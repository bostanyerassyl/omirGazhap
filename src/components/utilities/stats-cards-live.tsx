import { TrendingUp, TrendingDown, Minus, Zap, Droplets, Flame, Bus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { UtilitiesDistrictMetric, UtilitiesResourceMetrics } from "@/types/dashboard"
import { cn } from "@/utils/cn"

interface StatsCardsLiveProps {
  resource: string
  scope: string
  metrics: UtilitiesResourceMetrics
  district: UtilitiesDistrictMetric | null
}

const resourceVisuals: Record<string, {
  icon: typeof Zap
  color: string
  bgColor: string
}> = {
  electricity: {
    icon: Zap,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
  },
  water: {
    icon: Droplets,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  gas: {
    icon: Flame,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
  },
  transport: {
    icon: Bus,
    color: "text-green-400",
    bgColor: "bg-green-400/10",
  },
}

const formatValue = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toString()
}

function getScopeMultiplier(scope: string, district: UtilitiesDistrictMetric | null) {
  if (scope === "district" && district) {
    return Math.max(0.1, district.consumption / 100)
  }

  return 1
}

export function StatsCardsLive({
  resource,
  scope,
  metrics,
  district,
}: StatsCardsLiveProps) {
  const visual = resourceVisuals[resource] || resourceVisuals.electricity
  const Icon = visual.icon
  const multiplier = getScopeMultiplier(scope, district)
  const currentValue = Math.round(metrics.currentValue * multiplier)
  const previousValue = Math.round(metrics.previousValue * multiplier)
  const cost = Math.round(metrics.cost * multiplier)
  const change = previousValue === 0 ? 0 : ((currentValue - previousValue) / previousValue) * 100
  const isPositive = change > 0
  const isNeutral = Math.abs(change) < 1

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Month</span>
            <div className={cn("rounded-lg p-2", visual.bgColor)}>
              <Icon className={cn("h-4 w-4", visual.color)} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">{formatValue(currentValue)}</p>
            <p className="text-xs text-muted-foreground">{metrics.unit}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">YoY Change</span>
            <div
              className={cn(
                "rounded-lg p-2",
                isNeutral ? "bg-muted" : isPositive ? "bg-red-500/10" : "bg-green-500/10",
              )}
            >
              {isNeutral ? (
                <Minus className="h-4 w-4 text-muted-foreground" />
              ) : isPositive ? (
                <TrendingUp className="h-4 w-4 text-red-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-400" />
              )}
            </div>
          </div>
          <div className="space-y-1">
            <p
              className={cn(
                "text-2xl font-bold",
                isNeutral ? "text-foreground" : isPositive ? "text-red-400" : "text-green-400",
              )}
            >
              {isPositive ? "+" : ""}
              {change.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">vs previous period</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Efficiency</span>
            <div className="rounded-lg bg-accent/10 p-2">
              <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-accent">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-foreground">{metrics.efficiency}%</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${metrics.efficiency}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Monthly Cost</span>
            <div className="rounded-lg bg-accent/10 p-2">
              <span className="text-sm font-bold text-accent">$</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">${formatValue(cost)}</p>
            <p className="text-xs text-muted-foreground">estimated</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

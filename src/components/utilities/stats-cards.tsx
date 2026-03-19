import { TrendingUp, TrendingDown, Minus, Zap, Droplets, Flame, Bus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/utils/cn"

interface StatsCardsProps {
  resource: string
  scope: string
}

const resourceData: Record<string, {
  icon: typeof Zap
  color: string
  bgColor: string
  unit: string
  currentValue: number
  previousValue: number
  efficiency: number
  cost: number
}> = {
  electricity: {
    icon: Zap,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    unit: "kWh",
    currentValue: 4523000,
    previousValue: 4125000,
    efficiency: 87,
    cost: 156000,
  },
  water: {
    icon: Droplets,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    unit: "m³",
    currentValue: 3250000,
    previousValue: 3480000,
    efficiency: 92,
    cost: 89000,
  },
  gas: {
    icon: Flame,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    unit: "m³",
    currentValue: 2870000,
    previousValue: 2650000,
    efficiency: 78,
    cost: 125000,
  },
  transport: {
    icon: Bus,
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    unit: "trips",
    currentValue: 1520000,
    previousValue: 1380000,
    efficiency: 85,
    cost: 45000,
  },
}

const formatValue = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
  return value.toString()
}

export function StatsCards({ resource, scope }: StatsCardsProps) {
  const data = resourceData[resource] || resourceData.electricity
  const Icon = data.icon
  
  // Adjust values based on scope
  const multiplier = scope === "city" ? 1 : scope === "district" ? 0.1 : 0.001
  const currentValue = Math.round(data.currentValue * multiplier)
  const previousValue = Math.round(data.previousValue * multiplier)
  const cost = Math.round(data.cost * multiplier)
  
  const change = ((currentValue - previousValue) / previousValue) * 100
  const isPositive = change > 0
  const isNeutral = Math.abs(change) < 1

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Current Consumption */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Current Month</span>
            <div className={cn("p-2 rounded-lg", data.bgColor)}>
              <Icon className={cn("w-4 h-4", data.color)} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">
              {formatValue(currentValue)}
            </p>
            <p className="text-xs text-muted-foreground">{data.unit}</p>
          </div>
        </CardContent>
      </Card>

      {/* Year over Year Change */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">YoY Change</span>
            <div className={cn(
              "p-2 rounded-lg",
              isNeutral ? "bg-muted" : isPositive ? "bg-red-500/10" : "bg-green-500/10"
            )}>
              {isNeutral ? (
                <Minus className="w-4 h-4 text-muted-foreground" />
              ) : isPositive ? (
                <TrendingUp className="w-4 h-4 text-red-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-400" />
              )}
            </div>
          </div>
          <div className="space-y-1">
            <p className={cn(
              "text-2xl font-bold",
              isNeutral ? "text-foreground" : isPositive ? "text-red-400" : "text-green-400"
            )}>
              {isPositive ? "+" : ""}{change.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">vs last year</p>
          </div>
        </CardContent>
      </Card>

      {/* Efficiency */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Efficiency</span>
            <div className="p-2 rounded-lg bg-accent/10">
              <div className="w-4 h-4 rounded-full border-2 border-accent flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-foreground">{data.efficiency}%</p>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${data.efficiency}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Cost */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Monthly Cost</span>
            <div className="p-2 rounded-lg bg-accent/10">
              <span className="text-accent font-bold text-sm">$</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">
              ${formatValue(cost)}
            </p>
            <p className="text-xs text-muted-foreground">estimated</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


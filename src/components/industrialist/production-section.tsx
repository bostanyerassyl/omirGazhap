import { useState } from "react"
import { 
  Factory, Package, TrendingUp, TrendingDown, Target,
  Clock, Zap, Users, Send, FileText
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  ComposedChart,
} from "recharts"
import { StatusMessage } from "@/components/ui/status-message"
import type { IndustrialistProductionData } from "@/types/dashboard"

type ProductionSectionProps = {
  data: IndustrialistProductionData
  onSendReport: () => Promise<void>
}

export function ProductionSection({ data, onSendReport }: ProductionSectionProps) {
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  const handleSendReport = async () => {
    setReporting(true)
    setReportError(null)
    try {
      await onSendReport()
      setReportDialogOpen(false)
    } catch (reportError) {
      setReportError(reportError instanceof Error ? reportError.message : "Unable to send production report.")
    } finally {
      setReporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.stats.map((stat) => {
          const Icon =
            stat.label.includes("Units")
              ? Package
              : stat.label.includes("Efficiency")
                ? Target
                : stat.label.includes("Uptime")
                  ? Clock
                  : Zap
          const isPositive = stat.label === "Energy per Unit" ? stat.change < 0 : stat.change > 0
          return (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    isPositive ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {Math.abs(stat.change)}%
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-xs text-accent">{stat.subtext}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Production Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Monthly Production vs Target</CardTitle>
          <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Send className="w-4 h-4 mr-2" />
                Send Report to Akimat
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Production Report for Akimat</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 bg-secondary rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    <span className="font-medium">Annual Production Summary</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Units</p>
                      <p className="font-semibold">{data.stats[0]?.value ?? "0"} units</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Target Achievement</p>
                      <p className="font-semibold text-emerald-400">{data.stats[1]?.value ?? "0%"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Efficiency Rate</p>
                      <p className="font-semibold">{data.stats[1]?.value ?? "0%"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Energy Consumption</p>
                      <p className="font-semibold">{data.stats[3]?.value ?? "0 kWh"}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-secondary rounded-lg space-y-2">
                  <p className="font-medium">Includes:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>- Monthly production breakdown</li>
                    <li>- Product line performance</li>
                    <li>- Efficiency metrics</li>
                    <li>- Resource utilization</li>
                  </ul>
                </div>
                {reportError ? <StatusMessage tone="error">{reportError}</StatusMessage> : null}
                <Button 
                  onClick={() => void handleSendReport()}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={reporting}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {reporting ? "Sending..." : "Confirm & Send Report"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.005 260)" />
                <XAxis dataKey="month" stroke="oklch(0.5 0 0)" fontSize={12} />
                <YAxis yAxisId="left" stroke="oklch(0.5 0 0)" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="oklch(0.5 0 0)" fontSize={12} domain={[80, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.18 0.005 260)",
                    border: "1px solid oklch(0.28 0.005 260)",
                    borderRadius: "8px",
                    color: "oklch(0.98 0 0)",
                  }}
                />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="actual" 
                  fill="oklch(0.75 0.15 195)" 
                  name="Actual (units)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="target" 
                  fill="oklch(0.4 0.1 195)" 
                  name="Target (units)"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="efficiency"
                  stroke="oklch(0.7 0.15 140)"
                  strokeWidth={2}
                  dot={{ fill: "oklch(0.7 0.15 140)" }}
                  name="Efficiency (%)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Product Lines & Weekly Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Lines */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Product Lines Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.productLines.map((line) => (
              <div key={line.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Factory className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{line.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {line.units.toLocaleString()} / {line.target.toLocaleString()}
                    </span>
                    <Badge className={
                      line.status === "exceeding" ? "bg-emerald-500/20 text-emerald-400" :
                      line.status === "behind" ? "bg-red-500/20 text-red-400" :
                      "bg-blue-500/20 text-blue-400"
                    }>
                      {line.efficiency}%
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={Math.min((line.units / line.target) * 100, 100)} 
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Weekly Breakdown by Shift */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Weekly Output by Shift</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.005 260)" />
                  <XAxis dataKey="day" stroke="oklch(0.5 0 0)" fontSize={12} />
                  <YAxis stroke="oklch(0.5 0 0)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.18 0.005 260)",
                      border: "1px solid oklch(0.28 0.005 260)",
                      borderRadius: "8px",
                      color: "oklch(0.98 0 0)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="shift1" fill="oklch(0.75 0.15 195)" name="Shift 1" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="shift2" fill="oklch(0.6 0.12 195)" name="Shift 2" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="shift3" fill="oklch(0.45 0.1 195)" name="Shift 3" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workforce Stats */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Workforce & Capacity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-secondary rounded-lg text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold">{data.workforce.totalWorkers}</p>
              <p className="text-sm text-muted-foreground">Total Workers</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg text-center">
              <Factory className="w-6 h-6 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold">{data.workforce.productionLines}</p>
              <p className="text-sm text-muted-foreground">Production Lines</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold">{data.workforce.activeShifts}</p>
              <p className="text-sm text-muted-foreground">Active Shifts</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg text-center">
              <Target className="w-6 h-6 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold">{data.workforce.capacityUsed}%</p>
              <p className="text-sm text-muted-foreground">Capacity Used</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


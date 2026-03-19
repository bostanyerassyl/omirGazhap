import { useState } from "react"
import { 
  Wind, Droplets, Trash2, AlertTriangle, CheckCircle2, 
  Clock, TrendingDown, TrendingUp, FileText, Send,
  ChevronDown, ChevronUp, Plus
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const emissionsData = [
  { month: "Jan", co2: 4200, nox: 180, so2: 95, particles: 45 },
  { month: "Feb", co2: 4100, nox: 175, so2: 90, particles: 42 },
  { month: "Mar", co2: 3900, nox: 165, so2: 85, particles: 40 },
  { month: "Apr", co2: 3700, nox: 155, so2: 80, particles: 38 },
  { month: "May", co2: 3500, nox: 145, so2: 75, particles: 35 },
  { month: "Jun", co2: 3300, nox: 140, so2: 70, particles: 33 },
  { month: "Jul", co2: 3200, nox: 135, so2: 68, particles: 32 },
  { month: "Aug", co2: 3100, nox: 130, so2: 65, particles: 30 },
  { month: "Sep", co2: 3000, nox: 125, so2: 62, particles: 28 },
  { month: "Oct", co2: 2900, nox: 120, so2: 60, particles: 27 },
  { month: "Nov", co2: 2850, nox: 118, so2: 58, particles: 26 },
  { month: "Dec", co2: 2800, nox: 115, so2: 55, particles: 25 },
]

const pollutionBreakdown = [
  { name: "CO2", value: 65, color: "oklch(0.65 0.15 195)" },
  { name: "NOx", value: 18, color: "oklch(0.7 0.15 60)" },
  { name: "SO2", value: 12, color: "oklch(0.6 0.15 300)" },
  { name: "Particles", value: 5, color: "oklch(0.55 0.1 30)" },
]

interface Incident {
  id: string
  type: "leak" | "excess" | "violation" | "accident"
  title: string
  date: string
  severity: "low" | "medium" | "high" | "critical"
  consequence: string
  solution: string
  status: "pending" | "in-progress" | "resolved"
  reportedToAkimat: boolean
}

const initialIncidents: Incident[] = [
  {
    id: "1",
    type: "excess",
    title: "CO2 Emission Limit Exceeded",
    date: "2024-01-15",
    severity: "medium",
    consequence: "Exceeded monthly CO2 limit by 8%, potential fine of 500,000 KZT",
    solution: "Installed additional carbon filters, reduced production during peak hours",
    status: "resolved",
    reportedToAkimat: true,
  },
  {
    id: "2",
    type: "leak",
    title: "Minor Chemical Leak in Section B",
    date: "2024-02-20",
    severity: "high",
    consequence: "Contamination risk to nearby water source, evacuation of 50m radius",
    solution: "Emergency containment, soil treatment, water quality monitoring for 30 days",
    status: "resolved",
    reportedToAkimat: true,
  },
  {
    id: "3",
    type: "violation",
    title: "Noise Pollution During Night Hours",
    date: "2024-03-10",
    severity: "low",
    consequence: "Complaints from residential area, warning from environmental agency",
    solution: "Adjusted production schedule, installed sound barriers",
    status: "in-progress",
    reportedToAkimat: false,
  },
]

export function EmissionsSection() {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents)
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null)
  const [newIncidentOpen, setNewIncidentOpen] = useState(false)
  const [newIncident, setNewIncident] = useState({
    type: "excess" as Incident["type"],
    title: "",
    severity: "medium" as Incident["severity"],
    consequence: "",
    solution: "",
  })

  const stats = [
    {
      label: "Total CO2 (tons/year)",
      value: "40,550",
      change: -12,
      icon: Wind,
      limit: "45,000",
      current: 40550,
      max: 45000,
    },
    {
      label: "NOx Emissions (kg/year)",
      value: "1,703",
      change: -15,
      icon: Droplets,
      limit: "2,000",
      current: 1703,
      max: 2000,
    },
    {
      label: "Waste Processed (%)",
      value: "94.2%",
      change: 8,
      icon: Trash2,
      limit: "90%",
      current: 94.2,
      max: 100,
    },
    {
      label: "Incidents This Year",
      value: "3",
      change: -40,
      icon: AlertTriangle,
      limit: "5 max",
      current: 3,
      max: 5,
    },
  ]

  const handleAddIncident = () => {
    const incident: Incident = {
      id: Date.now().toString(),
      ...newIncident,
      date: new Date().toISOString().split("T")[0],
      status: "pending",
      reportedToAkimat: false,
    }
    setIncidents([incident, ...incidents])
    setNewIncidentOpen(false)
    setNewIncident({
      type: "excess",
      title: "",
      severity: "medium",
      consequence: "",
      solution: "",
    })
  }

  const handleReportToAkimat = (id: string) => {
    setIncidents(incidents.map(inc => 
      inc.id === id ? { ...inc, reportedToAkimat: true } : inc
    ))
  }

  const getSeverityColor = (severity: Incident["severity"]) => {
    switch (severity) {
      case "low": return "bg-emerald-500/20 text-emerald-400"
      case "medium": return "bg-yellow-500/20 text-yellow-400"
      case "high": return "bg-orange-500/20 text-orange-400"
      case "critical": return "bg-red-500/20 text-red-400"
    }
  }

  const getStatusColor = (status: Incident["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-500/20 text-yellow-400"
      case "in-progress": return "bg-blue-500/20 text-blue-400"
      case "resolved": return "bg-emerald-500/20 text-emerald-400"
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const percentage = (stat.current / stat.max) * 100
          return (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.change < 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {stat.change < 0 ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                    {Math.abs(stat.change)}%
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Limit: {stat.limit}</span>
                    <span>{percentage.toFixed(0)}%</span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-1.5"
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Emissions Trend Chart */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Emissions Trend (2024)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={emissionsData}>
                  <defs>
                    <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.75 0.15 195)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.75 0.15 195)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.005 260)" />
                  <XAxis dataKey="month" stroke="oklch(0.5 0 0)" fontSize={12} />
                  <YAxis stroke="oklch(0.5 0 0)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.18 0.005 260)",
                      border: "1px solid oklch(0.28 0.005 260)",
                      borderRadius: "8px",
                      color: "oklch(0.98 0 0)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="co2"
                    stroke="oklch(0.75 0.15 195)"
                    fill="url(#co2Gradient)"
                    strokeWidth={2}
                    name="CO2 (tons)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pollution Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Pollution Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pollutionBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pollutionBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.18 0.005 260)",
                      border: "1px solid oklch(0.28 0.005 260)",
                      borderRadius: "8px",
                      color: "oklch(0.98 0 0)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {pollutionBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Incidents Section */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">
            Incidents & Solutions
          </CardTitle>
          <Dialog open={newIncidentOpen} onOpenChange={setNewIncidentOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="w-4 h-4 mr-2" />
                Report Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Report New Incident</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Incident Type</Label>
                  <Select
                    value={newIncident.type}
                    onValueChange={(v) => setNewIncident({ ...newIncident, type: v as Incident["type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leak">Leak</SelectItem>
                      <SelectItem value="excess">Emission Excess</SelectItem>
                      <SelectItem value="violation">Violation</SelectItem>
                      <SelectItem value="accident">Accident</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newIncident.title}
                    onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                    placeholder="Brief description of the incident"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select
                    value={newIncident.severity}
                    onValueChange={(v) => setNewIncident({ ...newIncident, severity: v as Incident["severity"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Consequences</Label>
                  <Textarea
                    value={newIncident.consequence}
                    onChange={(e) => setNewIncident({ ...newIncident, consequence: e.target.value })}
                    placeholder="Describe the consequences of this incident"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Solution / Actions Taken</Label>
                  <Textarea
                    value={newIncident.solution}
                    onChange={(e) => setNewIncident({ ...newIncident, solution: e.target.value })}
                    placeholder="Describe the solutions implemented"
                  />
                </div>
                <Button 
                  onClick={handleAddIncident}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={!newIncident.title || !newIncident.consequence}
                >
                  Submit Incident Report
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedIncident(
                  expandedIncident === incident.id ? null : incident.id
                )}
                className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 ${
                    incident.severity === "critical" ? "text-red-400" :
                    incident.severity === "high" ? "text-orange-400" :
                    incident.severity === "medium" ? "text-yellow-400" :
                    "text-emerald-400"
                  }`} />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{incident.title}</p>
                    <p className="text-sm text-muted-foreground">{incident.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getSeverityColor(incident.severity)}>
                    {incident.severity}
                  </Badge>
                  <Badge className={getStatusColor(incident.status)}>
                    {incident.status}
                  </Badge>
                  {expandedIncident === incident.id ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>
              
              {expandedIncident === incident.id && (
                <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                        Consequences
                      </div>
                      <p className="text-sm text-muted-foreground bg-red-500/10 p-3 rounded-lg">
                        {incident.consequence}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        Solution
                      </div>
                      <p className="text-sm text-muted-foreground bg-emerald-500/10 p-3 rounded-lg">
                        {incident.solution}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {incident.reportedToAkimat ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Reported to Akimat
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-yellow-400" />
                          Not yet reported
                        </>
                      )}
                    </div>
                    {!incident.reportedToAkimat && (
                      <Button
                        size="sm"
                        onClick={() => handleReportToAkimat(incident.id)}
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send to Akimat
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}


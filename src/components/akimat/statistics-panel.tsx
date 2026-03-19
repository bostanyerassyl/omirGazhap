import { useState } from "react"
import { 
  BarChart3, 
  Zap,
  Droplets,
  Flame,
  Factory,
  Car,
  TrendingUp,
  TrendingDown,
  MapPin,
  Building2,
  ChevronRight,
  Calendar
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/utils/cn"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts"

// Monthly utility data
const utilityData = [
  { month: "Jan", electricity: 4200, water: 3100, gas: 2800 },
  { month: "Feb", electricity: 4000, water: 2900, gas: 3200 },
  { month: "Mar", electricity: 3800, water: 3200, gas: 2600 },
  { month: "Apr", electricity: 3500, water: 3400, gas: 2200 },
  { month: "May", electricity: 3200, water: 3600, gas: 1800 },
  { month: "Jun", electricity: 3800, water: 4000, gas: 1500 },
  { month: "Jul", electricity: 4500, water: 4200, gas: 1400 },
  { month: "Aug", electricity: 4600, water: 4100, gas: 1500 },
  { month: "Sep", electricity: 4000, water: 3800, gas: 1900 },
  { month: "Oct", electricity: 3700, water: 3500, gas: 2400 },
  { month: "Nov", electricity: 4100, water: 3200, gas: 2900 },
  { month: "Dec", electricity: 4400, water: 3000, gas: 3400 },
]

// Industrial data
const industrialData = [
  { month: "Jan", emissions: 850, production: 12000, profit: 4500 },
  { month: "Feb", emissions: 820, production: 11500, profit: 4200 },
  { month: "Mar", emissions: 780, production: 13000, profit: 5100 },
  { month: "Apr", emissions: 750, production: 12500, profit: 4800 },
  { month: "May", emissions: 720, production: 14000, profit: 5500 },
  { month: "Jun", emissions: 690, production: 13500, profit: 5200 },
  { month: "Jul", emissions: 710, production: 12000, profit: 4600 },
  { month: "Aug", emissions: 680, production: 13000, profit: 5000 },
  { month: "Sep", emissions: 650, production: 14500, profit: 5800 },
  { month: "Oct", emissions: 620, production: 15000, profit: 6200 },
  { month: "Nov", emissions: 600, production: 14000, profit: 5600 },
  { month: "Dec", emissions: 580, production: 13500, profit: 5300 },
]

// Traffic data by street
const trafficStreets = [
  { name: "Nazarbayev Ave", congestion: 78, avgSpeed: 25, accidents: 3 },
  { name: "Al-Farabi Ave", congestion: 65, avgSpeed: 35, accidents: 1 },
  { name: "Abay St", congestion: 82, avgSpeed: 20, accidents: 5 },
  { name: "Dostyk St", congestion: 45, avgSpeed: 45, accidents: 0 },
  { name: "Tole Bi St", congestion: 58, avgSpeed: 38, accidents: 2 },
  { name: "Satpayev St", congestion: 70, avgSpeed: 30, accidents: 2 },
]

// Traffic data over time
const trafficYearlyData = [
  { year: "2020", avgCongestion: 45, avgSpeed: 42 },
  { year: "2021", avgCongestion: 52, avgSpeed: 38 },
  { year: "2022", avgCongestion: 58, avgSpeed: 35 },
  { year: "2023", avgCongestion: 62, avgSpeed: 32 },
  { year: "2024", avgCongestion: 55, avgSpeed: 36 },
]

const trafficMonthlyData = [
  { month: "Jan", congestion: 52, speed: 38 },
  { month: "Feb", congestion: 48, speed: 40 },
  { month: "Mar", congestion: 55, speed: 36 },
  { month: "Apr", congestion: 58, speed: 34 },
  { month: "May", congestion: 62, speed: 32 },
  { month: "Jun", congestion: 65, speed: 30 },
  { month: "Jul", congestion: 58, speed: 34 },
  { month: "Aug", congestion: 55, speed: 36 },
  { month: "Sep", congestion: 68, speed: 28 },
  { month: "Oct", congestion: 70, speed: 26 },
  { month: "Nov", congestion: 65, speed: 30 },
  { month: "Dec", congestion: 60, speed: 33 },
]

// District data
const districts = [
  { name: "Almaly", electricity: 1200, water: 900, gas: 800 },
  { name: "Bostandyk", electricity: 1100, water: 850, gas: 750 },
  { name: "Medeu", electricity: 950, water: 780, gas: 680 },
  { name: "Auezov", electricity: 1050, water: 820, gas: 720 },
]

const COLORS = ["#22d3ee", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"]

export function StatisticsPanel() {
  const [scope, setScope] = useState<"city" | "district" | "building">("city")
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all")
  const [trafficView, setTrafficView] = useState<"yearly" | "monthly">("monthly")
  const [selectedStreet, setSelectedStreet] = useState<string>("all")

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <BarChart3 className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[800px] sm:max-w-full p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            City Statistics
          </SheetTitle>
        </SheetHeader>

        <div className="h-[calc(100vh-80px)] overflow-y-auto p-4">
          <Tabs defaultValue="utilities" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="utilities" className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Utilities</span>
              </TabsTrigger>
              <TabsTrigger value="industrial" className="flex items-center gap-1">
                <Factory className="h-4 w-4" />
                <span className="hidden sm:inline">Industrial</span>
              </TabsTrigger>
              <TabsTrigger value="traffic" className="flex items-center gap-1">
                <Car className="h-4 w-4" />
                <span className="hidden sm:inline">Traffic</span>
              </TabsTrigger>
            </TabsList>

            {/* UTILITIES TAB */}
            <TabsContent value="utilities" className="space-y-4">
              {/* Scope Selector */}
              <div className="flex gap-2 items-center">
                <Select value={scope} onValueChange={(v: "city" | "district" | "building") => setScope(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="city">City-wide</SelectItem>
                    <SelectItem value="district">District</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                  </SelectContent>
                </Select>
                
                {scope === "district" && (
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Districts</SelectItem>
                      {districts.map(d => (
                        <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs text-muted-foreground">Electricity</span>
                  </div>
                  <div className="text-xl font-bold text-cyan-400">47.2K</div>
                  <div className="text-xs text-muted-foreground">MWh/year</div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
                    <TrendingDown className="h-3 w-3" />
                    -5.2%
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-muted-foreground">Water</span>
                  </div>
                  <div className="text-xl font-bold text-blue-400">42.0K</div>
                  <div className="text-xs text-muted-foreground">m3/year</div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-red-400">
                    <TrendingUp className="h-3 w-3" />
                    +3.1%
                  </div>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <span className="text-xs text-muted-foreground">Gas</span>
                  </div>
                  <div className="text-xl font-bold text-orange-400">27.6K</div>
                  <div className="text-xs text-muted-foreground">m3/year</div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
                    <TrendingDown className="h-3 w-3" />
                    -8.4%
                  </div>
                </div>
              </div>

              {/* Main Chart */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-medium mb-4">Monthly Consumption (2024)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={utilityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="electricity" stackId="1" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.3} name="Electricity (MWh)" />
                      <Area type="monotone" dataKey="water" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Water (m3)" />
                      <Area type="monotone" dataKey="gas" stackId="3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Gas (m3)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* District Breakdown */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-medium mb-4">Consumption by District</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={districts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="electricity" fill="#22d3ee" name="Electricity" />
                      <Bar dataKey="water" fill="#3b82f6" name="Water" />
                      <Bar dataKey="gas" fill="#f59e0b" name="Gas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            {/* INDUSTRIAL TAB */}
            <TabsContent value="industrial" className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Factory className="h-4 w-4 text-red-400" />
                    <span className="text-xs text-muted-foreground">Emissions</span>
                  </div>
                  <div className="text-xl font-bold text-red-400">8.45K</div>
                  <div className="text-xs text-muted-foreground">tons CO2/year</div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
                    <TrendingDown className="h-3 w-3" />
                    -12.5%
                  </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-muted-foreground">Production</span>
                  </div>
                  <div className="text-xl font-bold text-emerald-400">158.5K</div>
                  <div className="text-xs text-muted-foreground">units/year</div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
                    <TrendingUp className="h-3 w-3" />
                    +8.3%
                  </div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-purple-400" />
                    <span className="text-xs text-muted-foreground">Total Profit</span>
                  </div>
                  <div className="text-xl font-bold text-purple-400">$61.8M</div>
                  <div className="text-xs text-muted-foreground">annual</div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
                    <TrendingUp className="h-3 w-3" />
                    +15.2%
                  </div>
                </div>
              </div>

              {/* Emissions vs Production Chart */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-medium mb-4">Emissions vs Production (2024)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={industrialData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="emissions" stroke="#ef4444" strokeWidth={2} name="Emissions (tons)" dot={{ fill: "#ef4444" }} />
                      <Line yAxisId="right" type="monotone" dataKey="production" stroke="#10b981" strokeWidth={2} name="Production (units)" dot={{ fill: "#10b981" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Profit Chart */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-medium mb-4">Monthly Profit (2024)</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={industrialData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="profit" fill="#8b5cf6" name="Profit ($K)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            {/* TRAFFIC TAB */}
            <TabsContent value="traffic" className="space-y-4">
              {/* View Toggle */}
              <div className="flex gap-2 items-center">
                <Select value={trafficView} onValueChange={(v: "yearly" | "monthly") => setTrafficView(v)}>
                  <SelectTrigger className="w-32">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedStreet} onValueChange={setSelectedStreet}>
                  <SelectTrigger className="w-48">
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select street" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Streets</SelectItem>
                    {trafficStreets.map(s => (
                      <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Traffic Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="h-4 w-4 text-amber-400" />
                    <span className="text-xs text-muted-foreground">Avg Congestion</span>
                  </div>
                  <div className="text-xl font-bold text-amber-400">62%</div>
                  <div className="text-xs text-muted-foreground">city average</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-muted-foreground">Avg Speed</span>
                  </div>
                  <div className="text-xl font-bold text-blue-400">32</div>
                  <div className="text-xs text-muted-foreground">km/h</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-red-400" />
                    <span className="text-xs text-muted-foreground">Accidents</span>
                  </div>
                  <div className="text-xl font-bold text-red-400">13</div>
                  <div className="text-xs text-muted-foreground">this month</div>
                </div>
              </div>

              {/* Traffic Trends Chart */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-medium mb-4">
                  {trafficView === "yearly" ? "Traffic Trends (5 Years)" : "Monthly Traffic (2024)"}
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={
                        trafficView === "yearly"
                          ? (trafficYearlyData as any)
                          : (trafficMonthlyData as any)
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey={trafficView === "yearly" ? "year" : "month"} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey={trafficView === "yearly" ? "avgCongestion" : "congestion"} 
                        stroke="#f59e0b" 
                        strokeWidth={2} 
                        name="Congestion (%)" 
                        dot={{ fill: "#f59e0b" }} 
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey={trafficView === "yearly" ? "avgSpeed" : "speed"} 
                        stroke="#22d3ee" 
                        strokeWidth={2} 
                        name="Avg Speed (km/h)" 
                        dot={{ fill: "#22d3ee" }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Street Congestion */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-medium mb-4">Street Congestion Levels</h3>
                <div className="space-y-3">
                  {trafficStreets.map((street) => (
                    <div key={street.name} className="flex items-center gap-3">
                      <div className="w-32 text-sm truncate">{street.name}</div>
                      <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            street.congestion > 70 ? "bg-red-500" :
                            street.congestion > 50 ? "bg-amber-500" : "bg-green-500"
                          )}
                          style={{ width: `${street.congestion}%` }}
                        />
                      </div>
                      <div className="w-12 text-sm font-medium text-right">{street.congestion}%</div>
                      <div className="w-16 text-xs text-muted-foreground">{street.avgSpeed} km/h</div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}


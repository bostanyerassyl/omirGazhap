import { useState } from 'react'
import {
  BarChart3,
  Zap,
  Factory,
  Car,
  TrendingUp,
  MapPin,
  Calendar,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/utils/cn'
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
} from 'recharts'
import type { AkimatStatistics } from '@/types/dashboard'

type StatisticsPanelProps = {
  statistics?: AkimatStatistics
}

const emptyStatistics: AkimatStatistics = {
  utilitySummary: { events: 0, cases: 0, observations: 0 },
  utilityMonthly: [],
  utilityByZone: [],
  industrialSummary: { facilities: 0, issues: 0, observations: 0 },
  industrialMonthly: [],
  trafficSummary: { incidents: 0, observations: 0, activeLocations: 0 },
  trafficMonthly: [],
  trafficByStreet: [],
}

export function StatisticsPanel({ statistics = emptyStatistics }: StatisticsPanelProps) {
  const [trafficView, setTrafficView] = useState<'monthly' | 'overview'>('monthly')
  const [selectedStreet, setSelectedStreet] = useState<string>('all')
  const visibleTrafficByStreet =
    selectedStreet === 'all'
      ? statistics.trafficByStreet
      : statistics.trafficByStreet.filter((street) => street.name === selectedStreet)

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

            <TabsContent value="utilities" className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs text-muted-foreground">Utility Events</span>
                  </div>
                  <div className="text-xl font-bold text-cyan-400">{statistics.utilitySummary.events}</div>
                  <div className="text-xs text-muted-foreground">from events table</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-muted-foreground">Utility Cases</span>
                  </div>
                  <div className="text-xl font-bold text-blue-400">{statistics.utilitySummary.cases}</div>
                  <div className="text-xs text-muted-foreground">assigned to utilities</div>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-orange-400" />
                    <span className="text-xs text-muted-foreground">Observations</span>
                  </div>
                  <div className="text-xl font-bold text-orange-400">{statistics.utilitySummary.observations}</div>
                  <div className="text-xs text-muted-foreground">utility reports</div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-medium mb-4">Utility Activity by Month</h3>
                {statistics.utilityMonthly.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No utility trend data yet.</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={statistics.utilityMonthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="events" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} />
                      <Area type="monotone" dataKey="cases" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
                      <Area type="monotone" dataKey="observations" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-medium mb-4">Utility Activity by Zone</h3>
                {statistics.utilityByZone.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No zonal utility data yet.</p>
                ) : (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statistics.utilityByZone}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="zone" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="facilities" fill="#10b981" />
                      <Bar dataKey="issues" fill="#f59e0b" />
                      <Bar dataKey="cameras" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="industrial" className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Factory className="h-4 w-4 text-purple-400" />
                    <span className="text-xs text-muted-foreground">Facilities</span>
                  </div>
                  <div className="text-xl font-bold text-purple-400">{statistics.industrialSummary.facilities}</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-red-400" />
                    <span className="text-xs text-muted-foreground">Issues</span>
                  </div>
                  <div className="text-xl font-bold text-red-400">{statistics.industrialSummary.issues}</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-muted-foreground">Observations</span>
                  </div>
                  <div className="text-xl font-bold text-emerald-400">{statistics.industrialSummary.observations}</div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-medium mb-4">Industrial Activity by Month</h3>
                {statistics.industrialMonthly.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No industrial records yet.</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={statistics.industrialMonthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="facilities" stroke="#8b5cf6" strokeWidth={2} />
                      <Line type="monotone" dataKey="issues" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="observations" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="traffic" className="space-y-4">
              <div className="flex gap-2 items-center">
                <Select value={trafficView} onValueChange={(value: 'monthly' | 'overview') => setTrafficView(value)}>
                  <SelectTrigger className="w-36">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="overview">Overview</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedStreet} onValueChange={setSelectedStreet}>
                  <SelectTrigger className="w-48">
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select street" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Streets</SelectItem>
                    {statistics.trafficByStreet.map((street) => (
                      <SelectItem key={street.name} value={street.name}>{street.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="h-4 w-4 text-amber-400" />
                    <span className="text-xs text-muted-foreground">Incidents</span>
                  </div>
                  <div className="text-xl font-bold text-amber-400">{statistics.trafficSummary.incidents}</div>
                  <div className="text-xs text-muted-foreground">from events</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-muted-foreground">Observations</span>
                  </div>
                  <div className="text-xl font-bold text-blue-400">{statistics.trafficSummary.observations}</div>
                  <div className="text-xs text-muted-foreground">traffic-related reports</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-muted-foreground">Active Locations</span>
                  </div>
                  <div className="text-xl font-bold text-emerald-400">{statistics.trafficSummary.activeLocations}</div>
                  <div className="text-xs text-muted-foreground">locations with activity</div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-medium mb-4">
                  {trafficView === 'monthly' ? 'Traffic by Month' : 'Street Congestion Overview'}
                </h3>
                {trafficView === 'monthly' ? (
                  statistics.trafficMonthly.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No traffic trend data yet.</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={statistics.trafficMonthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="incidents" stroke="#f59e0b" strokeWidth={2} />
                      <Line type="monotone" dataKey="observations" stroke="#22d3ee" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                  )
                ) : visibleTrafficByStreet.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No street-level traffic data yet.</p>
                ) : (
                  <div className="space-y-3">
                  {visibleTrafficByStreet.map((street) => (
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
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}


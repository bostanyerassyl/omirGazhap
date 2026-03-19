"use client"

import { useState } from "react"
import { 
  User, 
  LogOut, 
  Settings, 
  BarChart3, 
  LineChart, 
  AreaChartIcon,
  Download,
  RefreshCw,
  Send,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UtilitiesNav } from "@/components/utilities/utilities-nav"
import { ResourceChart } from "@/components/utilities/resource-chart"
import { ScopeSelector } from "@/components/utilities/scope-selector"
import { StatsCards } from "@/components/utilities/stats-cards"
import { AIEventsPanel } from "@/components/utilities/ai-events-panel"
import { UtilitiesMap } from "@/components/utilities/utilities-map"
import { cn } from "@/utils/cn"

const chartTypes = [
  { id: "area", icon: AreaChartIcon, label: "Area" },
  { id: "bar", icon: BarChart3, label: "Bar" },
  { id: "line", icon: LineChart, label: "Line" },
] as const

export default function UtilitiesPage() {
  const [activeTab, setActiveTab] = useState("electricity")
  const [scope, setScope] = useState("city")
  const [district, setDistrict] = useState<string | null>(null)
  const [building, setBuilding] = useState<string | null>(null)
  const [chartType, setChartType] = useState<"area" | "bar" | "line">("area")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [reportSent, setReportSent] = useState(false)

  const handleScopeChange = (newScope: string, newDistrict: string | null, newBuilding: string | null) => {
    setScope(newScope)
    setDistrict(newDistrict)
    setBuilding(newBuilding)
  }

  const handleDistrictSelect = (districtId: string) => {
    setScope("district")
    setDistrict(districtId)
    setBuilding(null)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const handleSendReport = async () => {
    setReportSent(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setReportSent(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Profile */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10 border-2 border-accent">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-secondary text-foreground">PU</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-card border-border">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">Public Utilities</p>
                  <p className="text-xs text-muted-foreground">admin@utilities.alatau.kz</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  System Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-400">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-foreground">Alatau Utilities</h1>
              <p className="text-xs text-muted-foreground">Resource Management Dashboard</p>
            </div>
          </div>

          {/* Navigation */}
          <UtilitiesNav activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="bg-card"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
            <Button variant="outline" className="gap-2 bg-card hidden sm:flex">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button 
              variant="default" 
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleSendReport}
              disabled={reportSent}
            >
              {reportSent ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Sent!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Report to Akimat</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {activeTab === "events" ? (
          /* Events Tab */
          <AIEventsPanel />
        ) : (
          /* Resource Tabs */
          <>
            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <ScopeSelector
                scope={scope}
                district={district}
                building={building}
                onScopeChange={handleScopeChange}
              />

              {/* Chart Type Selector */}
              <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
                {chartTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <Button
                      key={type.id}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "gap-2",
                        chartType === type.id && "bg-card shadow-sm"
                      )}
                      onClick={() => setChartType(type.id)}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{type.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Stats Cards */}
            <StatsCards resource={activeTab} scope={scope} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart */}
              <Card className="lg:col-span-2 bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Monthly Consumption</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {scope === "city" ? "City-wide" : 
                       scope === "district" ? `${district?.charAt(0).toUpperCase()}${district?.slice(1)} District` : 
                       "Building Level"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResourceChart 
                    resource={activeTab} 
                    scope={scope} 
                    chartType={chartType}
                  />
                </CardContent>
              </Card>

              {/* Map */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">District Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <UtilitiesMap
                    onDistrictSelect={handleDistrictSelect}
                    selectedDistrict={district}
                    resource={activeTab}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Additional Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Peak Hours</h3>
                  <p className="text-2xl font-bold text-foreground">18:00 - 21:00</p>
                  <p className="text-xs text-muted-foreground mt-1">Highest consumption period</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Connections</h3>
                  <p className="text-2xl font-bold text-foreground">
                    {scope === "city" ? "245,832" : scope === "district" ? "24,583" : "1"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Registered meters</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Avg. Daily Usage</h3>
                  <p className="text-2xl font-bold text-foreground">
                    {activeTab === "electricity" ? "12.4 kWh" :
                     activeTab === "water" ? "8.2 m³" :
                     activeTab === "gas" ? "6.8 m³" : "3.2 trips"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Per household</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  )
}


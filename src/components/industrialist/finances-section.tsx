"use client"

import { useState } from "react"
import { 
  DollarSign, TrendingUp, TrendingDown, PiggyBank,
  Receipt, CreditCard, ArrowUpRight, ArrowDownRight,
  Send, FileText, Building, Zap, Users, Package
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  BarChart,
  Bar,
  Legend,
} from "recharts"

const revenueData = [
  { month: "Jan", revenue: 245, expenses: 180, profit: 65 },
  { month: "Feb", revenue: 268, expenses: 190, profit: 78 },
  { month: "Mar", revenue: 295, expenses: 205, profit: 90 },
  { month: "Apr", revenue: 280, expenses: 198, profit: 82 },
  { month: "May", revenue: 320, expenses: 215, profit: 105 },
  { month: "Jun", revenue: 310, expenses: 220, profit: 90 },
  { month: "Jul", revenue: 345, expenses: 235, profit: 110 },
  { month: "Aug", revenue: 365, expenses: 245, profit: 120 },
  { month: "Sep", revenue: 340, expenses: 230, profit: 110 },
  { month: "Oct", revenue: 380, expenses: 255, profit: 125 },
  { month: "Nov", revenue: 395, expenses: 265, profit: 130 },
  { month: "Dec", revenue: 420, expenses: 280, profit: 140 },
]

const expenseBreakdown = [
  { name: "Raw Materials", value: 42, amount: 1176, color: "oklch(0.75 0.15 195)" },
  { name: "Labor", value: 28, amount: 784, color: "oklch(0.65 0.15 160)" },
  { name: "Energy", value: 15, amount: 420, color: "oklch(0.7 0.15 60)" },
  { name: "Maintenance", value: 8, amount: 224, color: "oklch(0.6 0.15 300)" },
  { name: "Other", value: 7, amount: 196, color: "oklch(0.55 0.1 30)" },
]

const quarterlyComparison = [
  { quarter: "Q1", current: 882, previous: 780, growth: 13.1 },
  { quarter: "Q2", current: 975, previous: 850, growth: 14.7 },
  { quarter: "Q3", current: 1085, previous: 920, growth: 17.9 },
  { quarter: "Q4", current: 1195, previous: 1050, growth: 13.8 },
]

const recentTransactions = [
  { id: 1, type: "income", description: "Product Sales - Batch A-2024", amount: 45200, date: "2024-03-15" },
  { id: 2, type: "expense", description: "Raw Materials - Steel Order", amount: 18500, date: "2024-03-14" },
  { id: 3, type: "expense", description: "Energy Bill - February", amount: 12300, date: "2024-03-12" },
  { id: 4, type: "income", description: "Contract Payment - City Project", amount: 85000, date: "2024-03-10" },
  { id: 5, type: "expense", description: "Employee Salaries", amount: 42000, date: "2024-03-01" },
]

export function FinancesSection() {
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportSent, setReportSent] = useState(false)

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0)
  const totalExpenses = revenueData.reduce((sum, d) => sum + d.expenses, 0)
  const totalProfit = revenueData.reduce((sum, d) => sum + d.profit, 0)
  const profitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1)

  const stats = [
    {
      label: "Annual Revenue",
      value: `${(totalRevenue / 1000).toFixed(1)}M KZT`,
      change: 15.2,
      icon: DollarSign,
      color: "text-emerald-400",
    },
    {
      label: "Annual Expenses",
      value: `${(totalExpenses / 1000).toFixed(1)}M KZT`,
      change: 8.5,
      icon: CreditCard,
      color: "text-orange-400",
    },
    {
      label: "Net Profit",
      value: `${(totalProfit / 1000).toFixed(1)}M KZT`,
      change: 22.3,
      icon: PiggyBank,
      color: "text-accent",
    },
    {
      label: "Profit Margin",
      value: `${profitMargin}%`,
      change: 3.1,
      icon: TrendingUp,
      color: "text-blue-400",
    },
  ]

  const handleSendReport = () => {
    setReportSent(true)
    setTimeout(() => {
      setReportDialogOpen(false)
      setReportSent(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.change > 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {stat.change > 0 ? (
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
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Revenue & Profit Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Revenue, Expenses & Profit</CardTitle>
          <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Send className="w-4 h-4 mr-2" />
                Financial Report to Akimat
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-md">
              <DialogHeader>
                <DialogTitle>Financial Report for Akimat</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 bg-secondary rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    <span className="font-medium">Annual Financial Summary</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Revenue</p>
                      <p className="font-semibold text-emerald-400">{(totalRevenue / 1000).toFixed(1)}M KZT</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Expenses</p>
                      <p className="font-semibold text-orange-400">{(totalExpenses / 1000).toFixed(1)}M KZT</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Net Profit</p>
                      <p className="font-semibold text-accent">{(totalProfit / 1000).toFixed(1)}M KZT</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Taxes Paid</p>
                      <p className="font-semibold">287M KZT</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-secondary rounded-lg space-y-2">
                  <p className="font-medium">Report Contents:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>- Monthly revenue breakdown</li>
                    <li>- Expense categories</li>
                    <li>- Tax contributions</li>
                    <li>- Employment data (342 jobs)</li>
                    <li>- Investment plans</li>
                  </ul>
                </div>
                {reportSent ? (
                  <div className="flex items-center justify-center gap-2 p-4 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                    Report sent successfully!
                  </div>
                ) : (
                  <Button 
                    onClick={handleSendReport}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Confirm & Send Report
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.7 0.15 140)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.7 0.15 140)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.7 0.15 30)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.7 0.15 30)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
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
                  formatter={(value) => [`${String(value ?? "")}M KZT`]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="oklch(0.7 0.15 140)"
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="oklch(0.7 0.15 30)"
                  fill="url(#expenseGradient)"
                  strokeWidth={2}
                  name="Expenses"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="oklch(0.75 0.15 195)"
                  fill="url(#profitGradient)"
                  strokeWidth={2}
                  name="Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Expense Breakdown & Quarterly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="h-[200px] w-full md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {expenseBreakdown.map((entry, index) => (
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
                      formatter={(value) => [`${String(value ?? "")}%`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 space-y-3">
                {expenseBreakdown.map((item) => {
                  const icons: Record<string, typeof Building> = {
                    "Raw Materials": Package,
                    "Labor": Users,
                    "Energy": Zap,
                    "Maintenance": Building,
                    "Other": Receipt,
                  }
                  const Icon = icons[item.name] || Receipt
                  return (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">{item.amount}M</span>
                        <span className="text-xs text-muted-foreground ml-1">({item.value}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quarterly Comparison */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Quarterly YoY Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quarterlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.005 260)" />
                  <XAxis dataKey="quarter" stroke="oklch(0.5 0 0)" fontSize={12} />
                  <YAxis stroke="oklch(0.5 0 0)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.18 0.005 260)",
                      border: "1px solid oklch(0.28 0.005 260)",
                      borderRadius: "8px",
                      color: "oklch(0.98 0 0)",
                    }}
                    formatter={(value) => [`${String(value ?? "")}M KZT`]}
                  />
                  <Legend />
                  <Bar dataKey="previous" fill="oklch(0.4 0.1 195)" name="2023" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="current" fill="oklch(0.75 0.15 195)" name="2024" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    tx.type === "income" ? "bg-emerald-500/20" : "bg-red-500/20"
                  }`}>
                    {tx.type === "income" ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <div className={`font-semibold ${
                  tx.type === "income" ? "text-emerald-400" : "text-red-400"
                }`}>
                  {tx.type === "income" ? "+" : "-"}{tx.amount.toLocaleString()} KZT
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


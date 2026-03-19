"use client"

import { useState } from "react"
import { 
  User, Building2, LogOut, Bell, Settings,
  Factory, TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { IndustrialistNav } from "@/components/industrialist/industrialist-nav"
import { EmissionsSection } from "@/components/industrialist/emissions-section"
import { ProductionSection } from "@/components/industrialist/production-section"
import { FinancesSection } from "@/components/industrialist/finances-section"
import { useNavigate } from "react-router-dom"

export default function IndustrialistDashboard() {
  const [activeTab, setActiveTab] = useState("emissions")
  const navigate = useNavigate()

  const companyInfo = {
    name: "Alatau Steel Works",
    avatar: "",
    notifications: 3,
  }

  const handleLogout = () => {
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left - Profile */}
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-accent">
                      <AvatarImage src={companyInfo.avatar} alt={companyInfo.name} />
                      <AvatarFallback className="bg-secondary text-foreground">
                        <Factory className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-card border-border" align="start">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{companyInfo.name}</p>
                      <p className="text-xs text-muted-foreground">Industrial Enterprise</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Company Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem className="cursor-pointer text-red-400" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-foreground">{companyInfo.name}</h1>
                <p className="text-xs text-muted-foreground">Industrial Dashboard</p>
              </div>
            </div>

            {/* Center - Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Building2 className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="font-bold text-lg">Alatau</span>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {companyInfo.notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-accent text-accent-foreground text-xs">
                    {companyInfo.notifications}
                  </Badge>
                )}
              </Button>
              
              <div className="hidden sm:flex items-center gap-2 ml-2 px-3 py-1.5 bg-emerald-500/20 rounded-lg">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">+15.2% YTD</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Navigation */}
        <IndustrialistNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content based on active tab */}
        {activeTab === "emissions" && <EmissionsSection />}
        {activeTab === "production" && <ProductionSection />}
        {activeTab === "finances" && <FinancesSection />}
      </main>
    </div>
  )
}


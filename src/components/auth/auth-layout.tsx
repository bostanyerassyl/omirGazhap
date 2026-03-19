import type { ElementType, ReactNode } from 'react'
import { Building2, Shield, Wifi, Zap } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 relative bg-secondary/30 flex-col justify-between p-12">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
              <Building2 className="h-6 w-6 text-accent-foreground" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">Alatau</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight text-balance">
            Welcome to the
            <br />
            <span className="text-accent">Smart City</span> of Tomorrow
          </h1>
          <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
            Connect, manage, and experience urban living reimagined through
            intelligent technology.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-8">
            <FeatureItem icon={Wifi} label="Connected Services" />
            <FeatureItem icon={Shield} label="Secure Access" />
            <FeatureItem icon={Zap} label="Smart Utilities" />
            <FeatureItem icon={Building2} label="City Services" />
          </div>
        </div>

        <div className="relative z-10 text-sm text-muted-foreground">
          Copyright 2026 Alatau Smart City
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12">
        <div className="lg:hidden mb-12">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
              <Building2 className="h-6 w-6 text-accent-foreground" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">Alatau</span>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          </div>

          {children}
        </div>

        <div className="lg:hidden mt-12 text-xs text-muted-foreground">
          Copyright 2026 Alatau Smart City
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ icon: Icon, label }: { icon: ElementType; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center">
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}

import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type StatusTone = 'error' | 'success' | 'info'

const toneClasses: Record<StatusTone, string> = {
  error: 'border-red-500/30 bg-red-500/10 text-red-300',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
}

type StatusMessageProps = {
  tone: StatusTone
  children: ReactNode
  className?: string
}

export function StatusMessage({
  tone,
  children,
  className,
}: StatusMessageProps) {
  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3 text-sm',
        toneClasses[tone],
        className,
      )}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  )
}

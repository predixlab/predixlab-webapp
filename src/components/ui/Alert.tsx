import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import React from 'react'

import { cn } from '@/utils'

type AlertTone = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  tone?: AlertTone
  title?: React.ReactNode
  children?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

const toneClasses: Record<AlertTone, string> = {
  info: 'border-info-line bg-info-soft text-info',
  success: 'border-bull-line bg-bull-soft text-bull',
  warning: 'border-warn-line bg-warn-soft text-warn',
  error: 'border-bear-line bg-bear-soft text-bear',
}

const toneIcons: Record<AlertTone, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
}

/** Inline status message. Used instead of a modal for anything recoverable. */
const Alert: React.FC<AlertProps> = ({ tone = 'info', title, children, action, className }) => {
  const Icon = toneIcons[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex flex-wrap items-start gap-3 rounded-lg border px-4 py-3.5 text-sm',
        toneClasses[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={cn('text-sm', title && 'mt-0.5 opacity-90')}>{children}</div> : null}
      </div>
      {action ? <div className="ml-7 shrink-0 sm:ml-0">{action}</div> : null}
    </div>
  )
}

export default Alert

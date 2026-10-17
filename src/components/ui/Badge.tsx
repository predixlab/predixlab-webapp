import React from 'react'

import { cn } from '@/utils'

export type BadgeTone = 'neutral' | 'accent' | 'bull' | 'bear' | 'warn' | 'info' | 'muted'
export type BadgeSize = 'sm' | 'md'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  size?: BadgeSize
  dot?: boolean
  /** Square-ish chip instead of a pill — used for tickers and codes. */
  square?: boolean
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'border-border bg-surface-raised text-text-secondary',
  accent: 'border-accent-line bg-accent-soft text-accent-400',
  bull: 'border-bull-line bg-bull-soft text-bull',
  bear: 'border-bear-line bg-bear-soft text-bear',
  warn: 'border-warn-line bg-warn-soft text-warn',
  info: 'border-info-line bg-info-soft text-info',
  muted: 'border-border bg-transparent text-text-muted',
}

const dotClasses: Record<BadgeTone, string> = {
  neutral: 'bg-text-secondary',
  accent: 'bg-accent-500',
  bull: 'bg-bull-vivid',
  bear: 'bg-bear-vivid',
  warn: 'bg-warn-vivid',
  info: 'bg-info-vivid',
  muted: 'bg-text-muted',
}

const Badge: React.FC<BadgeProps> = ({
  tone = 'neutral',
  size = 'md',
  dot = false,
  square = false,
  className,
  children,
  ...rest
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 border font-medium whitespace-nowrap',
      square ? 'rounded-sm' : 'rounded-full',
      size === 'sm' ? 'px-1.5 py-0.5 text-2xs leading-4' : 'px-2 py-0.5 text-xs leading-5',
      toneClasses[tone],
      className,
    )}
    {...rest}
  >
    {dot ? <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[tone])} aria-hidden /> : null}
    {children}
  </span>
)

export default Badge

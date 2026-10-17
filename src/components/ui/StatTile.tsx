import { ArrowDown, ArrowUp } from 'lucide-react'
import React from 'react'

import { cn } from '@/utils'

interface StatTileProps {
  label: React.ReactNode
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: React.ReactNode
  /** Signed number used to colour and orient an optional delta chip. */
  delta?: number | null
  deltaLabel?: React.ReactNode
  tone?: 'default' | 'bull' | 'bear' | 'accent' | 'warn'
  /** Draws its own border. Omit when the tile sits inside a StatStrip. */
  standalone?: boolean
  className?: string
}

const valueToneClasses: Record<NonNullable<StatTileProps['tone']>, string> = {
  default: 'text-text-primary',
  bull: 'text-bull',
  bear: 'text-bear',
  accent: 'text-accent-400',
  warn: 'text-warn',
}

/**
 * A single readout. Label above, figure below, optional signed delta. Kept
 * deliberately plain: in a market app the number is the design.
 */
export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  hint,
  icon,
  delta,
  deltaLabel,
  tone = 'default',
  standalone = false,
  className,
}) => {
  const hasDelta = delta !== undefined && delta !== null
  const up = (delta ?? 0) >= 0

  return (
    <div
      className={cn(
        'min-w-0 px-4 py-5 sm:px-5',
        standalone && 'rounded-lg border border-border bg-surface shadow-sm',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        {icon ? <span className="shrink-0 text-text-muted">{icon}</span> : null}
        <p className="text-xs font-medium leading-5 text-text-secondary">{label}</p>
      </div>
      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
        <p className={cn('num max-w-full text-2xl leading-tight font-semibold tracking-[-0.04em] [overflow-wrap:anywhere] sm:text-3xl', valueToneClasses[tone])}>
          {value}
        </p>
        {hasDelta ? (
          <span
            className={cn(
              'num inline-flex items-center gap-0.5 rounded-sm px-1 py-0.5 text-2xs font-medium',
              up ? 'bg-bull-soft text-bull' : 'bg-bear-soft text-bear',
            )}
          >
            {up ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
            {deltaLabel}
          </span>
        ) : null}
      </div>
      {hint ? <p className="mt-2 text-xs leading-5 text-text-muted">{hint}</p> : null}
    </div>
  )
}

/**
 * Groups readouts into one bordered strip separated by hairlines, the way a
 * terminal shows a summary row. Avoids a row of near-identical cards.
 */
export const StatStrip: React.FC<{
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}> = ({ children, columns = 4, className }) => (
  <div
    data-columns={columns}
    className={cn(
      'pl-stat-strip grid overflow-hidden rounded-lg border border-border bg-surface shadow-sm',
      columns === 2 && 'grid-cols-2',
      columns === 3 && 'grid-cols-2 sm:grid-cols-3',
      columns === 4 && 'grid-cols-2 lg:grid-cols-4',
      className,
    )}
  >
    {children}
  </div>
)

export default StatTile

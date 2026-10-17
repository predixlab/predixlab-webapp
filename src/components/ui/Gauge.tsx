import React from 'react'

import { cn } from '@/utils'

interface GaugeProps {
  /** Current value (e.g. reward:risk ratio). */
  value: number
  /** Value that maps to a full sweep. Values above are clamped. */
  max?: number
  label?: React.ReactNode
  valueLabel?: React.ReactNode
  size?: number
  tone?: 'bull' | 'bear' | 'accent' | 'warn'
  className?: string
}

const toneVar: Record<NonNullable<GaugeProps['tone']>, string> = {
  bull: 'var(--pl-bull-vivid)',
  bear: 'var(--pl-bear-vivid)',
  accent: 'var(--pl-accent-500)',
  warn: 'var(--pl-warn-vivid)',
}

/** Semicircular arc gauge drawn with SVG — no charting dependency. */
const Gauge: React.FC<GaugeProps> = ({
  value,
  max = 4,
  label,
  valueLabel,
  size = 132,
  tone = 'accent',
  className,
}) => {
  const stroke = 8
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = Math.PI * r
  const ratio = Math.max(0, Math.min(1, (Number.isFinite(value) ? value : 0) / max))

  const describeArc = (start: number, end: number): string => {
    const p = (angle: number) => [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
    const [x1, y1] = p(start)
    const [x2, y2] = p(end)
    const largeArc = end - start > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  const track = describeArc(Math.PI, 2 * Math.PI)

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg width={size} height={size / 2 + stroke} viewBox={`0 0 ${size} ${size / 2 + stroke}`}>
        <path d={track} fill="none" stroke="var(--pl-border)" strokeWidth={stroke} strokeLinecap="round" />
        <path
          d={track}
          fill="none"
          stroke={toneVar[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          style={{ transition: 'stroke-dashoffset 320ms var(--ease-out-quart)' }}
        />
      </svg>
      <div className="-mt-6 text-center">
        <div className="num text-xl font-semibold text-text-primary">{valueLabel}</div>
        {label ? <div className="mt-0.5 text-xs text-text-muted">{label}</div> : null}
      </div>
    </div>
  )
}

export default Gauge

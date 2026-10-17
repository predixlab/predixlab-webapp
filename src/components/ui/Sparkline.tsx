import React from 'react'

import { cn } from '@/utils'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  /** Explicit stroke colour; defaults to bull/bear based on net direction. */
  color?: string
  strokeWidth?: number
  fill?: boolean
  className?: string
  ariaLabel?: string
}

const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 112,
  height = 28,
  color,
  strokeWidth = 1.25,
  fill = true,
  className,
  ariaLabel,
}) => {
  const clean = data.filter(v => Number.isFinite(v))
  if (clean.length < 2) {
    return <div className={cn('inline-block', className)} style={{ width, height }} aria-hidden />
  }

  const min = Math.min(...clean)
  const max = Math.max(...clean)
  const span = max - min || 1
  const pad = strokeWidth
  const usableH = height - pad * 2
  const stepX = width / (clean.length - 1)

  const points = clean.map((v, i) => {
    const x = i * stepX
    const y = pad + usableH - ((v - min) / span) * usableH
    return [x, y] as const
  })

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  const stroke =
    color ?? (clean[clean.length - 1] >= clean[0] ? 'var(--pl-bull-vivid)' : 'var(--pl-bear-vivid)')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
    >
      {fill ? (
        <path d={area} fill={stroke} fillOpacity={0.08} />
      ) : null}
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default Sparkline

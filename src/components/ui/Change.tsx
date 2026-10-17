import React from 'react'

import { changeTone, cn } from '@/utils'

interface ChangeProps {
  /** Raw value; sign decides the colour. */
  value?: number | null
  /** Text to render. Defaults to a signed percentage of `value`. */
  children?: React.ReactNode
  digits?: number
  /** Treat `value` as a ratio (0.0132 -> +1.32%) rather than a plain number. */
  asPercent?: boolean
  showSign?: boolean
  className?: string
}

/**
 * A signed market value. Colour carries the sign, and the sign is also
 * written out, so the reading never depends on colour alone.
 */
const Change: React.FC<ChangeProps> = ({
  value,
  children,
  digits = 2,
  asPercent = true,
  showSign = true,
  className,
}) => {
  const missing = value === null || value === undefined || Number.isNaN(value)
  const scaled = missing ? 0 : asPercent ? value * 100 : value
  const sign = showSign && scaled > 0 ? '+' : ''
  const text =
    children ?? (missing ? '—' : `${sign}${scaled.toFixed(digits)}${asPercent ? '%' : ''}`)

  return <span className={cn('num font-medium', changeTone(value), className)}>{text}</span>
}

export default Change

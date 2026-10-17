import React from 'react'
import { useTranslation } from 'react-i18next'

import { useTickerChart } from '@/contexts/TickerChartContext'
import { cn } from '@/utils'

interface TickerLinkProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  symbol: string
}

/**
 * A ticker rendered as text that opens the shared price-history and signals
 * drawer. Keeps the surrounding typography; only adds hover/focus affordance.
 */
const TickerLink: React.FC<TickerLinkProps> = ({ symbol, className, children, ...rest }) => {
  const { t } = useTranslation()
  const { openTicker } = useTickerChart()

  if (!symbol) return <>{children}</>

  return (
    <button
      type="button"
      {...rest}
      onClick={event => {
        event.stopPropagation()
        openTicker(symbol)
      }}
      aria-label={rest['aria-label'] ?? t('tickerChart.open', { symbol })}
      title={rest.title ?? t('tickerChart.open', { symbol })}
      className={cn(
        'inline cursor-pointer rounded-sm text-left underline-offset-4 decoration-accent-500/60 transition-colors hover:text-accent-400 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500',
        className,
      )}
    >
      {children ?? symbol}
    </button>
  )
}

export default TickerLink

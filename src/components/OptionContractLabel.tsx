import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import TickerLink from '@/components/TickerLink'
import { Badge } from '@/components/ui'
import type { OptionType } from '@/types'
import { cn } from '@/utils'

type OptionContractLabelProps = {
  symbol: string
  expiration?: string | null
  strike: number
  optionType: OptionType
  extra?: ReactNode
  className?: string
}

const OptionContractLabel = ({
  symbol,
  expiration,
  strike,
  optionType,
  extra,
  className,
}: OptionContractLabelProps) => {
  const { t } = useTranslation()
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <TickerLink symbol={symbol} className="font-semibold text-text-primary" />
      <span className="num text-text-secondary">
        {expiration ? expiration.split('-').join('') : '—'}
      </span>
      <span className="num text-text-secondary">{strike}</span>
      <Badge tone={optionType === 'calls' ? 'bull' : 'bear'} size="sm" square>
        {optionType === 'calls' ? t('options.call') : t('options.put')}
      </Badge>
      {extra}
    </div>
  )
}

export default OptionContractLabel

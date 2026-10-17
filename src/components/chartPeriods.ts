import type { TFunction } from 'i18next'

/** The ranges the price chart can load. */
export type ChartPeriod = '3M' | '6M' | '1Y'

/**
 * Range options shared by the chart and by hosts that render the switch
 * themselves, so the two never drift apart.
 */
export const chartPeriodItems = (t: TFunction): { value: ChartPeriod; label: string }[] => [
  { value: '3M', label: t('dashboard.3months') },
  { value: '6M', label: t('dashboard.6months') },
  { value: '1Y', label: t('dashboard.1year') },
]

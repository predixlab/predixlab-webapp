import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button, EmptyState, Field, Panel, Skeleton } from '@/components/ui'
import { cn } from '@/utils'

interface OptionsHighlightsProps<T extends string> {
  items: { symbol: string; label: string }[]
  selectedSymbol: string
  onSelect: (symbol: string) => void
  filterValue: T
  filterOptions: { value: T; label: string }[]
  filterDescription: string
  onFilterChange: (value: T) => void
  loading: boolean
  error: boolean
  emptyTitle: string
}

export default function OptionsHighlights<T extends string>({
  items,
  selectedSymbol,
  onSelect,
  filterValue,
  filterOptions,
  filterDescription,
  onFilterChange,
  loading,
  error,
  emptyTitle,
}: OptionsHighlightsProps<T>) {
  const { t } = useTranslation()
  const railClassName = 'scroll-rail grid auto-cols-[minmax(8.75rem,1fr)] grid-flow-col gap-2.5 snap-x snap-proximity xl:auto-cols-auto xl:grid-flow-row xl:grid-cols-6'

  return (
    <Panel
      title={t('options.highlights')}
      aria-label={t('options.highlights')}
      className="[&>header]:min-h-14 [&>header]:flex-row [&>header]:items-center [&>header]:gap-2 [&>header]:border-0 [&>header]:px-3 [&>header]:py-3 sm:[&>header]:px-4"
      bodyClassName="px-3 pt-0 pb-3 sm:px-4 sm:pt-0 sm:pb-4"
      actions={
        <Field label={filterDescription} hideLabel className="w-40 sm:w-52">
          {props => (
            <select
              {...props}
              value={filterValue}
              className="input h-9 text-xs"
              onChange={event => {
                const option = filterOptions.find(item => item.value === event.target.value)
                if (option) onFilterChange(option.value)
              }}
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          )}
        </Field>
      }
    >
      {loading ? (
        <div className={railClassName} role="status" aria-label={t('common.loading')}>
          {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} height={76} />)}
        </div>
      ) : error ? (
        <EmptyState size="sm" tone="error" className="py-3" title={t('errors.loadFailed')} />
      ) : items.length ? (
        <div className={railClassName}>
          {items.map(item => (
            <Button
              key={item.symbol}
              type="button"
              variant="secondary"
              className={cn(
                'min-h-18 min-w-0 snap-start flex-col items-stretch justify-start gap-1.5 whitespace-normal px-3 py-3 text-left',
                selectedSymbol === item.symbol && 'border-accent-500 bg-accent-soft text-accent-400',
              )}
              aria-pressed={selectedSymbol === item.symbol}
              onClick={() => onSelect(item.symbol)}
            >
              <span className="flex items-center justify-between gap-2 text-base">
                {item.symbol}
                {selectedSymbol === item.symbol ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
              </span>
              <span className="text-xs font-medium leading-5 text-text-secondary">{item.label}</span>
            </Button>
          ))}
        </div>
      ) : (
        <EmptyState size="sm" className="py-3" title={emptyTitle} />
      )}
    </Panel>
  )
}

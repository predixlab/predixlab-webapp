import { Activity, CalendarDays } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import OptionContractLabel from '@/components/OptionContractLabel'
import OptionsViewTabs from '@/components/OptionsViewTabs'
import TickerLink from '@/components/TickerLink'
import {
  Badge,
  Button,
  DataTable,
  DatePickerModal,
  EmptyState,
  Page,
  PageHeader,
  Panel,
  Skeleton,
  Tabs,
} from '@/components/ui'
import type { Column } from '@/components/ui'
import api from '@/services/apiAdapter'
import { AnomalyContract, AnomalyOption } from '@/types'
import { changeTone, cn, formatDay } from '@/utils'

const DISPLAY_LIMIT = 20

/** Notional behind an open-interest change, in dollars. Contracts are 100x. */
const notional = (oiChange?: number | null, lastPrice?: number | null): string => {
  if (!oiChange || !lastPrice) return ''
  const value = oiChange * lastPrice * 100
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`
  return `${sign}$${abs.toFixed(0)}`
}

const signed = (value?: number | null): string =>
  value === null || value === undefined
    ? '—'
    : `${value > 0 ? '+' : ''}${value.toLocaleString()}`

const UnusualOptionsPage: React.FC = () => {
  const { t } = useTranslation()
  const [items, setItems] = useState<AnomalyOption[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [latestDate, setLatestDate] = useState('')
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [typeFilter, setTypeFilter] = useState<'all' | 'calls' | 'puts'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const requestIdRef = useRef(0)

  const loadDate = useCallback(async (
    date: string,
    markSelected = true,
  ) => {
    if (!date) return
    const requestId = ++requestIdRef.current
    if (markSelected) setSelectedDate(date)
    setLoading(true)
    setError(null)
    try {
      const datedItems = await api.getOptionAnomaliesByDate(date)
      if (requestId !== requestIdRef.current) return
      setItems(datedItems)
    } catch {
      if (requestId !== requestIdRef.current) return
      setItems([])
      setError(t('errors.loadFailed'))
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [t])

  useEffect(() => {
    let cancelled = false
    const loadLatest = async () => {
      setLoading(true)
      setError(null)
      const requestId = ++requestIdRef.current
      try {
        const dateResponse = await api.getOptionAnomalyDates(60)
        const latestDate = dateResponse.dates[0]
        if (!latestDate) {
          if (!cancelled) {
            setAvailableDates([])
            setItems([])
          }
          return
        }
        const datedItems = await api.getOptionAnomaliesByDate(latestDate)
        if (cancelled || requestId !== requestIdRef.current) return
        setAvailableDates(dateResponse.dates)
        setLatestDate(latestDate)
        setItems(datedItems)
      } catch {
        if (!cancelled && requestId === requestIdRef.current) {
          setItems([])
          setError(t('errors.loadFailed'))
        }
      } finally {
        if (!cancelled && requestId === requestIdRef.current) setLoading(false)
      }
    }
    loadLatest()
    return () => {
      cancelled = true
    }
  }, [t])

  const availableDateSet = useMemo(
    () => new Set(availableDates),
    [availableDates],
  )

  const handleClearDate = () => {
    if (!latestDate) return
    setSelectedDate(null)
    void loadDate(latestDate, false)
  }

  const displayDate = selectedDate ?? latestDate

  const visibleItems = useMemo(
    () =>
      items
        .map(group => ({
          ...group,
          items:
            typeFilter === 'all'
              ? group.items
              : group.items.filter(item => item.option_type === typeFilter),
        }))
        .filter(group => group.items.length > 0)
        .sort((a, b) => (b.anomaly_score ?? 0) - (a.anomaly_score ?? 0))
        .slice(0, DISPLAY_LIMIT),
    [items, typeFilter],
  )

  const contractColumns: Column<AnomalyContract>[] = useMemo(
    () => [
      {
        key: 'contract',
        header: t('options.contracts'),
        sortable: true,
        sortAccessor: item => item.contract,
        render: item => (
          <div className="min-w-0">
            <OptionContractLabel
              symbol={item.symbol}
              expiration={item.expiration}
              strike={item.strike}
              optionType={item.option_type}
            />
          </div>
        ),
      },
      {
        key: 'position',
        header: t('picks.side'),
        sortable: true,
        cellClassName: 'whitespace-normal',
        sortAccessor: item => item.position_type ?? 'Natural',
        render: item => (
          <Badge tone="muted" size="sm">
            {t(`options.positionTypes.${item.position_type ?? 'Natural'}`)}
          </Badge>
        ),
      },
      {
        key: 'openInterest',
        header: t('options.openInterest'),
        align: 'right',
        sortable: true,
        sortAccessor: item => item.open_interest_today,
        render: item => (
          <div className="text-right">
            <div className="num font-medium text-text-primary">
              {item.open_interest_today?.toLocaleString() ?? '—'}
            </div>
            <div
              className={cn(
                'num mt-1 text-xs',
                changeTone(item.oi_change),
              )}
            >
              {signed(item.oi_change)}
              {notional(item.oi_change, item.last_price)
                ? ` · ${notional(item.oi_change, item.last_price)}`
                : ''}
            </div>
          </div>
        ),
      },
    ],
    [t],
  )

  return (
    <Page>
      <div className="space-y-4 sm:space-y-5">
        <PageHeader
          title={t('nav.unusualOptions')}
          date={formatDay(displayDate, '') || undefined}
          subtitle={t('options.description')}
        />
        <OptionsViewTabs value="activity" />
      </div>

      <Panel
        flush
        variant="strong"
        title={t('options.flowTitle')}
        subtitle={t('options.loadedFilterNote')}
        icon={<Activity className="h-4 w-4" />}
        actions={!loading && !error && items.length ? (
          <span className="num text-xs text-text-secondary">
            {t('options.topCount', { shown: visibleItems.length, total: items.length })}
          </span>
        ) : null}
        toolbar={
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="min-w-0">
              <p className="mb-2 text-xs font-medium text-text-secondary">
                {t('options.filterDate')}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="num flex-1 justify-start sm:flex-none"
                  onClick={() => setShowDatePicker(true)}
                  leftIcon={<CalendarDays className="h-4 w-4" />}
                  aria-label={`${t('stocks.selectDate')}: ${formatDay(displayDate)}`}
                >
                  {formatDay(displayDate, t('stocks.selectDate'))}
                </Button>
                {selectedDate ? (
                  <Button type="button" variant="ghost" onClick={handleClearDate}>
                    {t('common.clear')}
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="min-w-0">
              <p className="mb-2 text-xs font-medium text-text-secondary">
                {t('options.filterType')}
              </p>
              <Tabs
                fullWidth
                value={typeFilter}
                onChange={setTypeFilter}
                aria-label={t('options.filterType')}
                items={[
                  { value: 'all', label: t('common.all') },
                  { value: 'calls', label: t('options.calls') },
                  { value: 'puts', label: t('options.puts') },
                ]}
              />
            </div>
          </div>
        }
      >
        {loading ? (
          <div className="space-y-4 p-4 sm:p-5" role="status" aria-label={t('common.loading')}>
            <Skeleton height={164} />
            <Skeleton height={164} />
            <Skeleton height={164} />
          </div>
        ) : error ? (
          <EmptyState
            tone="error"
            icon={<Activity className="h-4 w-4" />}
            title={error}
            description={t('options.dateLoadError')}
            action={displayDate ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => void loadDate(displayDate, selectedDate !== null)}
              >
                {t('common.retry')}
              </Button>
            ) : undefined}
          />
        ) : visibleItems.length > 0 ? (
          visibleItems.map(group => (
            <section
              key={`${displayDate}-${group.symbol}`}
              className="grid min-w-0 border-b border-border last:border-b-0 md:grid-cols-[9rem_minmax(0,1fr)] xl:grid-cols-[11rem_minmax(0,1fr)]"
              aria-label={group.symbol}
            >
              <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-raised/60 px-4 py-4 sm:px-5 md:flex-col md:items-start md:justify-start md:border-r md:border-b-0 md:py-5">
                <h3 className="text-lg font-bold tracking-tight text-text-primary">
                  <TickerLink symbol={group.symbol} />
                </h3>
                <Badge tone="muted" size="sm">
                  <span className="num">{t('options.count', { count: group.items.length })}</span>
                </Badge>
              </div>

              <div className="min-w-0">
                <DataTable
                  columns={contractColumns}
                  data={group.items}
                  rowKey={(item, index) => `${item.contract}-${group.symbol}-${index}`}
                  renderMobileRow={item => (
                    <div className="space-y-3">
                      <OptionContractLabel
                        symbol={item.symbol}
                        expiration={item.expiration}
                        strike={item.strike}
                        optionType={item.option_type}
                        className="text-sm"
                      />
                      <Badge tone="muted" size="sm">
                        {t(`options.positionTypes.${item.position_type ?? 'Natural'}`)}
                      </Badge>
                      <dl className="grid grid-cols-2 gap-4 border-t border-border pt-3">
                        <div className="min-w-0">
                          <dt className="text-xs text-text-muted">{t('options.openInterest')}</dt>
                          <dd className="num mt-1 text-base font-semibold text-text-primary">
                            {item.open_interest_today?.toLocaleString() ?? '—'}
                          </dd>
                        </div>
                        <div className="min-w-0 text-right">
                          <dt className="text-xs text-text-muted">{t('gex.oiChange')}</dt>
                          <dd className={cn('num mt-1 text-base font-semibold', changeTone(item.oi_change))}>
                            {signed(item.oi_change)}
                          </dd>
                          {notional(item.oi_change, item.last_price) ? (
                            <dd className="num mt-0.5 text-xs text-text-secondary">
                              {notional(item.oi_change, item.last_price)}
                            </dd>
                          ) : null}
                        </div>
                      </dl>
                    </div>
                  )}
                />
              </div>
            </section>
          ))
        ) : (
          <EmptyState
            icon={<Activity className="h-4 w-4" />}
            title={items.length ? t('options.noFilterMatches') : t('options.noActivity')}
            description={
              items.length ? t('options.adjustLoadedFilters') : t('options.noActivityHint')
            }
          />
        )}
      </Panel>

      <DatePickerModal
        open={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={selectedDate}
        initialDate={latestDate}
        onSelect={loadDate}
        onClear={handleClearDate}
        isDateEnabled={date => availableDateSet.has(date)}
        hint={t('options.dateHint')}
      />
    </Page>
  )
}

export default UnusualOptionsPage

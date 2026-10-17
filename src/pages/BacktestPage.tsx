import type { TFunction } from 'i18next'
import { ArrowDown, ArrowUp, BarChart3, Info, LineChart, Search } from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

import CandlestickChart from '@/components/CandlestickChart'
import { chartPeriodItems, type ChartPeriod } from '@/components/chartPeriods'
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  Field,
  Page,
  PageHeader,
  Panel,
  Skeleton,
  StatStrip,
  StatTile,
  Tabs,
} from '@/components/ui'
import type { Column } from '@/components/ui'
import { api } from '@/services/apiAdapter'
import type { AlphaRankItem, PivotPick, SignalData, StockData } from '@/types'
import { cn, formatDay } from '@/utils'

const MARKET = 'us'
const CACHE_TTL_MS = 5 * 60 * 1000

type SignalModel = 'pivot' | 'alpharank'
type SignalHistoryItem = PivotPick | AlphaRankItem
type HistoryCacheEntry = { data: SignalHistoryItem[]; ts: number }

const isAlphaRankItem = (item: SignalHistoryItem): item is AlphaRankItem =>
  'signal_model' in item && item.signal_model === 'alpha_rank'

const pct = (value: number | null | undefined, digits = 2): string =>
  value == null ? '—' : `${value >= 0 ? '+' : ''}${(value * 100).toFixed(digits)}%`

const share = (value: number | null | undefined): string =>
  value == null ? '—' : `${(value * 100).toFixed(1)}%`

const alphaScore = (value: number): string => (value * 100).toFixed(1)

const signalPrice = (item: SignalHistoryItem): number | null =>
  isAlphaRankItem(item) ? item.close : item.price ?? item.close

const SignalLabel: React.FC<{ item: SignalHistoryItem; t: TFunction }> = ({ item, t }) =>
  isAlphaRankItem(item) ? (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="num font-semibold text-accent-400">#{item.rank}</span>
      <span className="num text-xs text-text-secondary">
        {t('performance.alphaScore', { score: alphaScore(item.score) })}
      </span>
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge tone={item.direction === 'short' ? 'bear' : 'bull'} size="sm" square>
        {t(`picks.events.${item.event}`)}
      </Badge>
      {item.kind === 'trend' ? (
        <Badge tone="muted" size="sm" square>{t('picks.kinds.trend')}</Badge>
      ) : null}
    </div>
  )

const PathValue: React.FC<{
  value: number | null | undefined
  day: number | null | undefined
  tone: 'bull' | 'bear'
  t: TFunction
}> = ({ value, day, tone, t }) =>
  value == null ? (
    <span className="num text-text-muted">—</span>
  ) : (
    <span className={cn('num inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5', tone === 'bull' ? 'text-bull' : 'text-bear')}>
      <span className="font-semibold">{pct(value)}</span>
      {day != null ? (
        <span className="text-xs font-normal text-text-muted">{t('performance.dayN', { day })}</span>
      ) : null}
    </span>
  )

const BacktestPage: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedTicker = (
    searchParams.get('ticker') ??
    searchParams.get('symbol') ??
    ''
  ).toUpperCase()
  const selectedModel: SignalModel =
    searchParams.get('model') === 'alpharank' ? 'alpharank' : 'pivot'

  const [searchQuery, setSearchQuery] = useState(selectedTicker)
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1)
  const [history, setHistory] = useState<SignalHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState(false)
  const [stockData, setStockData] = useState<StockData[]>([])
  const [chartLoading, setChartLoading] = useState(false)
  const [chartError, setChartError] = useState(false)
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('1Y')

  const searchRef = useRef<HTMLDivElement>(null)
  const searchListRef = useRef<HTMLUListElement>(null)
  const searchListId = React.useId()
  const historyCacheRef = useRef<Map<string, HistoryCacheEntry>>(new Map())

  useEffect(() => setSearchQuery(selectedTicker), [selectedTicker])

  useEffect(() => {
    let cancelled = false
    setActiveSearchIndex(-1)
    setSearchError(false)
    setSearchResults([])
    if (searchQuery.trim().length < 1) {
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    const timer = setTimeout(async () => {
      try {
        const response = await api.searchStocks(searchQuery, 'infix', 10)
        if (!cancelled) setSearchResults(response.symbols ?? [])
      } catch {
        if (!cancelled) setSearchError(true)
      } finally {
        if (!cancelled) setSearchLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [searchQuery])

  useEffect(() => {
    const list = searchListRef.current
    const option = list?.querySelectorAll<HTMLButtonElement>('[role="option"]')[activeSearchIndex]
    if (!list || !option) return
    if (option.offsetTop < list.scrollTop) {
      list.scrollTop = option.offsetTop
    } else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight
    }
  }, [activeSearchIndex])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  useEffect(() => {
    if (!selectedTicker) {
      setHistory([])
      return
    }
    let cancelled = false
    const cacheKey = `${selectedModel}:${selectedTicker}`
    const cached = historyCacheRef.current.get(cacheKey)
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      setHistory(cached.data)
      setHistoryError(false)
      setHistoryLoading(false)
      return
    }

    const load = async () => {
      setHistoryLoading(true)
      setHistoryError(false)
      setHistory([])
      try {
        const response =
          selectedModel === 'pivot'
            ? await api.getPivotSymbolHistory(selectedTicker, MARKET, 250)
            : await api.getAlphaRankTickerHistory(selectedTicker, MARKET, 250)
        if (cancelled) return
        historyCacheRef.current.set(cacheKey, { data: response.items, ts: Date.now() })
        setHistory(response.items)
      } catch {
        if (!cancelled) {
          setHistory([])
          setHistoryError(true)
        }
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [selectedModel, selectedTicker])

  useEffect(() => {
    if (!selectedTicker) {
      setStockData([])
      return
    }
    let cancelled = false
    const load = async () => {
      setChartLoading(true)
      setChartError(false)
      try {
        const response = await api.getStockData(
          selectedTicker,
          undefined,
          undefined,
          chartPeriod.toLowerCase(),
        )
        if (!cancelled) setStockData(response.data ?? [])
      } catch {
        if (!cancelled) {
          setStockData([])
          setChartError(true)
        }
      } finally {
        if (!cancelled) setChartLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [chartPeriod, selectedTicker])

  const range = useMemo(() => {
    if (!stockData.length) return null
    const days = stockData.map(bar => bar.date.split('T')[0])
    return {
      from: days.reduce((min, day) => (day < min ? day : min), days[0]),
      to: days.reduce((max, day) => (day > max ? day : max), days[0]),
    }
  }, [stockData])

  const rangeHistory = useMemo(() => {
    if (!range) return []
    return history.filter(item => {
      const day = item.date.split('T')[0]
      return day >= range.from && day <= range.to
    })
  }, [history, range])

  const signals: SignalData[] = useMemo(
    () =>
      rangeHistory.map(item => ({
        date: item.date,
        signal: isAlphaRankItem(item)
          ? ('rising' as const)
          : item.direction === 'short'
            ? ('falling' as const)
            : ('rising' as const),
        model: selectedModel,
      })),
    [rangeHistory, selectedModel],
  )

  const resolved = useMemo(
    () =>
      rangeHistory.filter(
        item =>
          item.max_gain != null &&
          item.max_loss != null &&
          item.path_complete !== false,
      ),
    [rangeHistory],
  )

  const horizon = useMemo(() => history.find(item => item.horizon)?.horizon ?? 10, [history])

  const symbolStats = useMemo(() => {
    if (!resolved.length) return null
    const favourable = resolved.filter(
      item => (item.max_gain ?? 0) > Math.abs(item.max_loss ?? 0),
    ).length
    return {
      n: resolved.length,
      favourableRate: favourable / resolved.length,
      avgPeak: resolved.reduce((acc, item) => acc + (item.max_gain ?? 0), 0) / resolved.length,
      avgTrough: resolved.reduce((acc, item) => acc + (item.max_loss ?? 0), 0) / resolved.length,
    }
  }, [resolved])

  const columns: Column<SignalHistoryItem>[] = useMemo(
    () => [
      {
        key: 'date',
        header: t('performance.columns.date'),
        sortable: true,
        sortAccessor: item => item.date,
        render: item => (
          <span className="flex items-center gap-2">
            <span className="num text-text-secondary">{formatDay(item.date)}</span>
            {item.path_complete === false ? (
              <Badge tone="muted" size="sm">
                {t('performance.stillOpen')}
              </Badge>
            ) : null}
          </span>
        ),
      },
      {
        key: 'signal',
        header: t('performance.columns.signal'),
        render: item => <SignalLabel item={item} t={t} />,
      },
      {
        key: 'signal_price',
        header: t('performance.columns.signalPrice'),
        align: 'right',
        sortable: true,
        sortAccessor: item => signalPrice(item) ?? 0,
        render: item => (
          <span className="num text-text-primary">
            {signalPrice(item)?.toFixed(2) ?? '—'}
          </span>
        ),
      },
      {
        key: 'max_gain',
        header: t('performance.columns.peak'),
        align: 'right',
        sortable: true,
        sortAccessor: item => item.max_gain ?? 0,
        render: item => (
          <PathValue value={item.max_gain} day={item.days_to_max_gain} tone="bull" t={t} />
        ),
      },
      {
        key: 'max_loss',
        header: t('performance.columns.trough'),
        align: 'right',
        sortable: true,
        sortAccessor: item => item.max_loss ?? 0,
        render: item => (
          <PathValue value={item.max_loss} day={item.days_to_max_loss} tone="bear" t={t} />
        ),
      },
    ],
    [t],
  )

  const selectTicker = (ticker: string) => {
    setSearchQuery(ticker)
    setSearchResults([])
    setSearchOpen(false)
    setActiveSearchIndex(-1)
    if (window.matchMedia('(pointer: coarse)').matches) {
      searchRef.current?.querySelector('input')?.blur()
    }
    const next = new URLSearchParams(searchParams)
    next.set('ticker', ticker)
    next.set('model', selectedModel)
    next.delete('symbol')
    setSearchParams(next)
  }

  const selectModel = (model: SignalModel) => {
    const next = new URLSearchParams(searchParams)
    if (selectedTicker) next.set('ticker', selectedTicker)
    next.set('model', model)
    next.delete('symbol')
    setSearchParams(next)
  }

  const modelLabel = t(`performance.models.${selectedModel}.label`)
  const searchSuggestionsOpen = searchOpen && searchQuery.trim().length > 0 && searchQuery !== selectedTicker
  const searchOptionsVisible = searchSuggestionsOpen && !searchLoading && !searchError && searchResults.length > 0

  return (
    <Page>
      <PageHeader title={t('performance.title')} subtitle={t('performance.subtitle')} />

      <Panel flush className="overflow-visible">
        <div className="grid items-start gap-5 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div
            ref={searchRef}
            className="relative min-w-0"
          >
            <Field label={t('performance.tickerControl')} icon={<Search className="h-4 w-4" />}>
              {props => (
                <input
                  {...props}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={searchOptionsVisible}
                  aria-controls={searchListId}
                  aria-activedescendant={searchOptionsVisible && activeSearchIndex >= 0 ? `${searchListId}-${activeSearchIndex}` : undefined}
                  value={searchQuery}
                  onChange={event => {
                    setSearchQuery(event.target.value.toUpperCase())
                    setActiveSearchIndex(-1)
                    setSearchOpen(true)
                  }}
                  onFocus={() => {
                    setActiveSearchIndex(-1)
                    setSearchOpen(true)
                  }}
                  onBlur={event => {
                    if (!searchRef.current?.contains(event.relatedTarget)) setSearchOpen(false)
                  }}
                  onKeyDown={event => {
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      setSearchOpen(false)
                      setActiveSearchIndex(-1)
                    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                      event.preventDefault()
                      setSearchOpen(true)
                      if (!searchLoading && searchQuery !== selectedTicker && searchResults.length) {
                        const direction = event.key === 'ArrowDown' ? 1 : -1
                        setActiveSearchIndex(current =>
                          current < 0
                            ? direction === 1 ? 0 : searchResults.length - 1
                            : (current + direction + searchResults.length) % searchResults.length,
                        )
                      }
                    } else if (event.key === 'Enter' && searchOptionsVisible) {
                      event.preventDefault()
                      selectTicker(searchResults[Math.max(0, activeSearchIndex)])
                    }
                  }}
                  placeholder={t('performance.searchPlaceholder')}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  className="input num pl-9"
                />
              )}
            </Field>
            {searchSuggestionsOpen ? (
              <div
                className="pl-pop-in absolute inset-x-0 top-full mt-2 overflow-hidden rounded-lg border border-border bg-surface-overlay shadow-lg"
                style={{ zIndex: 'var(--z-dropdown)' }}
              >
                {searchLoading ? (
                  <p className="px-4 py-4 text-sm text-text-muted" role="status">{t('common.loading')}</p>
                ) : searchError ? (
                  <p className="px-4 py-4 text-sm text-bear" role="alert">{t('errors.loadFailed')}</p>
                ) : searchResults.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-text-secondary" role="status">
                    {t('performance.noSearchResults', 'No tickers found. Try another symbol.')}
                  </p>
                ) : null}
                <ul
                  id={searchListId}
                  ref={searchListRef}
                  role="listbox"
                  aria-label={t('performance.tickerControl')}
                  className="custom-scrollbar relative max-h-60 overflow-y-auto overscroll-contain"
                >
                  {!searchLoading && !searchError ? searchResults.map((ticker, index) => (
                    <li key={ticker} role="presentation">
                      <Button
                        id={`${searchListId}-${index}`}
                        type="button"
                        role="option"
                        variant="ghost"
                        tabIndex={-1}
                        aria-selected={index === activeSearchIndex}
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => selectTicker(ticker)}
                        fullWidth
                        className={cn(
                          'num min-h-11 justify-start rounded-none px-4 text-sm',
                          index === activeSearchIndex && 'bg-accent-soft text-accent-400',
                        )}
                      >
                        {ticker}
                      </Button>
                    </li>
                  )) : null}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="mb-1.5 text-xs font-medium text-text-secondary">{t('performance.modelControl')}</p>
            <Tabs
              value={selectedModel}
              onChange={selectModel}
              fullWidth
              aria-label={t('performance.modelControl')}
              items={[
                { value: 'pivot' as const, label: t('performance.models.pivot.label') },
                { value: 'alpharank' as const, label: t('performance.models.alpharank.label') },
              ]}
            />
          </div>
        </div>
        <p className="flex items-start gap-2 rounded-b-lg border-t border-border bg-surface-raised/60 px-4 py-3 text-xs leading-5 text-text-muted sm:px-5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {t('performance.commandHint')}
        </p>
      </Panel>

      {!selectedTicker ? (
        <Panel
          bodyClassName="py-10 sm:py-16"
          footer={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-text-secondary">{t('performance.rangeControl')}</p>
              <Tabs
                size="sm"
                items={chartPeriodItems(t)}
                value={chartPeriod}
                onChange={setChartPeriod}
                aria-label={t('backtest.period')}
              />
            </div>
          }
        >
          <EmptyState
            icon={<Search className="h-4 w-4" />}
            title={t('performance.noTicker')}
            description={t('performance.noTickerHint')}
          />
        </Panel>
      ) : (
        <>
          {historyLoading || chartLoading ? (
            <Skeleton height={154} />
          ) : symbolStats && !historyError && !chartError ? (
            <section aria-labelledby="signal-performance-summary">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 id="signal-performance-summary" className="text-sm font-semibold text-text-primary">
                  {t('performance.modelSummary', { model: modelLabel })}
                </h2>
                <Badge tone="muted">{selectedTicker}</Badge>
              </div>
              <StatStrip columns={4}>
                <StatTile label={t('performance.signals')} value={symbolStats.n} />
                <StatTile label={t('performance.favourable')} value={share(symbolStats.favourableRate)} />
                <StatTile label={t('performance.avgPeak')} value={pct(symbolStats.avgPeak)} tone="bull" />
                <StatTile label={t('performance.avgTrough')} value={pct(symbolStats.avgTrough)} tone="bear" />
              </StatStrip>
              <p className="mt-3 text-xs leading-5 text-text-muted">
                <span className="font-medium text-text-secondary">{t('performance.favourable')}: </span>
                {t(`performance.models.${selectedModel}.favourableHint`)}
              </p>
            </section>
          ) : null}

          <Panel
            title={<span className="num text-lg">{selectedTicker}</span>}
            subtitle={
              range
                ? `${modelLabel} · ${t('stocks.rangeLabel', { from: range.from, to: range.to })}`
                : modelLabel
            }
            icon={<LineChart className="h-4 w-4" />}
            aria-busy={chartLoading}
            actions={
              <div className="min-w-0 max-w-full">
                <p className="mb-2 text-xs font-medium text-text-secondary">{t('performance.rangeControl')}</p>
                <Tabs
                  size="sm"
                  items={chartPeriodItems(t)}
                  value={chartPeriod}
                  onChange={setChartPeriod}
                  aria-label={t('backtest.period')}
                />
              </div>
            }
            bodyClassName="p-2 sm:p-4"
          >
            {chartLoading ? (
              <Skeleton height={340} />
            ) : chartError ? (
              <EmptyState
                tone="error"
                icon={<LineChart className="h-4 w-4" />}
                title={t('stocks.errorFetchingData')}
                description={t('performance.commandHint')}
              />
            ) : stockData.length > 0 ? (
              <CandlestickChart
                data={stockData}
                signals={signals}
                symbol={selectedTicker}
                period={chartPeriod}
                onPeriodChange={setChartPeriod}
                shouldShowPeriod={false}
              />
            ) : (
              <EmptyState
                size="sm"
                icon={<LineChart className="h-4 w-4" />}
                title={t('stocks.noDataAvailable')}
                description={t('stocks.noBarsHint')}
              />
            )}
          </Panel>

          <Panel
            flush
            title={t('performance.modelHistory', { model: modelLabel })}
            icon={<BarChart3 className="h-4 w-4" />}
            aria-busy={historyLoading || chartLoading}
            actions={
              historyLoading || chartLoading ? (
                <span className="text-xs text-text-muted">{t('common.loading')}</span>
              ) : !historyError && !chartError && rangeHistory.length > 0 ? (
                <Badge tone="muted" className="num">
                  {t('performance.signalRows', { count: rangeHistory.length })}
                </Badge>
              ) : null
            }
          >
            <DataTable
              data={rangeHistory}
              columns={columns}
              rowKey={item =>
                isAlphaRankItem(item)
                  ? `${item.date}-${item.rank}`
                  : `${item.date}-${item.event}`
              }
              loading={historyLoading || chartLoading}
              dense
              className="md:max-h-[32rem]"
              renderMobileRow={item => (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="num text-sm font-semibold text-text-primary">{formatDay(item.date)}</p>
                    {item.path_complete === false ? (
                      <Badge tone="muted" size="sm">{t('performance.stillOpen')}</Badge>
                    ) : null}
                  </div>
                  <SignalLabel item={item} t={t} />
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-3">
                    <div className="col-span-2 flex items-baseline justify-between gap-3">
                      <dt className="text-xs text-text-muted">{t('performance.columns.signalPrice')}</dt>
                      <dd className="num text-sm font-medium text-text-primary">
                        {signalPrice(item)?.toFixed(2) ?? '—'}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="mb-1 flex items-center gap-1 text-xs text-text-muted">
                        <ArrowUp className="h-3 w-3 text-bull" aria-hidden />
                        {t('performance.columns.peak')}
                      </dt>
                      <dd className="text-sm">
                        <PathValue value={item.max_gain} day={item.days_to_max_gain} tone="bull" t={t} />
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="mb-1 flex items-center gap-1 text-xs text-text-muted">
                        <ArrowDown className="h-3 w-3 text-bear" aria-hidden />
                        {t('performance.columns.trough')}
                      </dt>
                      <dd className="text-sm">
                        <PathValue value={item.max_loss} day={item.days_to_max_loss} tone="bear" t={t} />
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
              empty={
                <EmptyState
                  tone={historyError || chartError ? 'error' : undefined}
                  icon={<BarChart3 className="h-4 w-4" />}
                  title={
                    historyError
                      ? t('performance.historyError', { model: modelLabel })
                      : chartError
                        ? t('stocks.errorFetchingData')
                        : history.length
                          ? t('performance.noSignalsInRangeTitle', { model: modelLabel })
                          : t(`performance.models.${selectedModel}.noSignals`, { ticker: selectedTicker })
                  }
                  description={
                    historyError
                      ? undefined
                      : chartError
                        ? t('performance.commandHint')
                        : history.length
                          ? t('performance.noSignalsInRange', { model: modelLabel })
                          : t(`performance.models.${selectedModel}.noSignalsHint`)
                  }
                />
              }
            />
          </Panel>
        </>
      )}

      <div className="flex items-start gap-2.5 border-t border-border pt-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden />
        <p className="max-w-5xl text-xs leading-6 text-text-muted">
          {t(`performance.disclaimers.${selectedModel}`, { horizon })}
        </p>
      </div>
    </Page>
  )
}

export default BacktestPage

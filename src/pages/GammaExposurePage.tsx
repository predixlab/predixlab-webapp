import { Activity, ArrowRight, ChartCandlestick, Crosshair, Info, Search, Sigma, Waves } from 'lucide-react'
import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'

import OptionContractLabel from '@/components/OptionContractLabel'
import OptionsHighlights from '@/components/OptionsHighlights'
import OptionsViewTabs from '@/components/OptionsViewTabs'
import TickerLink from '@/components/TickerLink'
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
import api from '@/services/apiAdapter'
import type {
  GexAnalysis,
  GexDriver,
  GexHighlight,
  GexHighlightSignal,
  GexScope,
  GexScopeKey,
} from '@/types'
import { changeTone, cn, formatDay } from '@/utils'

const formatGex = (value: number): string => {
  const absolute = Math.abs(value)
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  if (absolute >= 1_000_000_000) return `${sign}$${(absolute / 1_000_000_000).toFixed(2)}B`
  if (absolute >= 1_000_000) return `${sign}$${(absolute / 1_000_000).toFixed(1)}M`
  if (absolute >= 1_000) return `${sign}$${(absolute / 1_000).toFixed(1)}K`
  return `${sign}$${absolute.toFixed(0)}`
}

const formatPrice = (value?: number | null): string =>
  value === null || value === undefined ? '—' : `$${value.toFixed(2)}`

const formatStrikeTick = (value: number): string =>
  value.toLocaleString(undefined, { maximumFractionDigits: 2 })

const distance = (level: number | null | undefined, spot: number): string => {
  if (level === null || level === undefined) return '—'
  const value = (level / spot - 1) * 100
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

const wallMove = (
  current: number | null | undefined,
  previous: number | null | undefined,
): string => {
  if (current === null || current === undefined || previous === null || previous === undefined) {
    return '—'
  }
  const change = current - previous
  return `${change > 0 ? '+' : ''}${change.toFixed(2)}`
}

const sameLevel = (
  left: number | null | undefined,
  right: number | null | undefined,
): boolean =>
  left !== null &&
  left !== undefined &&
  right !== null &&
  right !== undefined &&
  Math.abs(left - right) < 0.0001

type GexHighlightFilter = 'all' | GexHighlightSignal

type SharedWallLineProps = {
  x1?: number
  x2?: number
  y1?: number
  y2?: number
  dashed?: boolean
  opacity?: number
}

const SharedWallLine: React.FC<SharedWallLineProps> = ({
  x1,
  x2,
  y1,
  y2,
  dashed = false,
  opacity = 1,
}) => {
  if (x1 === undefined || x2 === undefined || y1 === undefined || y2 === undefined) {
    return null
  }
  const dash = dashed ? '2 4' : undefined
  return (
    <g opacity={opacity}>
      <line
        x1={x1 - 1.25}
        x2={x2 - 1.25}
        y1={y1}
        y2={y2}
        stroke="var(--pl-bull-vivid)"
        strokeWidth={2}
        strokeDasharray={dash}
      />
      <line
        x1={x1 + 1.25}
        x2={x2 + 1.25}
        y1={y1}
        y2={y2}
        stroke="var(--pl-bear-vivid)"
        strokeWidth={2}
        strokeDasharray={dash}
      />
    </g>
  )
}

const GammaExposurePage: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const symbol = (searchParams.get('symbol') || 'AAPL').toUpperCase()
  const [query, setQuery] = useState(symbol)
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([])
  const [symbolsError, setSymbolsError] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [highlights, setHighlights] = useState<GexHighlight[]>([])
  const [highlightsLoading, setHighlightsLoading] = useState(true)
  const [highlightsError, setHighlightsError] = useState(false)
  const [highlightFilter, setHighlightFilter] = useState<GexHighlightFilter>('all')
  const [searchOpen, setSearchOpen] = useState(false)
  const [analysis, setAnalysis] = useState<GexAnalysis | null>(null)
  const [scopeKey, setScopeKey] = useState<GexScopeKey>('all')
  const [range, setRange] = useState<'nearby' | 'all'>('nearby')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const requestRef = useRef(0)
  const searchRef = useRef<HTMLFormElement>(null)

  const loadLatest = useCallback(async (nextSymbol: string) => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError(false)
    try {
      const result = await api.getLatestGex(nextSymbol)
      if (requestId !== requestRef.current) return
      setAnalysis(result)
    } catch {
      if (requestId !== requestRef.current) return
      setAnalysis(null)
      setError(true)
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    api.getGexSymbols('', 2000)
      .then(response => {
        if (!cancelled) setAvailableSymbols(response.symbols)
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableSymbols([])
          setSymbolsError(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setHighlights([])
    setHighlightsLoading(true)
    setHighlightsError(false)
    api.getGexHighlights(
      6,
      highlightFilter === 'all' ? undefined : highlightFilter,
    )
      .then(response => {
        if (!cancelled) setHighlights(response.items)
      })
      .catch(() => {
        if (!cancelled) setHighlightsError(true)
      })
      .finally(() => {
        if (!cancelled) setHighlightsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [highlightFilter])

  useEffect(() => {
    setQuery(symbol)
    setSearchError(null)
    loadLatest(symbol)
  }, [loadLatest, symbol])

  useEffect(() => {
    const closeSearch = (event: PointerEvent) => {
      if (event.target instanceof Node && !searchRef.current?.contains(event.target)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('pointerdown', closeSearch)
    return () => document.removeEventListener('pointerdown', closeSearch)
  }, [])

  const selectSymbol = (nextSymbol: string) => {
    const normalized = nextSymbol.trim().toUpperCase()
    if (!normalized) {
      setSearchError(t('gex.symbolSearch'))
      return
    }
    if (availableSymbols.length && !availableSymbols.includes(normalized)) {
      setSearchError(t('gex.noDataHint', { symbol: normalized }))
      setSearchOpen(true)
      return
    }
    setSearchError(null)
    setSearchOpen(false)
    if (normalized === symbol) {
      loadLatest(normalized)
      return
    }
    setSearchParams(current => {
      const next = new URLSearchParams(current)
      next.set('symbol', normalized)
      return next
    })
  }

  const submitSymbol = (event: FormEvent) => {
    event.preventDefault()
    selectSymbol(query)
  }

  const scope = useMemo(
    () => analysis?.scopes.find(item => item.key === scopeKey) ?? null,
    [analysis, scopeKey],
  )

  const searchResults = useMemo(() => {
    const normalized = query.trim().toUpperCase()
    if (!normalized) return availableSymbols.slice(0, 10)
    return availableSymbols
      .filter(item => item.includes(normalized))
      .sort((left, right) => {
        const leftStarts = left.startsWith(normalized) ? 0 : 1
        const rightStarts = right.startsWith(normalized) ? 0 : 1
        return leftStarts - rightStarts || left.localeCompare(right)
      })
      .slice(0, 10)
  }, [availableSymbols, query])

  const chartData = useMemo(() => {
    if (!analysis || !scope) return []
    const spot = analysis.underlying_price
    const relevantLevels = [
      scope.call_wall,
      scope.put_wall,
      scope.previous_call_wall,
      scope.previous_put_wall,
      scope.gamma_flip,
    ].filter(
      (value): value is number =>
        value !== null &&
        value !== undefined &&
        value >= spot * 0.8 &&
        value <= spot * 1.2,
    )
    const lowerBound = Math.min(spot * 0.9, ...relevantLevels)
    const upperBound = Math.max(spot * 1.1, ...relevantLevels)
    const buckets = range === 'all'
      ? scope.strike_buckets
      : scope.strike_buckets.filter(
          item => item.strike >= lowerBound && item.strike <= upperBound,
        )
    return buckets.map(item => ({
      ...item,
    }))
  }, [analysis, range, scope])

  const xAxisTicks = useMemo(() => {
    if (!analysis || !scope || chartData.length === 0) return []

    const strikes = chartData.map(item => item.strike)
    const minStrike = Math.min(...strikes)
    const maxStrike = Math.max(...strikes)
    const span = maxStrike - minStrike
    const references = [
      analysis.underlying_price,
      scope.gamma_flip,
      scope.call_wall,
      scope.put_wall,
      scope.previous_call_wall,
      scope.previous_put_wall,
    ].filter(
      (value): value is number =>
        value !== null &&
        value !== undefined &&
        value >= minStrike &&
        value <= maxStrike,
    )

    const regularTicks = Array.from({ length: 6 }, (_, index) => {
      const target = minStrike + (span * index) / 5
      return strikes.reduce((nearest, strike) =>
        Math.abs(strike - target) < Math.abs(nearest - target) ? strike : nearest,
      )
    })
    const referenceSpacing = span / 14
    const spacedRegularTicks = regularTicks.filter(
      tick => !references.some(reference => Math.abs(reference - tick) < referenceSpacing),
    )

    return [...spacedRegularTicks, ...references]
      .sort((left, right) => left - right)
      .filter((value, index, values) => index === 0 || !sameLevel(value, values[index - 1]))
  }, [analysis, chartData, scope])

  const dominantContribution = useMemo(() => {
    if (!scope) return null
    const entries = Object.entries(scope.decomposition) as [
      keyof GexScope['decomposition'],
      number,
    ][]
    return entries.reduce((largest, item) =>
      Math.abs(item[1]) > Math.abs(largest[1]) ? item : largest,
    )
  }, [scope])

  const currentWallsOverlap = sameLevel(scope?.call_wall, scope?.put_wall)
  const previousWallsOverlap = sameLevel(scope?.previous_call_wall, scope?.previous_put_wall)
  const previousWallMatchesCurrent =
    sameLevel(scope?.previous_call_wall, scope?.call_wall) ||
    sameLevel(scope?.previous_call_wall, scope?.put_wall)

  const driverColumns: Column<GexDriver>[] = useMemo(
    () => [
      {
        key: 'contract',
        header: t('gex.contract'),
        sortable: true,
        sortAccessor: item => item.contract,
        render: item => (
          <OptionContractLabel
            symbol={analysis?.symbol ?? ''}
            expiration={item.expiration}
            strike={item.strike}
            optionType={item.option_type}
            extra={item.is_unusual
              ? <Badge tone="warn" size="sm">{t('gex.unusual')}</Badge>
              : null}
          />
        ),
      },
      {
        key: 'oiChange',
        header: t('gex.oiChange'),
        align: 'right',
        sortable: true,
        sortAccessor: item => item.oi_change,
        render: item => (
          <span className={cn('num font-medium', changeTone(item.oi_change))}>
            {item.oi_change > 0 ? '+' : ''}{item.oi_change.toLocaleString()}
          </span>
        ),
      },
      {
        key: 'gexChange',
        header: t('gex.gexChange'),
        align: 'right',
        sortable: true,
        sortAccessor: item => item.gex_change,
        render: item => (
          <span className={cn('num font-semibold', changeTone(item.gex_change))}>
            {formatGex(item.gex_change)}
          </span>
        ),
      },
      {
        key: 'share',
        header: t('gex.absoluteChangeShare'),
        align: 'right',
        render: item => (
          <span className="num text-text-secondary">
            {(item.share_of_absolute_change * 100).toFixed(1)}%
          </span>
        ),
      },
      {
        key: 'cause',
        header: t('gex.attribution'),
        cellClassName: 'whitespace-normal',
        render: item => <Badge tone="muted" size="sm">{t(`gex.causes.${item.attribution}`)}</Badge>,
      },
    ],
    [analysis?.symbol, t],
  )

  return (
    <Page>
      <div className="space-y-4 sm:space-y-5">
        <PageHeader
          title={t('gex.title')}
          date={!loading && !error && analysis?.symbol === symbol ? formatDay(analysis.date) : undefined}
          subtitle={t('gex.description')}
        />
        <OptionsViewTabs value="gamma" symbol={symbol} />
      </div>

      <OptionsHighlights
        items={highlights.map(item => ({ symbol: item.symbol, label: t(`gex.highlightSignals.${item.primary_signal}`) }))}
        selectedSymbol={symbol}
        onSelect={selectSymbol}
        filterValue={highlightFilter}
        filterDescription={t('gex.highlightFilter')}
        onFilterChange={setHighlightFilter}
        filterOptions={[
          { value: 'all', label: t('gex.allSignals') },
          { value: 'positive_gamma', label: t('gex.highlightSignals.positive_gamma') },
          { value: 'negative_gamma', label: t('gex.highlightSignals.negative_gamma') },
          { value: 'near_flip', label: t('gex.highlightSignals.near_flip') },
          { value: 'gex_change', label: t('gex.highlightSignals.gex_change') },
          { value: 'wall_shift', label: t('gex.highlightSignals.wall_shift') },
          { value: 'high_activity', label: t('gex.highlightSignals.high_activity') },
        ]}
        loading={highlightsLoading}
        error={highlightsError}
        emptyTitle={t('gex.noHighlights')}
      />

      <Panel variant="strong" bodyClassName="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)] lg:items-start">
          <div className="min-w-0">
            <p className="text-xs font-medium text-text-muted">{t('stocks.analysis')}</p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <h2
                className="max-w-full scroll-mt-6 text-3xl font-bold tracking-[-0.04em] break-words text-text-primary"
              >
                <TickerLink symbol={symbol} className="inline-flex items-center gap-2">
                  {symbol}
                  <ChartCandlestick className="h-5 w-5 shrink-0 text-text-muted" aria-hidden />
                </TickerLink>
              </h2>
              {!loading && !error && analysis?.symbol === symbol ? (
                <p className="text-xs text-text-muted">
                  {t('gex.spot')}
                  <span className="num ml-2 text-lg font-semibold text-text-primary">
                    {formatPrice(analysis.underlying_price)}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
          <form
            ref={searchRef}
            onSubmit={submitSymbol}
            onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false)
            }}
            className="min-w-0"
            role="search"
            aria-label={t('gex.symbolSearch')}
          >
            <Field
              label={t('stocks.symbol')}
              error={searchError || (symbolsError ? t('errors.loadFailed') : undefined)}
              icon={<Search className="h-4 w-4" />}
            >
              {field => (
                <div className="flex items-center gap-2">
                  <input
                    {...field}
                    type="search"
                    value={query}
                    onChange={event => {
                      setQuery(event.target.value.toUpperCase())
                      setSearchError(null)
                      setSearchOpen(true)
                    }}
                    onFocus={() => setSearchOpen(true)}
                    onKeyDown={event => {
                      if (event.key === 'Escape') {
                        event.preventDefault()
                        setSearchOpen(false)
                      } else if (event.key === 'ArrowDown') {
                        const firstResult = searchRef.current?.querySelector<HTMLButtonElement>('[data-symbol-result]')
                        if (firstResult) {
                          event.preventDefault()
                          firstResult.focus()
                        }
                      }
                    }}
                    className="input num flex-1 pl-8"
                    placeholder={t('stocks.symbol')}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    required
                  />
                  <Button type="submit">{t('common.apply')}</Button>
                </div>
              )}
            </Field>
            {searchOpen && searchResults.length > 0 && query !== symbol ? (
              <ul className="mt-3 flex flex-wrap gap-2" aria-label={t('gex.symbolSearch')}>
                {searchResults.map(item => (
                  <li key={item}>
                    <Button
                      type="button"
                      data-symbol-result
                      size="sm"
                      variant="secondary"
                      className="num"
                      onClick={() => selectSymbol(item)}
                    >
                      {item}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </form>
        </div>
        <div className="flex min-w-0 flex-col gap-2.5 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-text-secondary">{t('structure.expiration')}</p>
          <Tabs
            value={scopeKey}
            onChange={setScopeKey}
            aria-label={t('structure.expiration')}
            items={[
              { value: '7d', label: t('structure.days', { count: 7 }) },
              { value: '30d', label: t('structure.days', { count: 30 }) },
              { value: 'all', label: t('common.all') },
            ]}
          />
        </div>
      </Panel>

      {loading || (analysis !== null && analysis.symbol !== symbol) ? (
        <div className="space-y-5" role="status" aria-label={t('common.loading')}>
          <Skeleton height={160} />
          <Skeleton height={420} />
        </div>
      ) : error || !analysis || !scope ? (
        <Panel>
          <EmptyState
            tone="error"
            icon={<Activity className="h-5 w-5" />}
            title={t('gex.noData')}
            description={t('gex.noDataHint', { symbol })}
            action={<Button type="button" variant="secondary" onClick={() => loadLatest(symbol)}>{t('common.retry')}</Button>}
          />
        </Panel>
      ) : (
        <>
          <StatStrip>
            <StatTile
              label={t('gex.regime')}
              value={t(`gex.regimes.${scope.regime}`)}
              hint={t(`gex.regimeHints.${scope.regime}`)}
              icon={<Waves className="h-4 w-4" />}
            />
            <StatTile
              label={t('gex.netGex')}
              value={formatGex(scope.net_gex)}
              hint={t('gex.callPutSplit', {
                call: formatGex(scope.call_gex),
                put: formatGex(scope.put_gex),
              })}
              tone={scope.net_gex >= 0 ? 'bull' : 'bear'}
              icon={<Sigma className="h-4 w-4" />}
            />
            <StatTile
              label={t('gex.gammaFlip')}
              value={formatPrice(scope.gamma_flip)}
              hint={t('gex.fromSpot', {
                distance: distance(scope.gamma_flip, analysis.underlying_price),
              })}
              icon={<Crosshair className="h-4 w-4" />}
            />
            <StatTile
              label={t('gex.dailyChange')}
              value={formatGex(scope.net_gex_change)}
              hint={dominantContribution
                ? t('gex.mainlyFrom', { cause: t(`gex.causes.${dominantContribution[0]}`) })
                : undefined}
              tone={scope.net_gex_change >= 0 ? 'bull' : 'bear'}
            />
          </StatStrip>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <Panel
              variant="strong"
              title={t('gex.mapTitle')}
              subtitle={t('gex.mapSubtitle')}
              icon={<Waves className="h-4 w-4" />}
              toolbar={
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs font-medium text-text-secondary">{t('gex.strike')}</span>
                  <Tabs
                    value={range}
                    onChange={setRange}
                    aria-label={t('gex.strike')}
                    items={[
                      { value: 'nearby', label: t('gex.nearSpot') },
                      { value: 'all', label: t('gex.allStrikes') },
                    ]}
                  />
                </div>
              }
              footer={
                <div className="grid gap-3 text-xs sm:grid-cols-2">
                  {[
                    {
                      label: t('gex.callWall'),
                      current: scope.call_wall,
                      previous: scope.previous_call_wall,
                      lineClass: 'bg-bull-vivid',
                      textClass: 'text-bull',
                    },
                    {
                      label: t('gex.putWall'),
                      current: scope.put_wall,
                      previous: scope.previous_put_wall,
                      lineClass: 'bg-bear-vivid',
                      textClass: 'text-bear',
                    },
                  ].map(item => (
                    <div key={item.label} className="min-w-0">
                      <p className="mb-1.5 flex items-center gap-2 font-medium text-text-secondary">
                        <span className={cn('h-0.5 w-3', item.lineClass)} aria-hidden />
                        {item.label}
                      </p>
                      <p className="num flex flex-wrap items-center gap-1.5">
                        <span className="text-text-muted">{formatPrice(item.previous)}</span>
                        <ArrowRight className="h-3 w-3 text-text-muted" aria-hidden />
                        <span className={cn('font-semibold', item.textClass)}>{formatPrice(item.current)}</span>
                        <span className="text-text-muted">({wallMove(item.current, item.previous)})</span>
                      </p>
                    </div>
                  ))}
                </div>
              }
            >
              {chartData.length ? (
                <>
                  <div
                    className="mb-5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-text-secondary sm:grid-cols-3"
                    aria-label={t('gex.chartLegend')}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-bull-vivid" aria-hidden />
                      {t('gex.callGex')}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-bear-vivid" aria-hidden />
                      {t('gex.putGex')}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-0.5 w-4 shrink-0 bg-text-secondary" aria-hidden />
                      {t('gex.currentWall')}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="h-1 w-4 shrink-0" viewBox="0 0 16 4" aria-hidden>
                        <line
                          x1="0"
                          x2="16"
                          y1="2"
                          y2="2"
                          stroke="var(--pl-text-secondary)"
                          strokeDasharray="2 4"
                        />
                      </svg>
                      {t('gex.previousWall')}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="h-1 w-4 shrink-0" viewBox="0 0 16 4" aria-hidden>
                        <line
                          x1="0"
                          x2="16"
                          y1="2"
                          y2="2"
                          stroke="var(--pl-gex-flip)"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                        />
                      </svg>
                      {t('gex.gammaFlip')}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-px w-4 shrink-0 bg-text-primary" aria-hidden />
                      {t('gex.spot')}
                    </span>
                  </div>
                  <div className="h-[320px] min-w-0 sm:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={chartData}
                        stackOffset="sign"
                        margin={{ top: 12, right: 12, bottom: 8, left: 0 }}
                      >
                        <CartesianGrid stroke="var(--pl-border)" vertical={false} />
                        <XAxis
                          dataKey="strike"
                          type="number"
                          domain={['dataMin', 'dataMax']}
                          ticks={xAxisTicks}
                          tick={{ fill: 'var(--pl-text-muted)', fontSize: 11 }}
                          tickFormatter={value => formatStrikeTick(Number(value))}
                          interval="preserveStartEnd"
                          minTickGap={28}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fill: 'var(--pl-text-muted)', fontSize: 11 }}
                          tickFormatter={value => formatGex(Number(value)).replace('$', '')}
                          width={64}
                          tickLine={false}
                          axisLine={false}
                        />
                        <ChartTooltip
                          formatter={(value, name) => [
                            formatGex(Number(value)),
                            name === 'call_gex' ? t('gex.callGex') : t('gex.putGex'),
                          ]}
                          labelFormatter={label => `${t('gex.strike')} $${label}`}
                          contentStyle={{
                            background: 'var(--pl-surface-overlay)',
                            border: '1px solid var(--pl-border)',
                            borderRadius: 8,
                            color: 'var(--pl-text-primary)',
                            fontSize: 12,
                          }}
                          labelStyle={{ color: 'var(--pl-text-primary)', fontWeight: 600 }}
                          wrapperStyle={{ maxWidth: 'calc(100vw - 2rem)' }}
                        />
                        <ReferenceLine
                          x={analysis.underlying_price}
                          stroke="var(--pl-text-primary)"
                        />
                        {typeof scope.gamma_flip === 'number' ? (
                          <ReferenceLine
                            x={scope.gamma_flip}
                            stroke="var(--pl-gex-flip)"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                          />
                        ) : null}
                        {currentWallsOverlap && typeof scope.call_wall === 'number' ? (
                          <ReferenceLine
                            x={scope.call_wall}
                            stroke="transparent"
                            shape={<SharedWallLine />}
                          />
                        ) : (
                          <>
                            {typeof scope.call_wall === 'number' ? (
                              <ReferenceLine
                                x={scope.call_wall}
                                stroke="var(--pl-bull-vivid)"
                                strokeWidth={2}
                              />
                            ) : null}
                            {typeof scope.put_wall === 'number' ? (
                              <ReferenceLine
                                x={scope.put_wall}
                                stroke="var(--pl-bear-vivid)"
                                strokeWidth={2}
                              />
                            ) : null}
                          </>
                        )}
                        {previousWallsOverlap && typeof scope.previous_call_wall === 'number' ? (
                          previousWallMatchesCurrent ? null : (
                            <ReferenceLine
                              x={scope.previous_call_wall}
                              stroke="transparent"
                              shape={<SharedWallLine dashed opacity={0.78} />}
                            />
                          )
                        ) : (
                          <>
                            {typeof scope.previous_call_wall === 'number' &&
                            !sameLevel(scope.previous_call_wall, scope.call_wall) &&
                            !sameLevel(scope.previous_call_wall, scope.put_wall) ? (
                              <ReferenceLine
                                x={scope.previous_call_wall}
                                stroke="var(--pl-bull-vivid)"
                                strokeWidth={1.5}
                                strokeDasharray="2 4"
                                strokeOpacity={0.78}
                              />
                            ) : null}
                            {typeof scope.previous_put_wall === 'number' &&
                            !sameLevel(scope.previous_put_wall, scope.call_wall) &&
                            !sameLevel(scope.previous_put_wall, scope.put_wall) ? (
                              <ReferenceLine
                                x={scope.previous_put_wall}
                                stroke="var(--pl-bear-vivid)"
                                strokeWidth={1.5}
                                strokeDasharray="2 4"
                                strokeOpacity={0.78}
                              />
                            ) : null}
                          </>
                        )}
                        <Bar dataKey="call_gex" fill="var(--pl-bull-vivid)" stackId="gex" />
                        <Bar dataKey="put_gex" fill="var(--pl-bear-vivid)" stackId="gex" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <EmptyState title={t('gex.noScopeData')} />
              )}
            </Panel>

            <div className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-1">
              <Panel title={t('gex.keyLevels')} icon={<Crosshair className="h-4 w-4" />} flush>
                <dl className="divide-y divide-border">
                  {[
                    { label: t('gex.spot'), current: analysis.underlying_price, previous: null },
                    { label: t('gex.callWall'), current: scope.call_wall, previous: scope.previous_call_wall },
                    { label: t('gex.putWall'), current: scope.put_wall, previous: scope.previous_put_wall },
                    { label: t('gex.gammaFlip'), current: scope.gamma_flip, previous: scope.previous_gamma_flip },
                  ].map(item => (
                    <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 px-4 py-4 sm:px-5">
                      <dt className="text-xs font-medium text-text-secondary">{item.label}</dt>
                      <dd className="num text-right text-base font-semibold text-text-primary">
                        {formatPrice(item.current)}
                      </dd>
                      <dd className="num col-start-2 text-right text-xs text-text-muted">
                        {t('gex.previous')} {formatPrice(item.previous)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Panel>
              <Panel title={t('gex.interpretation')} variant="subtle" icon={<Info className="h-4 w-4" />}>
                <p className="text-sm leading-6 text-text-secondary">
                  {t('gex.interpretationText', {
                    symbol: analysis.symbol,
                    regime: t(`gex.regimes.${scope.regime}`),
                    net: formatGex(scope.net_gex),
                    change: formatGex(scope.net_gex_change),
                    flip: formatPrice(scope.gamma_flip),
                    distance: distance(scope.gamma_flip, analysis.underlying_price),
                  })}
                </p>
                <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-text-muted">
                  {t('gex.modelNotice')}
                </p>
              </Panel>
            </div>
          </div>

          <Panel title={t('gex.decompositionTitle')} subtitle={t('gex.decompositionSubtitle')} flush>
            <StatStrip className="rounded-none border-0 bg-transparent shadow-none">
              {(Object.entries(scope.decomposition) as [keyof GexScope['decomposition'], number][]).map(
                ([key, value]) => (
                  <StatTile
                    key={key}
                    label={t(`gex.causes.${key}`)}
                    value={formatGex(value)}
                    tone={value > 0 ? 'bull' : value < 0 ? 'bear' : 'default'}
                  />
                ),
              )}
            </StatStrip>
          </Panel>
        </>
      )}

      {!loading && !error && analysis && scope ? (
        <Panel title={t('gex.driversTitle')} subtitle={t('gex.driversSubtitle')} flush>
          <DataTable
            data={scope.top_drivers}
            columns={driverColumns}
            rowKey={item => item.contract}
            initialSort={{ key: 'gexChange', dir: 'desc' }}
            renderMobileRow={item => (
              <div className="space-y-4">
                <OptionContractLabel
                  symbol={analysis.symbol}
                  expiration={item.expiration}
                  strike={item.strike}
                  optionType={item.option_type}
                  className="text-sm"
                  extra={item.is_unusual ? <Badge tone="warn" size="sm">{t('gex.unusual')}</Badge> : null}
                />
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="min-w-0">
                    <dt className="text-xs text-text-muted">{t('gex.oiChange')}</dt>
                    <dd className={cn('num mt-1 text-base font-semibold', changeTone(item.oi_change))}>
                      {item.oi_change > 0 ? '+' : ''}{item.oi_change.toLocaleString()}
                    </dd>
                  </div>
                  <div className="min-w-0 text-right">
                    <dt className="text-xs text-text-muted">{t('gex.gexChange')}</dt>
                    <dd className={cn('num mt-1 text-base font-semibold', changeTone(item.gex_change))}>
                      {formatGex(item.gex_change)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs text-text-muted">{t('gex.attribution')}</dt>
                    <dd className="mt-1 text-xs font-medium leading-5 text-text-secondary">
                      {t(`gex.causes.${item.attribution}`)}
                    </dd>
                  </div>
                  <div className="min-w-0 text-right">
                    <dt className="text-xs text-text-muted">{t('gex.absoluteChangeShare')}</dt>
                    <dd className="num mt-1 text-sm font-medium text-text-primary">
                      {(item.share_of_absolute_change * 100).toFixed(1)}%
                    </dd>
                  </div>
                </dl>
              </div>
            )}
            empty={<EmptyState title={t('gex.noDrivers')} />}
          />
        </Panel>
      ) : null}
    </Page>
  )
}

export default GammaExposurePage

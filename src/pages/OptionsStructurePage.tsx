import { Activity, ChartCandlestick, Info, Layers3, Search, TrendingUp } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'

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
} from '@/components/ui'
import type { Column } from '@/components/ui'
import api from '@/services/apiAdapter'
import type {
  OptionsPositionMigration,
  OptionsStructureAnalysis,
  OptionsStructureHighlight,
  OptionsStructureHighlightSignal,
} from '@/types'
import { changeTone, cn, formatCurrency, formatDay } from '@/utils'

const percent = (value?: number | null): string =>
  value === null || value === undefined ? '—' : `${(value * 100).toFixed(1)}%`

const points = (value?: number | null): string =>
  value === null || value === undefined
    ? '—'
    : `${value > 0 ? '+' : ''}${(value * 100).toFixed(1)} pt`

const compact = (value: number): string =>
  new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(value)

type StructureHighlightFilter = 'all' | OptionsStructureHighlightSignal

const migrationTones: Record<OptionsPositionMigration['kind'], 'bull' | 'bear' | 'muted'> = {
  new: 'bull',
  increased: 'bull',
  closed: 'bear',
  decreased: 'bear',
  mixed: 'muted',
}

const OptionsStructurePage: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const symbol = (searchParams.get('symbol') || 'AAPL').toUpperCase()
  const [query, setQuery] = useState(symbol)
  const [symbols, setSymbols] = useState<string[]>([])
  const [symbolsError, setSymbolsError] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [highlights, setHighlights] = useState<OptionsStructureHighlight[]>([])
  const [highlightsLoading, setHighlightsLoading] = useState(true)
  const [highlightsError, setHighlightsError] = useState(false)
  const [highlightFilter, setHighlightFilter] = useState<StructureHighlightFilter>('all')
  const [analysis, setAnalysis] = useState<OptionsStructureAnalysis | null>(null)
  const [selectedExpiration, setSelectedExpiration] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const requestRef = useRef(0)
  const searchRef = useRef<HTMLFormElement>(null)

  const load = useCallback(async (nextSymbol: string) => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError(false)
    try {
      const result = await api.getLatestOptionsStructure(nextSymbol)
      if (requestId !== requestRef.current) return
      setAnalysis(result)
      setSelectedExpiration(
        result.summary.skew_expiration
        ?? result.skew_expirations[0]?.expiration
        ?? '',
      )
    } catch {
      if (requestId !== requestRef.current) return
      setAnalysis(null)
      setError(true)
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    setQuery(symbol)
    setSearchError(null)
    load(symbol)
  }, [load, symbol])

  useEffect(() => {
    let cancelled = false
    api.getOptionsStructureSymbols('', 1000)
      .then(result => {
        if (!cancelled) setSymbols(result.symbols)
      })
      .catch(() => {
        if (!cancelled) {
          setSymbols([])
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
    api.getOptionsStructureHighlights(
      6,
      highlightFilter === 'all' ? undefined : highlightFilter,
    )
      .then(result => {
        if (!cancelled) setHighlights(result.items)
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

  const selectSymbol = (nextSymbol: string) => {
    const normalized = nextSymbol.trim().toUpperCase()
    if (!normalized) {
      setSearchError(t('stocks.selectStock'))
      return
    }
    setSearchError(null)
    setSearchOpen(false)
    setSearchParams(current => {
      const next = new URLSearchParams(current)
      next.set('symbol', normalized)
      return next
    })
  }

  const searchResults = useMemo(() => {
    const normalized = query.trim().toUpperCase()
    return symbols
      .filter(item => !normalized || item.includes(normalized))
      .sort((left, right) => {
        const leftStarts = left.startsWith(normalized) ? 0 : 1
        const rightStarts = right.startsWith(normalized) ? 0 : 1
        return leftStarts - rightStarts || left.localeCompare(right)
      })
      .slice(0, 10)
  }, [query, symbols])

  const termData = useMemo(
    () => analysis?.term_structure.map(item => ({
      expiration: item.expiration,
      current: item.atm_iv === null || item.atm_iv === undefined ? null : item.atm_iv * 100,
      previous:
        item.previous_atm_iv === null || item.previous_atm_iv === undefined
          ? null
          : item.previous_atm_iv * 100,
    })) ?? [],
    [analysis],
  )

  const skewData = useMemo(() => {
    const selected = analysis?.skew_expirations.find(
      item => item.expiration === selectedExpiration,
    )
    return selected?.points.map(item => ({
      delta: `${item.delta > 0 ? '+' : ''}${Math.round(item.delta * 100)}Δ`,
      current: item.iv === null || item.iv === undefined ? null : item.iv * 100,
      previous:
        item.previous_iv === null || item.previous_iv === undefined
          ? null
          : item.previous_iv * 100,
    })) ?? []
  }, [analysis, selectedExpiration])

  const selectedSkew = useMemo(() => {
    const selected = analysis?.skew_expirations.find(
      item => item.expiration === selectedExpiration,
    )
    const put = selected?.points.find(item => item.delta === -0.25)
    const call = selected?.points.find(item => item.delta === 0.25)
    const current =
      put?.iv !== null &&
      put?.iv !== undefined &&
      call?.iv !== null &&
      call?.iv !== undefined
        ? put.iv - call.iv
        : null
    const previous =
      put?.previous_iv !== null &&
      put?.previous_iv !== undefined &&
      call?.previous_iv !== null &&
      call?.previous_iv !== undefined
        ? put.previous_iv - call.previous_iv
        : null
    return {
      put: put?.iv,
      call: call?.iv,
      current,
      previousPut: put?.previous_iv,
      previousCall: call?.previous_iv,
      previous,
    }
  }, [analysis, selectedExpiration])

  const migrationColumns: Column<OptionsPositionMigration>[] = useMemo(
    () => [
      {
        key: 'expiration',
        header: t('structure.expiration'),
        sortable: true,
        sortAccessor: item => item.expiration,
        render: item => (
          <div>
            <p className="num text-sm text-text-primary">{item.expiration}</p>
            <p className="num mt-1 text-xs text-text-muted">
              {t('structure.days', { count: item.days_to_expiry })}
            </p>
          </div>
        ),
      },
      {
        key: 'strike',
        header: t('structure.strike'),
        align: 'right',
        sortable: true,
        sortAccessor: item => item.strike,
        render: item => <span className="num">${item.strike.toFixed(2)}</span>,
      },
      {
        key: 'callChange',
        header: t('structure.callOiChange'),
        align: 'right',
        sortable: true,
        sortAccessor: item => item.call_oi_change,
        render: item => (
          <div className="text-right">
            <p className={cn('num font-medium', changeTone(item.call_oi_change))}>
              {compact(item.call_oi_change)}
            </p>
            <p className="num mt-1 text-xs text-text-muted">{item.call_open_interest.toLocaleString()}</p>
          </div>
        ),
      },
      {
        key: 'putChange',
        header: t('structure.putOiChange'),
        align: 'right',
        sortable: true,
        sortAccessor: item => item.put_oi_change,
        render: item => (
          <div className="text-right">
            <p className={cn('num font-medium', changeTone(item.put_oi_change))}>
              {compact(item.put_oi_change)}
            </p>
            <p className="num mt-1 text-xs text-text-muted">{item.put_open_interest.toLocaleString()}</p>
          </div>
        ),
      },
      {
        key: 'totalChange',
        header: t('structure.netOiChange'),
        align: 'right',
        sortable: true,
        sortAccessor: item => item.total_oi_change,
        render: item => (
          <span className={cn('num font-semibold', changeTone(item.total_oi_change))}>
            {compact(item.total_oi_change)}
          </span>
        ),
      },
      {
        key: 'kind',
        header: t('structure.changeType'),
        render: item => (
          <Badge size="sm" tone={migrationTones[item.kind]}>
            {t(`structure.kinds.${item.kind}`)}
          </Badge>
        ),
      },
    ],
    [t],
  )

  const hasTermData = termData.some(item => item.current !== null || item.previous !== null)
  const hasSkewData = skewData.some(item => item.current !== null || item.previous !== null)
  const skewFooter = hasSkewData ? (
    <div className="grid gap-4 text-xs sm:grid-cols-2">
      <div className="min-w-0">
        <p className="mb-2 font-medium leading-5 text-text-secondary">
          {t('structure.current25dSkew')}
        </p>
        <p className="num flex flex-wrap items-baseline gap-1.5 text-sm text-text-primary">
          <span className="text-bear">{percent(selectedSkew.put)}</span>
          {' − '}
          <span className="text-bull">{percent(selectedSkew.call)}</span>
          {' = '}
          <strong className={cn(
            selectedSkew.current === null
              ? 'text-text-muted'
              : selectedSkew.current >= 0
                ? 'text-bear'
                : 'text-bull',
          )}>
            {points(selectedSkew.current)}
          </strong>
        </p>
      </div>
      <div className="min-w-0">
        <p className="mb-2 font-medium leading-5 text-text-secondary">
          {t('structure.previous25dSkew')}
        </p>
        <p className="num flex flex-wrap items-baseline gap-1.5 text-sm text-text-primary">
          <span>{percent(selectedSkew.previousPut)}</span>
          {' − '}
          <span>{percent(selectedSkew.previousCall)}</span>
          {' = '}
          <strong>{points(selectedSkew.previous)}</strong>
        </p>
      </div>
    </div>
  ) : undefined

  return (
    <Page>
      <div className="space-y-4 sm:space-y-5">
        <PageHeader
          title={t('structure.title')}
          date={!loading && !error && analysis?.symbol === symbol ? formatDay(analysis.date) : undefined}
          subtitle={t('structure.description')}
        />
        <OptionsViewTabs value="structure" symbol={symbol} />
      </div>

      <OptionsHighlights
        items={highlights.map(item => ({ symbol: item.symbol, label: t(`structure.highlightSignals.${item.primary_signal}`) }))}
        selectedSymbol={symbol}
        onSelect={selectSymbol}
        filterValue={highlightFilter}
        filterDescription={t('structure.highlightFilter')}
        onFilterChange={setHighlightFilter}
        filterOptions={[
          { value: 'all', label: t('structure.allSignals') },
          { value: 'iv_expansion', label: t('structure.highlightSignals.iv_expansion') },
          { value: 'iv_crush', label: t('structure.highlightSignals.iv_crush') },
          { value: 'downside_hedging', label: t('structure.highlightSignals.downside_hedging') },
          { value: 'upside_chasing', label: t('structure.highlightSignals.upside_chasing') },
          { value: 'position_rotation', label: t('structure.highlightSignals.position_rotation') },
          { value: 'term_dislocation', label: t('structure.highlightSignals.term_dislocation') },
        ]}
        loading={highlightsLoading}
        error={highlightsError}
        emptyTitle={t('structure.noHighlights')}
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
                    {formatCurrency(analysis.underlying_price)}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
          <form
            ref={searchRef}
            className="min-w-0"
            role="search"
            aria-label={t('stocks.selectStock')}
            onSubmit={event => {
              event.preventDefault()
              selectSymbol(query)
            }}
            onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false)
            }}
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
              <ul className="mt-3 flex flex-wrap gap-2" aria-label={t('stocks.selectStock')}>
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
        <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-[minmax(0,1fr)_minmax(14rem,20rem)] sm:items-end">
          <dl className="flex flex-wrap gap-x-6 gap-y-3 text-xs">
            <div>
              <dt className="text-text-muted">{t('structure.current')}</dt>
              <dd className="num mt-1 font-medium text-text-secondary">
                {!loading && !error && analysis?.symbol === symbol ? formatDay(analysis.date) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">{t('structure.previous')}</dt>
              <dd className="num mt-1 font-medium text-text-secondary">
                {!loading && !error && analysis?.symbol === symbol ? formatDay(analysis.previous_date) : '—'}
              </dd>
            </div>
          </dl>
          <Field label={t('structure.expiration')}>
            {field => (
              <select
                {...field}
                className="input num"
                value={selectedExpiration}
                onChange={event => setSelectedExpiration(event.target.value)}
                disabled={loading || error || !analysis?.skew_expirations.length}
              >
                {analysis?.skew_expirations.length ? analysis.skew_expirations.map(item => (
                  <option key={item.expiration} value={item.expiration}>
                    {item.expiration} · {t('structure.days', { count: item.days_to_expiry })}
                  </option>
                )) : (
                  <option value="">{loading ? t('common.loading') : t('structure.noReliableSkew')}</option>
                )}
              </select>
            )}
          </Field>
        </div>
      </Panel>

      {loading || (analysis !== null && analysis.symbol !== symbol) ? (
        <div className="space-y-5" role="status" aria-label={t('common.loading')}>
          <Skeleton height={160} />
          <Skeleton height={360} />
        </div>
      ) : error || !analysis ? (
        <Panel>
          <EmptyState
            tone="error"
            icon={<Activity className="h-5 w-5" />}
            title={t('structure.noData')}
            description={t('structure.noDataHint', { symbol })}
            action={<Button type="button" variant="secondary" onClick={() => load(symbol)}>{t('common.retry')}</Button>}
          />
        </Panel>
      ) : (
        <>
          <StatStrip>
            <StatTile
              label={t('structure.frontAtmIv')}
              value={percent(analysis.summary.atm_iv)}
              hint={t('structure.changeFromPrevious', {
                change: points(analysis.summary.atm_iv_change),
              })}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatTile
              label={t('structure.downsideSkew')}
              value={points(analysis.summary.downside_skew)}
              hint={t('structure.skewChangeFromPrevious', {
                expiration: analysis.summary.skew_expiration?.slice(5) ?? '—',
                change: points(analysis.summary.downside_skew_change),
              })}
            />
            <StatTile
              label={t('structure.totalOiChange')}
              value={compact(analysis.summary.total_oi_change)}
              hint={t('structure.callPutOiChange', {
                call: compact(analysis.summary.call_oi_change),
                put: compact(analysis.summary.put_oi_change),
              })}
              tone={analysis.summary.total_oi_change >= 0 ? 'bull' : 'bear'}
              icon={<Layers3 className="h-4 w-4" />}
            />
            <StatTile
              label={t('structure.contractRotation')}
              value={`${analysis.summary.new_contracts} / ${analysis.summary.closed_contracts}`}
              hint={t('structure.newClosed')}
            />
          </StatStrip>

          <div className="grid items-stretch gap-5 xl:grid-cols-2 xl:grid-rows-[auto_auto_auto] xl:gap-y-0">
            <Panel
              variant="strong"
              className="xl:row-span-3 xl:grid xl:grid-rows-subgrid xl:[&>header]:items-start"
              title={t('structure.termTitle')}
              subtitle={t('structure.termSubtitle')}
              footer={
                <dl className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <dt className="mb-2 font-medium leading-5 text-text-secondary">{t('structure.current')}</dt>
                    <dd className="num text-sm font-semibold text-text-primary">{formatDay(analysis.date)}</dd>
                  </div>
                  <div>
                    <dt className="mb-2 font-medium leading-5 text-text-secondary">{t('structure.previous')}</dt>
                    <dd className="num text-sm font-semibold text-text-primary">{formatDay(analysis.previous_date)}</dd>
                  </div>
                </dl>
              }
            >
              {hasTermData ? (
                <div className="h-[300px] min-w-0 sm:h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={termData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                      <CartesianGrid stroke="var(--pl-border)" vertical={false} />
                      <XAxis
                        dataKey="expiration"
                        tick={{ fill: 'var(--pl-text-muted)', fontSize: 11 }}
                        tickFormatter={value => String(value).slice(5)}
                        minTickGap={24}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'var(--pl-text-muted)', fontSize: 11 }}
                        tickFormatter={value => `${value}%`}
                        width={48}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip
                        formatter={value => [`${Number(value).toFixed(1)}%`]}
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
                      <Legend align="left" verticalAlign="top" height={36} iconType="line" wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        name={t('structure.current')}
                        dataKey="current"
                        stroke="var(--pl-accent-500)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                      <Line
                        name={t('structure.previous')}
                        dataKey="previous"
                        stroke="var(--pl-text-muted)"
                        strokeDasharray="4 4"
                        dot={{ r: 2 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState className="min-h-[300px] sm:min-h-[340px]" title={t('structure.noTermData')} />
              )}
            </Panel>

            <Panel
              variant="strong"
              className="xl:row-span-3 xl:grid xl:grid-rows-subgrid xl:[&>header]:items-start"
              title={t('structure.skewTitle')}
              subtitle={t('structure.skewSubtitle')}
              footer={skewFooter}
              actions={
                selectedExpiration ? (
                  <Badge tone="muted"><span className="num">{selectedExpiration}</span></Badge>
                ) : null
              }
            >
              {hasSkewData ? (
                  <div className="h-[300px] min-w-0 sm:h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={skewData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                        <CartesianGrid stroke="var(--pl-border)" vertical={false} />
                        <XAxis
                          dataKey="delta"
                          tick={{ fill: 'var(--pl-text-muted)', fontSize: 11 }}
                          minTickGap={16}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fill: 'var(--pl-text-muted)', fontSize: 11 }}
                          tickFormatter={value => `${value}%`}
                          width={48}
                          tickLine={false}
                          axisLine={false}
                        />
                        <ChartTooltip
                          formatter={value => [`${Number(value).toFixed(1)}%`]}
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
                        <Legend align="left" verticalAlign="top" height={36} iconType="line" wrapperStyle={{ fontSize: 12 }} />
                        <ReferenceLine
                          x="-25Δ"
                          stroke="var(--pl-bear-vivid)"
                          strokeDasharray="2 4"
                          strokeOpacity={0.55}
                        />
                        <ReferenceLine
                          x="+25Δ"
                          stroke="var(--pl-bull-vivid)"
                          strokeDasharray="2 4"
                          strokeOpacity={0.55}
                        />
                        <Line
                          name={t('structure.current')}
                          dataKey="current"
                          stroke="var(--pl-accent-500)"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          connectNulls
                        />
                        <Line
                          name={t('structure.previous')}
                          dataKey="previous"
                          stroke="var(--pl-text-muted)"
                          strokeDasharray="4 4"
                          dot={{ r: 2 }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
              ) : (
                <EmptyState
                  className="min-h-[300px] sm:min-h-[340px]"
                  title={t('structure.noReliableSkew')}
                  description={t('structure.noReliableSkewHint')}
                />
              )}
            </Panel>
          </div>
        </>
      )}

      {!loading && !error && analysis ? (
        <>
          <Panel
            flush
            title={t('structure.migrationTitle')}
            subtitle={t('structure.migrationSubtitle')}
            icon={<Layers3 className="h-4 w-4" />}
          >
            <DataTable
              columns={migrationColumns}
              data={analysis.position_migrations}
              rowKey={item => `${item.expiration}-${item.strike}`}
              empty={<EmptyState title={t('structure.noMigration')} />}
              renderMobileRow={item => (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="num text-sm font-semibold text-text-primary">{item.expiration}</p>
                      <p className="num mt-1 text-xs text-text-muted">
                        {t('structure.days', { count: item.days_to_expiry })}
                      </p>
                    </div>
                    <Badge size="sm" tone={migrationTones[item.kind]}>
                      {t(`structure.kinds.${item.kind}`)}
                    </Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-border pt-3">
                    <div className="min-w-0">
                      <dt className="text-xs text-text-muted">{t('structure.strike')}</dt>
                      <dd className="num mt-1 text-base font-semibold text-text-primary">
                        {formatCurrency(item.strike)}
                      </dd>
                    </div>
                    <div className="min-w-0 text-right">
                      <dt className="text-xs text-text-muted">{t('structure.netOiChange')}</dt>
                      <dd className={cn('num mt-1 text-base font-semibold', changeTone(item.total_oi_change))}>
                        {compact(item.total_oi_change)}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs text-text-muted">{t('structure.callOiChange')}</dt>
                      <dd className={cn('num mt-1 text-base font-semibold', changeTone(item.call_oi_change))}>
                        {compact(item.call_oi_change)}
                      </dd>
                      <dd className="num mt-1 text-xs leading-5 text-text-secondary">
                        {t('options.openInterest')}: {item.call_open_interest.toLocaleString()}
                      </dd>
                    </div>
                    <div className="min-w-0 text-right">
                      <dt className="text-xs text-text-muted">{t('structure.putOiChange')}</dt>
                      <dd className={cn('num mt-1 text-base font-semibold', changeTone(item.put_oi_change))}>
                        {compact(item.put_oi_change)}
                      </dd>
                      <dd className="num mt-1 text-xs leading-5 text-text-secondary">
                        {t('options.openInterest')}: {item.put_open_interest.toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            />
          </Panel>
          <div className="flex items-start gap-3 px-1 text-text-muted">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p className="max-w-5xl text-xs leading-6">{t('structure.modelNotice')}</p>
          </div>
        </>
      ) : null}
    </Page>
  )
}

export default OptionsStructurePage

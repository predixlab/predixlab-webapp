import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  Crown,
  Info,
  ListOrdered,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import TickerChartDrawer from '@/components/TickerChartDrawer'
import {
  Alert,
  Button,
  DatePickerModal,
  EmptyState,
  Modal,
  Page,
  PageHeader,
  Skeleton,
  Tabs,
  Tooltip,
} from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/apiAdapter'
import type {
  AlphaRankItem,
  PivotPick,
  SignalsDatesResponse,
  SignalsResponse,
} from '@/types'
import { cn, formatDay } from '@/utils'

const CACHE_TTL_MS = 5 * 60 * 1000
const MARKET = 'us'
const ALPHARANK_LIMIT = 15

type SignalSource = 'alpharank' | 'pivot'
type MobileWorkspace = SignalSource
type CacheEntry<T> = { data: T; ts: number }

const AlphaRankRow: React.FC<{
  item: AlphaRankItem
  selected: boolean
  onSelect: () => void
}> = ({ item, selected, onSelect }) => {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={t('alpharank.rowAria', {
        rank: item.rank,
        symbol: item.symbol,
        score: (item.score * 100).toFixed(1),
      })}
      className={cn(
        'group relative block w-full border-b border-border text-left transition-colors duration-150 last:border-b-0',
        selected
          ? 'bg-accent-soft before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:bg-accent-500'
          : 'hover:bg-surface-raised',
      )}
    >
      <span className="grid min-h-16 grid-cols-[2rem_minmax(0,1fr)_5rem_1rem] items-center gap-3 px-4 py-3 sm:px-5 xl:min-h-14">
        <span
          className={cn(
            'num flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium',
            item.rank <= 3 ? 'bg-accent-soft text-accent-400' : 'text-text-muted',
          )}
        >
          {item.rank}
        </span>
        <span className="min-w-0">
          <span
            className={cn(
              'block truncate tracking-[-0.015em] text-text-primary',
              'text-sm font-bold',
            )}
          >
            {item.symbol}
          </span>
        </span>
        <span>
          <span className="num block text-right text-sm font-semibold text-text-primary">
            {(item.score * 100).toFixed(1)}
          </span>
          <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-surface-strong">
            <span
              className="block h-full rounded-full bg-accent-500"
              style={{ width: `${Math.max(0, Math.min(100, item.score * 100))}%` }}
            />
          </span>
        </span>
        <ChevronRight className={cn('h-3.5 w-3.5 transition-colors', selected ? 'text-accent-400' : 'text-border-strong group-hover:text-accent-400')} aria-hidden />
      </span>
    </button>
  )
}

const AlphaRankBoard: React.FC<{
  items: AlphaRankItem[]
  selectedStock: string | null
  onSelect: (symbol: string) => void
}> = ({ items, selectedStock, onSelect }) => {
  const { t } = useTranslation()

  if (!items.length) {
    return (
      <EmptyState
        icon={<ListOrdered className="h-4 w-4" />}
        title={t('alpharank.empty')}
        description={t('alpharank.emptyHint')}
      />
    )
  }

  return (
    <div className="min-w-0">
      <div className="sticky top-0 z-[1] grid min-h-11 grid-cols-[2rem_minmax(0,1fr)_5rem_1rem] items-center gap-3 border-b border-border bg-surface-raised px-4 text-2xs font-medium text-text-muted sm:px-5">
        <span className="text-center">{t('alpharank.rank')}</span>
        <span>{t('alpharank.ticker')}</span>
        <Tooltip content={t('alpharank.scoreHint')}>
          <button
            type="button"
            className="pl-button min-h-8 cursor-help rounded-sm text-right focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
            aria-label={t('alpharank.metricHelp', {
              metric: t('alpharank.score'),
              explanation: t('alpharank.scoreHint'),
            })}
          >
            {t('alpharank.score')}
          </button>
        </Tooltip>
      </div>
      {items.map(item => (
        <AlphaRankRow
          key={item.symbol}
          item={item}
          selected={selectedStock === item.symbol}
          onSelect={() => onSelect(item.symbol)}
        />
      ))}
    </div>
  )
}

const PivotEventRow: React.FC<{
  pick: PivotPick
  position: number
  selected: boolean
  onSelect: () => void
}> = ({ pick, position, selected, onSelect }) => {
  const { t } = useTranslation()
  const isLong = pick.direction === 'long'

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={t('picks.rowAria', {
        rank: position,
        symbol: pick.symbol,
        confidence: `${(pick.confidence * 100).toFixed(0)}%`,
      })}
      className={cn(
        'relative grid min-h-18 w-full grid-cols-[1.5rem_minmax(0,1fr)_4.5rem] items-center gap-2 border-t border-border px-1.5 py-3 text-left transition-colors first:border-t-0',
        selected
          ? 'bg-accent-soft before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:bg-accent-500'
          : 'hover:bg-surface-raised',
      )}
    >
      <span className="num text-center text-xs text-text-muted">{position}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-text-primary">{pick.symbol}</span>
        <span className="mt-1 block text-2xs leading-4 text-text-muted">{t(`picks.events.${pick.event}`)}</span>
      </span>
      <span className="min-w-0 text-right">
        <span className={cn('num block text-sm font-semibold', isLong ? 'text-bull' : 'text-bear')}>
          {(pick.confidence * 100).toFixed(0)}%
        </span>
        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-surface-strong">
          <span
            className={cn('block h-full rounded-full', isLong ? 'bg-bull-vivid' : 'bg-bear-vivid')}
            style={{ width: `${Math.max(0, Math.min(100, pick.confidence * 100))}%` }}
          />
        </span>
      </span>
    </button>
  )
}

const PivotColumnHeader: React.FC = () => {
  const { t } = useTranslation()
  return (
    <div className="grid min-h-9 grid-cols-[1.5rem_minmax(0,1fr)_4.5rem] items-center gap-2 border-t border-border px-1.5 text-2xs font-medium text-text-muted">
      <span className="text-center">{t('picks.rank')}</span>
      <span>{t('picks.symbol')}</span>
      <span className="text-right">{t('picks.confidence')}</span>
    </div>
  )
}

const ModelHeader: React.FC<{
  source: SignalSource
  description: string
  count?: number
  countLabel?: string
  onInfo: () => void
}> = ({ source, description, count, countLabel, onInfo }) => {
  const { t } = useTranslation()
  const alpha = source === 'alpharank'
  const title = t(alpha ? 'alpharank.title' : 'picks.streamTitle')
  return (
    <header className="shrink-0 border-b border-border p-4 sm:px-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-400" aria-hidden>
          {alpha ? <ListOrdered className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-2xs font-medium text-text-muted">{t(alpha ? 'alpharank.eyebrow' : 'picks.pulseEyebrow')}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <h2 id={alpha ? 'alpharank-heading' : 'pivot-heading'} className="text-xl font-bold tracking-[-0.03em] text-text-primary">{title}</h2>
            {count !== undefined ? <span className="num rounded-full bg-surface-sunken px-2 py-0.5 text-2xs text-text-secondary" aria-label={countLabel} title={countLabel}>{count}</span> : null}
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={onInfo} aria-label={t('dashboard.modelInfo.open', { model: title })}>
            <Info className="h-4 w-4 text-text-muted" />
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-text-secondary">{description}</p>
    </header>
  )
}

const ModelInfoContent: React.FC<{ model: SignalSource }> = ({ model }) => {
  const { t } = useTranslation()
  const prefix = `dashboard.modelInfo.${model}`

  return (
    <div className="space-y-5 text-sm leading-6 text-text-secondary">
      <p>{t(`${prefix}.summary`)}</p>
      <section className="border-t border-border pt-4">
        <h3 className="mb-1.5 font-semibold text-text-primary">
          {t('dashboard.modelInfo.bestFor')}
        </h3>
        <p>{t(`${prefix}.bestFor`)}</p>
      </section>
      <section className="border-t border-border pt-4">
        <h3 className="mb-1.5 font-semibold text-text-primary">
          {t('dashboard.modelInfo.howToRead')}
        </h3>
        <p>{t(`${prefix}.howToRead`)}</p>
      </section>
      <section className="border-t border-border pt-4">
        <h3 className="mb-1.5 font-semibold text-text-primary">
          {t('dashboard.modelInfo.limits')}
        </h3>
        <p>{t(`${prefix}.limits`)}</p>
      </section>
      <p className="border-l-2 border-border-strong pl-3 text-xs leading-5 text-text-muted">
        {t('dashboard.modelInfo.disclaimer')}
      </p>
    </div>
  )
}

const DashboardPage: React.FC = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [signalsResponse, setSignalsResponse] = useState<SignalsResponse | null>(null)
  const [selectedStock, setSelectedStock] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState<SignalSource | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [mobileWorkspace, setMobileWorkspace] = useState<MobileWorkspace>('alpharank')
  const [showInspector, setShowInspector] = useState(false)
  const [modelInfo, setModelInfo] = useState<SignalSource | null>(null)

  const signalsCacheRef = useRef<Map<string, CacheEntry<SignalsResponse>>>(new Map())
  const signalsRequestsRef = useRef<Map<string, Promise<SignalsResponse>>>(new Map())
  const datesCacheRef = useRef<CacheEntry<SignalsDatesResponse> | null>(null)
  const datesRequestRef = useRef<Promise<SignalsDatesResponse> | null>(null)
  const signalsRequestGenerationRef = useRef(0)
  const loadedSignalsKeyRef = useRef<string | null>(null)

  const getSignalsCached = useCallback((date?: string, force = false): Promise<SignalsResponse> => {
    const key = `${MARKET}:${date ?? 'latest'}`
    const cached = signalsCacheRef.current.get(key)
    if (!force && cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return Promise.resolve(cached.data)
    }

    const pending = signalsRequestsRef.current.get(key)
    if (pending) return pending

    const request = (date ? api.getSignalsByDate(date, MARKET) : api.getLatestSignals(MARKET))
      .then(data => {
        const entry = { data, ts: Date.now() }
        signalsCacheRef.current.set(key, entry)
        signalsCacheRef.current.set(`${MARKET}:${data.date}`, entry)
        return data
      })
      .finally(() => signalsRequestsRef.current.delete(key))
    signalsRequestsRef.current.set(key, request)
    return request
  }, [])

  const getSignalDatesCached = useCallback((): Promise<SignalsDatesResponse> => {
    const cached = datesCacheRef.current
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return Promise.resolve(cached.data)
    }
    if (datesRequestRef.current) return datesRequestRef.current

    const request = api
      .getSignalsDates(MARKET)
      .then(data => {
        datesCacheRef.current = { data, ts: Date.now() }
        return data
      })
      .finally(() => {
        datesRequestRef.current = null
      })
    datesRequestRef.current = request
    return request
  }, [])

  const loadSignals = useCallback(
    async (date?: string, force = false) => {
      const generation = ++signalsRequestGenerationRef.current
      const requestKey = date ?? 'latest'
      if (loadedSignalsKeyRef.current !== requestKey) {
        loadedSignalsKeyRef.current = null
        setSignalsResponse(null)
      }
      try {
        setLoading(true)
        setError(null)
        const response = await getSignalsCached(date, force)
        if (generation !== signalsRequestGenerationRef.current) return
        loadedSignalsKeyRef.current = requestKey
        setSignalsResponse(response)
      } catch (err) {
        if (generation !== signalsRequestGenerationRef.current) return
        setError(t('dashboard.errorLoadingSignals'))
        // eslint-disable-next-line no-console
        console.error('Error fetching combined signals:', err)
      } finally {
        if (generation === signalsRequestGenerationRef.current) setLoading(false)
      }
    },
    [getSignalsCached, t],
  )

  useEffect(() => {
    loadSignals(selectedDate ?? undefined)
  }, [loadSignals, selectedDate])

  useEffect(() => {
    let cancelled = false
    getSignalDatesCached()
      .then(response => {
        if (!cancelled) setAvailableDates(new Set(response.dates))
      })
      // eslint-disable-next-line no-console
      .catch(err => console.error('Error fetching signal dates:', err))
    return () => {
      cancelled = true
    }
  }, [getSignalDatesCached])

  useEffect(
    () => () => {
      signalsRequestGenerationRef.current += 1
    },
    [],
  )

  useEffect(() => {
    if (!signalsResponse) return

    const inAlphaRank = signalsResponse.alpharank?.items.some(item => item.symbol === selectedStock) ?? false
    const pivotItems = [
      ...(signalsResponse.pivot?.longs ?? []),
      ...(signalsResponse.pivot?.shorts ?? []),
    ]
    const inPivot = pivotItems.some(item => item.symbol === selectedStock)
    const firstAlpha = signalsResponse.alpharank?.items[0]

    if (!selectedStock || (!inAlphaRank && !inPivot)) {
      if (firstAlpha) {
        setSelectedStock(firstAlpha.symbol)
        setSelectedSource('alpharank')
      } else {
        setSelectedStock(null)
        setSelectedSource(null)
      }
      setShowInspector(false)
    } else if (selectedSource === 'alpharank' && !inAlphaRank && inPivot) {
      setSelectedSource('pivot')
    } else if (selectedSource === 'pivot' && !inPivot && inAlphaRank) {
      setSelectedSource('alpharank')
    }
  }, [selectedSource, selectedStock, signalsResponse])

  const handleSymbolSelect = (symbol: string, source: SignalSource) => {
    setSelectedStock(symbol)
    setSelectedSource(source)
    setShowInspector(true)
  }

  const handleDateSelect = (date: string) => {
    if (date === selectedDate) return
    signalsRequestGenerationRef.current += 1
    loadedSignalsKeyRef.current = null
    setSignalsResponse(null)
    setLoading(true)
    setError(null)
    setShowInspector(false)
    setSelectedDate(date)
  }

  const handleClearDate = () => {
    signalsRequestGenerationRef.current += 1
    loadedSignalsKeyRef.current = null
    setSignalsResponse(null)
    setLoading(true)
    setError(null)
    setShowInspector(false)
    setSelectedDate(null)
  }

  const handleRetry = () => loadSignals(selectedDate ?? undefined, true)

  const handleUpgrade = () => {
    const params = new URLSearchParams()
    params.set('upgrade', 'true')
    if (new URLSearchParams(location.search).get('mock') === 'true') {
      params.set('mock', 'true')
    }
    navigate({ pathname: '/profile', search: params.toString() })
  }

  if (loading && !signalsResponse) {
    return (
      <Page className="xl:h-full xl:min-h-[36rem] xl:gap-5 xl:pb-6">
        <PageHeader
          title={t('dashboard.title')}
          date={selectedDate ? formatDay(selectedDate) : undefined}
          subtitle={t('dashboard.subtitle')}
        />
        <Skeleton className="h-14 shrink-0 rounded-lg" />
        <div className="grid gap-5 xl:min-h-0 xl:flex-1 xl:grid-cols-2">
          <Skeleton className="h-80 rounded-lg xl:h-full xl:min-h-0" />
          <Skeleton className="hidden rounded-lg xl:block xl:h-full xl:min-h-0" />
        </div>
      </Page>
    )
  }

  const alphaPublication = signalsResponse?.alpharank ?? null
  const pivotPublication = signalsResponse?.pivot ?? null
  const alphaItems = alphaPublication?.items.slice(0, ALPHARANK_LIMIT) ?? []
  const bullish = pivotPublication?.longs ?? []
  const bearish = pivotPublication?.shorts ?? []
  const inspectableStock = signalsResponse ? selectedStock : null
  const latestAvailableDate = [...availableDates].sort().pop()
  const responseDate = signalsResponse?.date
  const displayDate = selectedDate
    ? formatDay(selectedDate)
    : responseDate
      ? formatDay(responseDate)
      : undefined
  const alphaSubtitle = !alphaPublication
    ? t('alpharank.unavailableSubtitle')
    : alphaPublication.horizon === null
      ? t('alpharank.emptySubtitle')
      : t('alpharank.subtitle', { horizon: alphaPublication.horizon })

  return (
    <Page className="xl:h-full xl:min-h-[36rem] xl:gap-5 xl:pb-6">
      <PageHeader
        title={t('dashboard.title')}
        date={displayDate}
        subtitle={t('dashboard.subtitle')}
        actions={
          <>
            {selectedDate ? (
              <Button type="button" variant="ghost" onClick={handleClearDate}>
                {t('common.clear')}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowDatePicker(true)}
              leftIcon={<CalendarDays className="h-4 w-4" />}
            >
              {t('stocks.selectDate')}
            </Button>
          </>
        }
      />

      {error ? (
        <Alert
          tone="error"
          title={error}
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRetry}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              {t('common.retry')}
            </Button>
          }
        />
      ) : null}

      <div className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-surface px-4 py-3 text-xs text-text-secondary sm:px-5">
        <span className="mr-2 inline-flex items-center gap-2 font-semibold text-text-primary"><span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden />{t('dashboard.sessionRibbon')}</span>
        <span className="inline-flex items-center">
          <span className={alphaPublication ? 'text-text-secondary' : 'text-text-muted'}>
            {alphaPublication
              ? t('dashboard.alphaCount', { count: alphaPublication.total_count })
              : t('dashboard.alphaUnavailable')}
          </span>
        </span>
        <span className="inline-flex items-center">
          <span className={pivotPublication ? 'text-text-secondary' : 'text-text-muted'}>
            {pivotPublication
              ? t('dashboard.pivotRibbon', { bullish: bullish.length, bearish: bearish.length })
              : t('dashboard.pivotUnavailable')}
          </span>
        </span>
        {loading ? (
          <span className="inline-flex items-center">
            <span className="mx-3 h-4 w-px bg-border" aria-hidden />
            <span className="animate-pulse text-accent-400">{t('common.loading')}</span>
          </span>
        ) : null}
        {user?.role === 'free' && !user.has_premium_access ? (
          <div className="flex w-full items-center justify-between gap-2 border-t border-border pt-2 sm:ml-auto sm:w-auto sm:border-0 sm:pt-0 sm:pl-2">
            <span className="text-xs text-text-muted">
              {t('dashboard.upgradePrompt')}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleUpgrade}
              leftIcon={<Crown className="h-3.5 w-3.5" />}
            >
              {t('dashboard.upgradeAction')}
            </Button>
          </div>
        ) : null}
      </div>

      <Tabs
        fullWidth
        value={mobileWorkspace}
        onChange={setMobileWorkspace}
        aria-label={t('dashboard.mobileWorkspace')}
        className="sticky top-0 z-[var(--z-sticky)] bg-app py-2 xl:hidden"
        items={[
          {
            value: 'alpharank' as const,
            label: t('alpharank.title'),
            icon: <ListOrdered className="h-3.5 w-3.5" />,
            count: alphaPublication ? alphaItems.length : undefined,
          },
          {
            value: 'pivot' as const,
            label: t('picks.streamTitle'),
            icon: <Zap className="h-3.5 w-3.5" />,
            count: pivotPublication?.total_count,
          },
        ]}
      />

      <div className="grid min-w-0 items-start gap-5 xl:min-h-80 xl:flex-1 xl:grid-cols-2 xl:items-stretch">
        <section
          aria-labelledby="alpharank-heading"
          className={cn(
            'min-w-0 overflow-hidden rounded-lg border border-border bg-surface shadow-sm xl:flex xl:min-h-0 xl:flex-col',
            mobileWorkspace === 'alpharank' ? 'block' : 'hidden xl:flex',
          )}
        >
          <ModelHeader
            source="alpharank"
            description={alphaPublication && alphaItems.length ? t('alpharank.thesisDescription') : alphaSubtitle}
            count={alphaPublication ? alphaItems.length : undefined}
            countLabel={t('alpharank.topCount', { count: alphaItems.length })}
            onInfo={() => setModelInfo('alpharank')}
          />
          <div className="custom-scrollbar bg-surface xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
            {alphaPublication ? (
              <AlphaRankBoard
                items={alphaItems}
                selectedStock={selectedSource === 'alpharank' ? selectedStock : null}
                onSelect={symbol => handleSymbolSelect(symbol, 'alpharank')}
              />
            ) : (
              <EmptyState
                className="min-h-72 xl:min-h-full"
                icon={<AlertCircle className="h-4 w-4" />}
                title={t('alpharank.unavailable')}
                description={t('alpharank.unavailableHint')}
              />
            )}
          </div>
          <p className="shrink-0 border-t border-border bg-surface-raised px-4 py-3 text-2xs leading-5 text-text-muted sm:px-5">{t('dashboard.chartHint')}</p>
        </section>

        <section
          aria-labelledby="pivot-heading"
          className={cn(
            'min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm xl:min-h-0',
            mobileWorkspace === 'pivot' ? 'flex' : 'hidden xl:flex',
          )}
        >
          <ModelHeader
            source="pivot"
            description={pivotPublication ? t('picks.streamSubtitle') : t('picks.unavailableSubtitle')}
            count={pivotPublication?.total_count}
            countLabel={t('dashboard.pivotCount', { count: pivotPublication?.total_count ?? 0 })}
            onInfo={() => setModelInfo('pivot')}
          />
          {!pivotPublication ? (
            <div className="flex min-h-48 items-center justify-center bg-surface px-5 py-6 xl:min-h-0 xl:flex-1">
              <EmptyState
                icon={<AlertCircle className="h-4 w-4" />}
                title={t('picks.unavailable')}
                description={t('picks.unavailableHint')}
                size="sm"
              />
            </div>
          ) : (
            <div className="custom-scrollbar grid divide-y divide-border overflow-y-auto bg-surface sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:min-h-0 xl:flex-1">
              <div className="min-w-0 px-3 py-4 sm:px-4 xl:py-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-bull">
                    <TrendingUp className="h-4 w-4" aria-hidden />
                    {t('picks.bullish')}
                  </h3>
                  <span className="num flex h-6 min-w-6 items-center justify-center rounded-full bg-bull-soft px-1.5 text-xs text-bull">{bullish.length}</span>
                </div>
                <PivotColumnHeader />
                {bullish.length ? (
                  bullish.map((pick, index) => (
                    <PivotEventRow
                      key={`${pick.symbol}-${pick.event}`}
                      pick={pick}
                      position={index + 1}
                      selected={selectedSource === 'pivot' && selectedStock === pick.symbol}
                      onSelect={() => handleSymbolSelect(pick.symbol, 'pivot')}
                    />
                  ))
                ) : (
                  <p className="border-t border-border py-5 text-xs leading-5 text-text-muted">
                    {t('picks.noBullish')}
                  </p>
                )}
              </div>
              <div className="min-w-0 px-3 py-4 sm:px-4 xl:py-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-bear">
                    <TrendingDown className="h-4 w-4" aria-hidden />
                    {t('picks.bearish')}
                  </h3>
                  <span className="num flex h-6 min-w-6 items-center justify-center rounded-full bg-bear-soft px-1.5 text-xs text-bear">{bearish.length}</span>
                </div>
                <PivotColumnHeader />
                {bearish.length ? (
                  bearish.map((pick, index) => (
                    <PivotEventRow
                      key={`${pick.symbol}-${pick.event}`}
                      pick={pick}
                      position={index + 1}
                      selected={selectedSource === 'pivot' && selectedStock === pick.symbol}
                      onSelect={() => handleSymbolSelect(pick.symbol, 'pivot')}
                    />
                  ))
                ) : (
                  <p className="border-t border-border py-5 text-xs leading-5 text-text-muted">
                    {t('picks.noBearish')}
                  </p>
                )}
              </div>
            </div>
          )}
          <p className="shrink-0 border-t border-border bg-surface-raised px-4 py-3 text-2xs leading-5 text-text-muted sm:px-5">{t('dashboard.chartHint')}</p>
        </section>
      </div>

      <DatePickerModal
        open={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={selectedDate}
        initialDate={latestAvailableDate}
        onSelect={handleDateSelect}
        onClear={handleClearDate}
        isDateEnabled={date => availableDates.has(date)}
        hint={t('stocks.dateHint')}
      />

      <Modal
        open={modelInfo !== null}
        onClose={() => setModelInfo(null)}
        title={
          modelInfo === 'alpharank'
            ? t('dashboard.modelInfo.alpharank.title')
            : t('dashboard.modelInfo.pivot.title')
        }
        icon={<Info className="h-4 w-4" />}
        size="lg"
      >
        {modelInfo ? <ModelInfoContent model={modelInfo} /> : null}
      </Modal>

      <TickerChartDrawer
        symbol={showInspector ? inspectableStock : null}
        onClose={() => setShowInspector(false)}
        backtestModel={selectedSource ?? 'pivot'}
      />
    </Page>
  )
}

export default DashboardPage

import { Activity, AlertCircle, LineChart } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import CandlestickChart from '@/components/CandlestickChart'
import type { ChartPeriod } from '@/components/chartPeriods'
import { Button, EmptyState, Modal, Skeleton } from '@/components/ui'
import { api } from '@/services/apiAdapter'
import type { AlphaRankItem, PivotPick, SignalData, StockData } from '@/types'
import { cn, isIndexSymbol } from '@/utils'

const CACHE_TTL_MS = 5 * 60 * 1000
const MARKET = 'us'
const HISTORY_LIMIT = 250

export type TickerSignalModel = 'alpharank' | 'pivot'

type CacheEntry<T> = { data: T; ts: number }

// Shared across every page so reopening a ticker elsewhere is instant.
const stockDataCache = new Map<string, CacheEntry<StockData[]>>()
const pivotHistoryCache = new Map<string, CacheEntry<PivotPick[]>>()
const alphaHistoryCache = new Map<string, CacheEntry<AlphaRankItem[]>>()

const fresh = <T,>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> =>
  Boolean(entry && Date.now() - entry.ts < CACHE_TTL_MS)

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const handleViewportChange = () => setIsDesktop(desktop.matches)
    handleViewportChange()
    desktop.addEventListener('change', handleViewportChange)
    return () => desktop.removeEventListener('change', handleViewportChange)
  }, [])
  return isDesktop
}

interface TickerChartDrawerProps {
  /** Ticker to inspect; `null` keeps the drawer closed. */
  symbol: string | null
  onClose: () => void
  /** Model preselected on the backtest page. */
  backtestModel?: TickerSignalModel
}

/**
 * Price history with AlphaRank and Pivot signal markers for non-index tickers.
 * Right drawer on desktop, bottom sheet on phones.
 */
const TickerChartDrawer: React.FC<TickerChartDrawerProps> = ({
  symbol,
  onClose,
  backtestModel = 'pivot',
}) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const isIndex = isIndexSymbol(symbol ?? '')

  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('3M')
  const [stockData, setStockData] = useState<StockData[]>([])
  const [chartLoading, setChartLoading] = useState(false)
  const [chartError, setChartError] = useState<string | null>(null)
  const [pivotHistory, setPivotHistory] = useState<PivotPick[]>([])
  const [alphaHistory, setAlphaHistory] = useState<AlphaRankItem[]>([])

  useEffect(() => {
    if (!symbol) return
    let cancelled = false
    const cacheKey = `${symbol}_${chartPeriod}`
    const cached = stockDataCache.get(cacheKey)
    if (fresh(cached)) {
      setStockData(cached.data)
      setChartError(null)
      setChartLoading(false)
      return
    }

    setStockData([])
    setChartLoading(true)
    setChartError(null)
    api
      .getStockData(symbol, undefined, undefined, chartPeriod.toLowerCase())
      .then(response => {
        if (cancelled) return
        stockDataCache.set(cacheKey, { data: response.data, ts: Date.now() })
        setStockData(response.data)
      })
      .catch(err => {
        if (cancelled) return
        setChartError(t('dashboard.errorLoadingChart'))
        // eslint-disable-next-line no-console
        console.error('Error fetching stock data:', err)
      })
      .finally(() => {
        if (!cancelled) setChartLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [symbol, chartPeriod, t])

  useEffect(() => {
    if (!symbol || isIndex) {
      setPivotHistory([])
      setAlphaHistory([])
      return
    }
    let cancelled = false
    const pivotCached = pivotHistoryCache.get(symbol)
    const alphaCached = alphaHistoryCache.get(symbol)
    setPivotHistory(fresh(pivotCached) ? pivotCached.data : [])
    setAlphaHistory(fresh(alphaCached) ? alphaCached.data : [])

    if (!fresh(pivotCached)) {
      api
        .getPivotSymbolHistory(symbol, MARKET, HISTORY_LIMIT)
        .then(response => {
          if (cancelled) return
          pivotHistoryCache.set(symbol, { data: response.items, ts: Date.now() })
          setPivotHistory(response.items)
        })
        .catch(() => {
          if (!cancelled) setPivotHistory([])
        })
    }
    if (!fresh(alphaCached)) {
      api
        .getAlphaRankTickerHistory(symbol, MARKET, HISTORY_LIMIT)
        .then(response => {
          if (cancelled) return
          alphaHistoryCache.set(symbol, { data: response.items, ts: Date.now() })
          setAlphaHistory(response.items)
        })
        .catch(() => {
          if (!cancelled) setAlphaHistory([])
        })
    }
    return () => {
      cancelled = true
    }
  }, [symbol, isIndex])

  const chartSignals: SignalData[] = useMemo(
    () =>
      [
        ...pivotHistory.map(pick => ({
          date: pick.date,
          signal: pick.direction === 'short' ? ('falling' as const) : ('rising' as const),
          model: 'pivot' as const,
        })),
        ...alphaHistory.map(item => ({
          date: item.date,
          signal: 'rising' as const,
          model: 'alpharank' as const,
        })),
      ].sort((left, right) => {
        const dateOrder = left.date.split('T')[0].localeCompare(right.date.split('T')[0])
        return dateOrder || (left.model === right.model ? 0 : left.model === 'pivot' ? -1 : 1)
      }),
    [alphaHistory, pivotHistory],
  )

  const handleBacktest = () => {
    if (!symbol || isIndex) return
    const params = new URLSearchParams(location.search)
    params.set('ticker', symbol)
    params.set('model', backtestModel)
    params.delete('symbol')
    onClose()
    navigate({ pathname: '/backtest', search: params.toString() })
  }

  const renderChart = (mobile: boolean) => {
    if (chartLoading) {
      return mobile ? <Skeleton height={260} /> : <Skeleton className="h-full min-h-0" />
    }
    if (chartError) {
      return (
        <EmptyState
          tone="error"
          icon={<AlertCircle className="h-4 w-4" />}
          title={chartError}
          size={mobile ? 'sm' : 'md'}
        />
      )
    }
    if (!stockData.length) {
      return (
        <EmptyState
          className={mobile ? undefined : 'm-auto'}
          icon={<LineChart className="h-4 w-4" />}
          title={t('stocks.noDataAvailable')}
          description={t('stocks.noBarsHint')}
          size={mobile ? 'sm' : 'md'}
        />
      )
    }
    return (
      <CandlestickChart
        data={stockData}
        symbol={symbol ?? ''}
        period={chartPeriod}
        onPeriodChange={setChartPeriod}
        isMobile={mobile}
        fill={!mobile}
        signals={isIndex ? undefined : chartSignals}
        showSignalLegend={!isIndex}
      />
    )
  }

  return (
    <Modal
      open={Boolean(symbol)}
      onClose={onClose}
      title={symbol ?? ''}
      icon={<LineChart className="h-4 w-4" />}
      size="lg"
      presentation={isDesktop ? 'right-drawer' : 'dialog'}
      bodyClassName={isDesktop ? 'flex flex-col overflow-hidden' : undefined}
      footer={
        !isIndex ? (
          <Button
            fullWidth
            variant="secondary"
            onClick={handleBacktest}
            leftIcon={<Activity className="h-4 w-4" />}
          >
            {t('stocks.backtest')}
          </Button>
        ) : undefined
      }
    >
      <p className="sr-only" aria-live="polite">
        {t('dashboard.chartSummary', { symbol, period: chartPeriod })}
      </p>
      <div className={cn(isDesktop && 'min-h-0 flex-1')}>{renderChart(!isDesktop)}</div>
    </Modal>
  )
}

export default TickerChartDrawer

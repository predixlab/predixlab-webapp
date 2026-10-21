import {
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
} from 'lightweight-charts'
import type {
  CandlestickData,
  CandlestickStyleOptions,
  ChartOptions,
  DeepPartial,
  HistogramData,
  HistogramStyleOptions,
  IChartApi,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  LineData,
  SeriesMarker,
  Time,
} from 'lightweight-charts'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { chartPeriodItems, type ChartPeriod } from '@/components/chartPeriods'
import { Tabs } from '@/components/ui'
import { SignalData, StockData } from '@/types'
import { cn } from '@/utils'


interface CandlestickChartProps {
  data: StockData[]
  symbol: string
  period: ChartPeriod
  onPeriodChange: (period: ChartPeriod) => void
  isMobile?: boolean
  signals?: SignalData[]
  showSignalLegend?: boolean
  shouldShowPeriod?: boolean
  showSymbol?: boolean
  /** Grows to fill the parent instead of using a fixed height. */
  fill?: boolean
  className?: string
}

interface ChartTheme {
  background: string
  text: string
  grid: string
  border: string
  bull: string
  bear: string
  accent: string
  volumeBull: string
  volumeBear: string
  ma: string[]
}

type CandlestickColorOptions = Pick<
  CandlestickStyleOptions,
  'borderDownColor' | 'borderUpColor' | 'downColor' | 'upColor' | 'wickDownColor' | 'wickUpColor'
>

type HistogramColorOptions = Pick<HistogramStyleOptions, 'color'>

const css = (name: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

const withOpacity = (color: string, opacity: number) => {
  const normalized = color.trim()
  const hex = normalized.replace('#', '')

  if (/^[\da-f]{3}$/i.test(hex)) {
    const [r, g, b] = hex.split('').map(value => parseInt(`${value}${value}`, 16))
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  if (/^[\da-f]{6}$/i.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  if (/^rgb\(/i.test(normalized)) {
    return normalized.replace(/^rgb\((.*)\)$/i, `rgba($1, ${opacity})`)
  }
  if (/^rgba\(/i.test(normalized)) {
    return normalized.replace(/^rgba\((.*),\s*[\d.]+\)$/i, `rgba($1, ${opacity})`)
  }
  return normalized
}

const getChartTheme = (): ChartTheme => {
  const bull = css('--pl-bull-vivid', '#089981')
  const bear = css('--pl-bear-vivid', '#f23645')

  return {
    background: css('--pl-surface', '#ffffff'),
    text: css('--pl-text-muted', '#656b76'),
    grid: css('--pl-border', '#e0e3eb'),
    border: css('--pl-border', '#e0e3eb'),
    bull,
    bear,
    accent: css('--pl-accent-500', '#2962ff'),
    volumeBull: withOpacity(bull, 0.32),
    volumeBear: withOpacity(bear, 0.32),
    ma: [
      css('--pl-accent-500', '#2962ff'),
      css('--pl-warn-vivid', '#f5a623'),
      css('--pl-info-vivid', '#2196f3'),
      css('--pl-text-muted', '#656b76'),
    ],
  }
}

const getChartAppearanceOptions = (theme: ChartTheme): DeepPartial<ChartOptions> => ({
  layout: {
    background: { type: ColorType.Solid, color: theme.background },
    textColor: theme.text,
    fontFamily: "'Manrope', system-ui, sans-serif",
    fontSize: 11,
    attributionLogo: false,
  },
  grid: {
    vertLines: { visible: false },
    horzLines: { color: theme.grid, style: 1 },
  },
  crosshair: {
    mode: CrosshairMode.Magnet,
    vertLine: {
      color: theme.accent,
      width: 1,
      style: 3,
      labelBackgroundColor: theme.accent,
    },
    horzLine: {
      color: theme.accent,
      width: 1,
      style: 3,
      labelBackgroundColor: theme.accent,
    },
  },
  rightPriceScale: {
    borderColor: theme.border,
    borderVisible: true,
  },
  timeScale: {
    borderColor: theme.border,
    timeVisible: false,
    secondsVisible: false,
  },
  handleScale: { axisPressedMouseMove: { price: false } },
  handleScroll: { vertTouchDrag: false, horzTouchDrag: true },
})

const getCandlestickColorOptions = (theme: ChartTheme): CandlestickColorOptions => ({
  upColor: theme.bull,
  downColor: theme.bear,
  borderUpColor: theme.bull,
  borderDownColor: theme.bear,
  wickUpColor: theme.bull,
  wickDownColor: theme.bear,
})

const getHistogramColorOptions = (theme: ChartTheme): HistogramColorOptions => ({
  color: theme.volumeBull,
})

const createVolumeData = (data: StockData[], theme: ChartTheme): HistogramData<Time>[] => {
  const volumeData: HistogramData<Time>[] = []
  for (const item of data) {
    const date = new Date(item.date)
    if (isNaN(date.getTime())) continue
    const isUp = Number(item.close) >= Number(item.open)
    volumeData.push({
      time: item.date.split('T')[0] as Time,
      value: Number(item.volume),
      color: isUp ? theme.volumeBull : theme.volumeBear,
    })
  }
  return volumeData.sort((a, b) => String(a.time).localeCompare(String(b.time)))
}

/**
 * Markers outside the loaded range are not dropped by lightweight-charts, they
 * are clamped onto the first bar. On a 3M window a decade of signals would pile
 * up against the left axis, so the range does the filtering here.
 */
const createSignalMarkers = (
  signals: SignalData[],
  data: StockData[],
  theme: ChartTheme,
): SeriesMarker<Time>[] => {
  if (!data.length) return []
  const days = data.map(item => item.date.split('T')[0])
  const first = days.reduce((min, day) => (day < min ? day : min), days[0])
  const last = days.reduce((max, day) => (day > max ? day : max), days[0])

  return signals
    .map(signal => ({ ...signal, day: signal.date.split('T')[0] }))
    .filter(signal => signal.day >= first && signal.day <= last)
    .map(signal =>
      signal.model === 'alpharank'
        ? {
            time: signal.day as Time,
            position: 'belowBar' as const,
            color: theme.accent,
            shape: 'circle' as const,
            text: 'A',
          }
        : {
            time: signal.day as Time,
            position: signal.signal === 'rising' ? ('belowBar' as const) : ('aboveBar' as const),
            color: signal.signal === 'rising' ? theme.bull : theme.bear,
            shape: signal.signal === 'rising' ? ('arrowUp' as const) : ('arrowDown' as const),
            text: '',
          },
    )
}

const MA_PERIODS = [5, 20, 30, 60]

const createMaConfigs = (theme: ChartTheme) =>
  MA_PERIODS.map((period, index) => ({ period, color: theme.ma[index] ?? theme.text }))

/**
 * Price, volume and moving averages in one pane, plus the signal markers that
 * make this app's picks checkable against the tape.
 */
const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  symbol,
  period,
  onPeriodChange,
  isMobile = false,
  signals = [],
  showSignalLegend = true,
  shouldShowPeriod = true,
  showSymbol = true,
  fill = false,
  className,
}) => {
  const { t } = useTranslation()
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const maSeriesRefs = useRef<{ period: number; color: string; series: ISeriesApi<'Line'> }[]>([])
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null)
  const dataRef = useRef(data)
  const signalsRef = useRef(signals)
  const [maLegend, setMaLegend] = useState<{ period: number; color: string; value: number | null }[]>(
    [],
  )
  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    signalsRef.current = signals
  }, [signals])

  useEffect(() => {
    const container = chartContainerRef.current
    if (!container) return

    const theme = getChartTheme()
    const chart = createChart(container, {
      ...getChartAppearanceOptions(theme),
      width: container.clientWidth,
      height: container.clientHeight || 320,
    })
    chartRef.current = chart

    const candlestickSeries = chart.addSeries(CandlestickSeries, getCandlestickColorOptions(theme))
    seriesRef.current = candlestickSeries

    chart.priceScale('right').applyOptions({ scaleMargins: { top: 0.08, bottom: 0.26 } })

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: '',
      priceFormat: { type: 'volume' },
      ...getHistogramColorOptions(theme),
      base: 0,
    })
    chart.priceScale('').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })
    volumeSeriesRef.current = volumeSeries

    const maConfigs = createMaConfigs(theme)
    setMaLegend(maConfigs.map(c => ({ period: c.period, color: c.color, value: null })))
    maSeriesRefs.current = maConfigs.map(cfg => ({
      period: cfg.period,
      color: cfg.color,
      series: chart.addSeries(LineSeries, {
        color: cfg.color,
        lineWidth: 1,
        priceScaleId: 'right',
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
      }) as ISeriesApi<'Line'>,
    }))

    const applyTheme = () => {
      const nextTheme = getChartTheme()
      chart.applyOptions(getChartAppearanceOptions(nextTheme))
      candlestickSeries.applyOptions(getCandlestickColorOptions(nextTheme))
      volumeSeries.applyOptions(getHistogramColorOptions(nextTheme))
      const nextMaConfigs = createMaConfigs(nextTheme)
      maSeriesRefs.current = maSeriesRefs.current.map(item => {
        const nextConfig = nextMaConfigs.find(config => config.period === item.period)
        if (!nextConfig) return item
        item.series.applyOptions({ color: nextConfig.color })
        return { ...item, color: nextConfig.color }
      })
      setMaLegend(current =>
        current.map(item => {
          const nextConfig = nextMaConfigs.find(config => config.period === item.period)
          return nextConfig ? { ...item, color: nextConfig.color } : item
        }),
      )
      volumeSeries.setData(createVolumeData(dataRef.current, nextTheme))
      markersRef.current?.setMarkers(
        createSignalMarkers(signalsRef.current, dataRef.current, nextTheme),
      )
    }

    const themeObserver = new MutationObserver(applyTheme)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    // The chart is a canvas: it cannot reflow on its own, so the element's own
    // box drives its size rather than the window's.
    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width > 0) {
        chart.applyOptions({ width: Math.floor(width), height: Math.max(180, Math.floor(height)) })
      }
    })
    resizeObserver.observe(container)
    return () => {
      resizeObserver.disconnect()
      themeObserver.disconnect()
      markersRef.current?.detach()
      markersRef.current = null
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
      volumeSeriesRef.current = null
      maSeriesRefs.current = []
    }
  }, [])

  useEffect(() => {
    if (!seriesRef.current) return

    // An empty response has to clear the panes. Returning early here left the
    // previous symbol's (or the previous range's) bars on screen, which reads
    // as the range switch having done nothing.
    if (!data.length) {
      seriesRef.current.setData([])
      volumeSeriesRef.current?.setData([])
      maSeriesRefs.current.forEach(({ series }) => series.setData([]))
      markersRef.current?.setMarkers([])
      setMaLegend(current => current.map(item => ({ ...item, value: null })))
      return
    }

    try {
      const chartData: CandlestickData<Time>[] = data
        .map(item => {
          const date = new Date(item.date)
          if (isNaN(date.getTime())) return null
          return {
            time: item.date.split('T')[0] as Time,
            open: Number(item.open),
            high: Number(item.high),
            low: Number(item.low),
            close: Number(item.close),
          }
        })
        .filter((item): item is CandlestickData<Time> => item !== null)
        .sort((a, b) => String(a.time).localeCompare(String(b.time)))

      if (!chartData.length) return
      seriesRef.current.setData(chartData)
      volumeSeriesRef.current?.setData(createVolumeData(data, getChartTheme()))

      if (maSeriesRefs.current.length) {
        const closes = data
          .map(item => ({ time: item.date.split('T')[0] as Time, close: Number(item.close) }))
          .sort((a, b) => String(a.time).localeCompare(String(b.time)))

        const nextLegend: { period: number; color: string; value: number | null }[] = []
        for (const { period: maPeriod, color, series } of maSeriesRefs.current) {
          if (closes.length < maPeriod) {
            series.setData([])
            nextLegend.push({ period: maPeriod, color, value: null })
            continue
          }
          const sma: LineData<Time>[] = []
          let windowSum = 0
          for (let i = 0; i < closes.length; i++) {
            windowSum += closes[i].close
            if (i >= maPeriod) windowSum -= closes[i - maPeriod].close
            if (i >= maPeriod - 1) {
              sma.push({ time: closes[i].time, value: +(windowSum / maPeriod).toFixed(4) })
            }
          }
          series.setData(sma)
          nextLegend.push({ period: maPeriod, color, value: sma[sma.length - 1]?.value ?? null })
        }
        setMaLegend(nextLegend)
      }

      chartRef.current?.timeScale().fitContent()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error setting chart data:', error)
    }
  }, [data])

  useEffect(() => {
    if (!seriesRef.current) return
    const markers = createSignalMarkers(signals, data, getChartTheme())
    if (markersRef.current) {
      markersRef.current.setMarkers(markers)
    } else {
      markersRef.current = createSeriesMarkers(seriesRef.current, markers)
    }
  }, [signals, data])

  const periodItems = chartPeriodItems(t)

  return (
    <div className={cn('flex min-h-0 w-full flex-col', fill && 'h-full', className)}>
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {showSymbol && !isMobile && symbol ? (
            <span className="text-xs font-bold text-text-primary">{symbol}</span>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {maLegend.map(item => (
              <span key={item.period} className="num flex items-center gap-1.5 text-2xs leading-5 text-text-muted">
                <span
                  className="h-0.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden
                />
                MA{item.period} {item.value !== null ? item.value.toFixed(2) : '--'}
              </span>
            ))}
          </div>
        </div>
        {shouldShowPeriod ? (
          <Tabs
            size="sm"
            items={periodItems}
            value={period}
            onChange={onPeriodChange}
            aria-label={t('backtest.period')}
            className={cn(isMobile && 'w-full [&>[role=tablist]]:w-full [&_[role=tab]]:flex-1')}
          />
        ) : null}
      </div>

      {showSignalLegend && (
        <div
          className="mb-3 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 text-2xs text-text-muted"
          role="list"
          aria-label={t('chart.signalLegend.label')}
        >
          <span className="flex items-center gap-1.5" role="listitem">
            <span className="flex items-center gap-0.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-accent-500" />
              <span className="text-[9px] font-semibold text-accent-400">A</span>
            </span>
            {t('chart.signalLegend.alpharank')}
          </span>
          <span className="flex items-center gap-1.5" role="listitem">
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5 fill-bull-vivid"
              aria-hidden="true"
            >
              <path d="M1 8 8 1l7 7h-4v7H5V8H1Z" />
            </svg>
            {t('chart.signalLegend.pivotBullish')}
          </span>
          <span className="flex items-center gap-1.5" role="listitem">
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5 fill-bear-vivid"
              aria-hidden="true"
            >
              <path d="M1 8h4V1h6v7h4l-7 7-7-7Z" />
            </svg>
            {t('chart.signalLegend.pivotBearish')}
          </span>
        </div>
      )}

      <div
        ref={chartContainerRef}
        role="img"
        aria-label={t('dashboard.chartSummary', { symbol, period })}
        className={cn('chart-container w-full', fill ? 'min-h-0 flex-1' : isMobile ? 'h-72' : 'h-96')}
      />
    </div>
  )
}

export default CandlestickChart

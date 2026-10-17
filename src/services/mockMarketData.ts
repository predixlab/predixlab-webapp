/**
 * Deterministic mock data generators for the market intelligence APIs.
 *
 * Keeps `?mock=true` development mode functional for the market overview,
 * analysis, screener and watchlist features without a running backend.
 */

import {
  Alert,
  AlertCheckResponse,
  AlertCreateRequest,
  AlertListResponse,
  CorrelationResponse,
  HeatmapResponse,
  IndicatorSeriesResponse,
  IndicatorSnapshot,
  MarketBreadth,
  MarketOverviewResponse,
  MarketSentiment,
  MoverCategory,
  MoverEntry,
  MoversResponse,
  PeerComparisonResponse,
  PerformanceDistributionResponse,
  RiskMetrics,
  ScreenerMatch,
  ScreenerPresetsResponse,
  ScreenerRequest,
  ScreenerResponse,
  SeasonalityResponse,
  SymbolProfileResponse,
  SymbolQuote,
  TechnicalAnalysisResponse,
  TrendDirection,
  Watchlist,
  WatchlistListResponse,
  WatchlistQuotesResponse,
} from '@/types'

import { mockSymbols } from './mockData'

const TODAY = new Date().toISOString().slice(0, 10)

/** Stable pseudo-random number in [0, 1) derived from a string seed. */
const seededRandom = (seed: string, salt = 0): number => {
  let hash = 2166136261 ^ salt
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return ((hash >>> 0) % 100000) / 100000
}

const universe = (): string[] => (mockSymbols.length ? mockSymbols.slice(0, 40) : ['AAPL', 'MSFT', 'NVDA'])

const round = (value: number, digits = 4): number => Number(value.toFixed(digits))

export const mockQuote = (symbol: string): SymbolQuote => {
  const base = 40 + seededRandom(symbol) * 400
  const changePercent = (seededRandom(symbol, 1) - 0.5) * 0.08
  const volume = Math.round(500_000 + seededRandom(symbol, 2) * 20_000_000)
  return {
    symbol,
    date: TODAY,
    close: round(base, 2),
    open: round(base * (1 - changePercent / 2), 2),
    high: round(base * 1.012, 2),
    low: round(base * 0.988, 2),
    volume,
    change: round(base * changePercent, 2),
    change_percent: round(changePercent, 6),
    volume_ratio: round(0.4 + seededRandom(symbol, 3) * 2.6, 3),
    week52_high: round(base * 1.35, 2),
    week52_low: round(base * 0.62, 2),
  }
}

const mockMover = (symbol: string, metricName: string, metric: number): MoverEntry => ({
  ...mockQuote(symbol),
  metric: round(metric, 6),
  metric_name: metricName,
})

export const mockMovers = (category: MoverCategory, limit: number): MoversResponse => {
  const quotes = universe().map(mockQuote)
  const metricName = category === 'most_active'
    ? 'turnover'
    : category === 'unusual_volume'
      ? 'volume_ratio'
      : 'change_percent'
  const entries = quotes.map(quote =>
    mockMover(
      quote.symbol,
      metricName,
      metricName === 'turnover'
        ? (quote.close ?? 0) * (quote.volume ?? 0)
        : metricName === 'volume_ratio'
          ? quote.volume_ratio ?? 0
          : quote.change_percent ?? 0
    )
  ).sort((a, b) => {
    if (category === 'most_active') return (b.metric ?? 0) - (a.metric ?? 0)
    const ascending = category === 'losers' || category === 'gap_down' || category === 'new_low_52w'
    return ascending
      ? (a.metric ?? 0) - (b.metric ?? 0)
      : (b.metric ?? 0) - (a.metric ?? 0)
  }).slice(0, limit)
  return { category, date: TODAY, entries, total_count: entries.length }
}

export const mockBreadth = (): MarketBreadth => {
  const quotes = universe().map(mockQuote)
  const advancers = quotes.filter(q => (q.change_percent ?? 0) > 0).length
  const decliners = quotes.filter(q => (q.change_percent ?? 0) < 0).length
  const unchangedSymbols = quotes
    .filter(q => (q.change_percent ?? 0) === 0)
    .map(q => q.symbol)
  const changes = quotes.map(q => q.change_percent ?? 0)
  return {
    date: TODAY,
    total_symbols: quotes.length,
    advancers,
    decliners,
    unchanged: unchangedSymbols.length,
    unchanged_symbols: unchangedSymbols,
    advance_decline_ratio: decliners ? round(advancers / decliners, 4) : null,
    percent_advancing: round(advancers / quotes.length, 6),
    above_sma20_percent: round(0.3 + seededRandom('sma20') * 0.5, 6),
    above_sma50_percent: round(0.3 + seededRandom('sma50') * 0.5, 6),
    above_sma200_percent: round(0.3 + seededRandom('sma200') * 0.5, 6),
    new_highs_52w: Math.round(seededRandom('highs') * 12),
    new_lows_52w: Math.round(seededRandom('lows') * 8),
    average_change_percent: round(changes.reduce((a, b) => a + b, 0) / changes.length, 6),
    median_change_percent: round([...changes].sort((a, b) => a - b)[Math.floor(changes.length / 2)], 6),
    total_volume: quotes.reduce((sum, q) => sum + (q.volume ?? 0), 0),
  }
}

export const mockSentiment = (breadth: MarketBreadth): MarketSentiment => {
  const score = round(100 * (breadth.percent_advancing ?? 0.5), 2)
  const label: MarketSentiment['label'] =
    score >= 75 ? 'extreme_greed' : score >= 60 ? 'greed' : score >= 40 ? 'neutral' : score >= 25 ? 'fear' : 'extreme_fear'
  return {
    score,
    label,
    components: {
      advance_decline: {
        raw_value: breadth.percent_advancing ?? null,
        score,
        weight: 1,
      },
    },
    summary: `Mock sentiment: ${breadth.advancers} advancing vs ${breadth.decliners} declining.`,
  }
}

export const mockOverview = (moversLimit: number): MarketOverviewResponse => {
  const breadth = mockBreadth()
  return {
    date: TODAY,
    breadth,
    sentiment: mockSentiment(breadth),
    top_gainers: mockMovers('gainers', moversLimit).entries,
    top_losers: mockMovers('losers', moversLimit).entries,
    most_active: mockMovers('most_active', moversLimit).entries,
    generated_at: new Date().toISOString(),
  }
}

export const mockDistribution = (windowDays: number): PerformanceDistributionResponse => {
  const labels = ['< -10%', '-10% ~ -5%', '-5% ~ -2%', '-2% ~ 0%', '0% ~ 2%', '2% ~ 5%', '5% ~ 10%', '> 10%']
  const total = universe().length
  const counts = labels.map((label, index) => Math.round(seededRandom(label, index) * (total / 3)))
  const sum = counts.reduce((a, b) => a + b, 0) || 1
  return {
    date: TODAY,
    window_days: windowDays,
    total_symbols: sum,
    buckets: labels.map((label, index) => ({
      label,
      lower_bound: null,
      upper_bound: null,
      count: counts[index],
      percent: round(counts[index] / sum, 6),
    })),
  }
}

export const mockHeatmap = (windowDays: number, limit: number): HeatmapResponse => ({
  date: TODAY,
  window_days: windowDays,
  entries: universe()
    .slice(0, limit)
    .map(symbol => {
      const quote = mockQuote(symbol)
      return { symbol, change_percent: quote.change_percent, volume: quote.volume, close: quote.close }
    }),
})

const mockIndicatorValues = (symbol: string): Record<string, number | null> => {
  const quote = mockQuote(symbol)
  const close = quote.close ?? 100
  return {
    close,
    sma_20: round(close * (0.96 + seededRandom(symbol, 10) * 0.08), 4),
    sma_50: round(close * (0.94 + seededRandom(symbol, 11) * 0.1), 4),
    sma_200: round(close * (0.88 + seededRandom(symbol, 12) * 0.2), 4),
    rsi_14: round(25 + seededRandom(symbol, 13) * 55, 2),
    macd: round((seededRandom(symbol, 14) - 0.5) * 4, 4),
    macd_signal: round((seededRandom(symbol, 15) - 0.5) * 4, 4),
    atr_14: round(close * 0.02, 4),
    adx_14: round(10 + seededRandom(symbol, 16) * 40, 2),
    bb_percent_b: round(seededRandom(symbol, 17), 4),
    volatility_20: round(0.15 + seededRandom(symbol, 18) * 0.4, 4),
    volume_ratio: quote.volume_ratio ?? null,
  }
}

export const mockIndicatorSnapshot = (symbol: string): IndicatorSnapshot => ({
  symbol,
  date: TODAY,
  values: mockIndicatorValues(symbol),
})

export const mockIndicatorSeries = (
  symbol: string,
  names: string[],
  limit: number
): IndicatorSeriesResponse => {
  const indicators = names.length ? names : ['sma_20', 'sma_50', 'rsi_14', 'macd']
  const points = Array.from({ length: limit }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (limit - index))
    const values: Record<string, number | null> = {}
    indicators.forEach((name, offset) => {
      values[name] = round(50 + seededRandom(`${symbol}${name}${index}`, offset) * 50, 4)
    })
    return { date: date.toISOString().slice(0, 10), values }
  })
  return { symbol, indicators, points, total_records: points.length }
}

const mockTrend = (symbol: string): TrendDirection => {
  const options: TrendDirection[] = ['strong_uptrend', 'uptrend', 'neutral', 'downtrend', 'strong_downtrend']
  return options[Math.floor(seededRandom(symbol, 20) * options.length)]
}

export const mockTechnicalAnalysis = (symbol: string): TechnicalAnalysisResponse => {
  const quote = mockQuote(symbol)
  const values = mockIndicatorValues(symbol)
  const score = round((seededRandom(symbol, 21) - 0.5) * 2, 4)
  const close = quote.close ?? 100
  return {
    symbol,
    date: TODAY,
    quote,
    trend: mockTrend(symbol),
    signal: score >= 0.6 ? 'strong_buy' : score >= 0.2 ? 'buy' : score <= -0.6 ? 'strong_sell' : score <= -0.2 ? 'sell' : 'neutral',
    signal_score: score,
    indicators: values,
    signals: [
      {
        name: 'RSI(14)',
        verdict: 'neutral',
        detail: `Mock RSI at ${values.rsi_14}.`,
        bullish: (values.rsi_14 ?? 50) > 50,
        weight: 1,
      },
      {
        name: 'MACD',
        verdict: (values.macd ?? 0) > (values.macd_signal ?? 0) ? 'bullish' : 'bearish',
        detail: 'Mock MACD reading.',
        bullish: (values.macd ?? 0) > (values.macd_signal ?? 0),
        weight: 1,
      },
    ],
    levels: {
      support: [round(close * 0.95, 2), round(close * 0.91, 2)],
      resistance: [round(close * 1.05, 2), round(close * 1.09, 2)],
      pivot: {
        pivot: round(close, 2),
        r1: round(close * 1.02, 2),
        r2: round(close * 1.04, 2),
        r3: round(close * 1.06, 2),
        s1: round(close * 0.98, 2),
        s2: round(close * 0.96, 2),
        s3: round(close * 0.94, 2),
      },
    },
    performance: {
      '1d': quote.change_percent ?? null,
      '5d': round((seededRandom(symbol, 22) - 0.5) * 0.1, 6),
      '1m': round((seededRandom(symbol, 23) - 0.5) * 0.2, 6),
      '3m': round((seededRandom(symbol, 24) - 0.5) * 0.4, 6),
      '6m': round((seededRandom(symbol, 25) - 0.5) * 0.6, 6),
      '1y': round((seededRandom(symbol, 26) - 0.5) * 0.9, 6),
    },
    narrative: `${symbol} mock read-out generated in mock mode. This is a rule-based technical read-out, not investment advice.`,
  }
}

export const mockRiskMetrics = (symbol: string, windowDays: number, benchmark?: string): RiskMetrics => {
  const volatility = round(0.15 + seededRandom(symbol, 30) * 0.45, 6)
  return {
    symbol,
    window_days: windowDays,
    benchmark: benchmark ?? null,
    risk_level: volatility < 0.2 ? 'low' : volatility < 0.35 ? 'moderate' : volatility < 0.55 ? 'high' : 'very_high',
    metrics: {
      observations: windowDays,
      cumulative_return: round((seededRandom(symbol, 31) - 0.4) * 0.8, 6),
      annualized_return: round((seededRandom(symbol, 32) - 0.4) * 0.6, 6),
      annualized_volatility: volatility,
      sharpe_ratio: round((seededRandom(symbol, 33) - 0.4) * 2.5, 4),
      sortino_ratio: round((seededRandom(symbol, 34) - 0.4) * 3, 4),
      max_drawdown: round(-seededRandom(symbol, 35) * 0.5, 6),
      calmar_ratio: round(seededRandom(symbol, 36) * 2, 4),
      value_at_risk_95: round(-0.01 - seededRandom(symbol, 37) * 0.04, 6),
      conditional_var_95: round(-0.02 - seededRandom(symbol, 38) * 0.05, 6),
      win_rate: round(0.4 + seededRandom(symbol, 39) * 0.2, 4),
      beta: benchmark ? round(0.5 + seededRandom(symbol, 40) * 1.2, 4) : null,
      alpha: benchmark ? round((seededRandom(symbol, 41) - 0.5) * 0.2, 6) : null,
    },
  }
}

export const mockPeerComparison = (
  symbol: string,
  peers: string[],
  windowDays: number
): PeerComparisonResponse => {
  const entry = (name: string) => ({
    symbol: name,
    change_percent_1m: round((seededRandom(name, 50) - 0.5) * 0.2, 6),
    change_percent_3m: round((seededRandom(name, 51) - 0.5) * 0.4, 6),
    change_percent_1y: round((seededRandom(name, 52) - 0.5) * 0.9, 6),
    annualized_volatility: round(0.15 + seededRandom(name, 53) * 0.4, 6),
    sharpe_ratio: round((seededRandom(name, 54) - 0.4) * 2.5, 4),
    max_drawdown: round(-seededRandom(name, 55) * 0.5, 6),
    correlation: round(seededRandom(name, 56), 4),
    relative_strength: round((seededRandom(name, 57) - 0.5) * 0.4, 6),
  })
  return {
    symbol,
    window_days: windowDays,
    base: entry(symbol),
    peers: peers.filter(p => p !== symbol).map(entry),
  }
}

export const mockCorrelation = (symbols: string[], windowDays: number): CorrelationResponse => {
  const matrix: Record<string, Record<string, number | null>> = {}
  symbols.forEach(a => {
    matrix[a] = {}
    symbols.forEach(b => {
      matrix[a][b] = a === b ? 1 : round(seededRandom(`${[a, b].sort().join('')}`, 60) * 1.6 - 0.6, 4)
    })
  })
  return { symbols, window_days: windowDays, matrix }
}

export const mockSeasonality = (symbol: string, granularity: 'month' | 'weekday'): SeasonalityResponse => {
  const monthLabels = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const weekdayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const labels = granularity === 'weekday' ? weekdayLabels : monthLabels
  return {
    symbol,
    granularity,
    buckets: labels.map((label, index) => ({
      period: granularity === 'weekday' ? index : index + 1,
      label,
      average_return: round((seededRandom(`${symbol}${label}`, 70) - 0.5) * 0.05, 6),
      median_return: round((seededRandom(`${symbol}${label}`, 71) - 0.5) * 0.05, 6),
      positive_rate: round(0.35 + seededRandom(`${symbol}${label}`, 72) * 0.3, 4),
      sample_size: 20 + Math.round(seededRandom(`${symbol}${label}`, 73) * 20),
    })),
  }
}

export const mockSymbolProfile = (symbol: string, benchmark?: string): SymbolProfileResponse => {
  const technical = mockTechnicalAnalysis(symbol)
  return {
    symbol,
    quote: technical.quote,
    technical,
    risk: mockRiskMetrics(symbol, 252, benchmark),
    levels: technical.levels,
    performance: technical.performance,
    prediction: null,
    generated_at: new Date().toISOString(),
  }
}

/**
 * Index membership, matching the backend vocabulary. A symbol may belong to
 * both universes, one, or neither — the last case is real (the collector tracks
 * names that have since left an index) and the UI must handle an empty list.
 */
const mockIndexes = (symbol: string): string[] => {
  const indexes: string[] = []
  if (seededRandom(symbol, 86) > 0.15) indexes.push('sp500')
  if (seededRandom(symbol, 87) > 0.7) indexes.push('nasdaq100')
  return indexes
}

const mockScreenerMatch = (symbol: string): ScreenerMatch => {
  const quote = mockQuote(symbol)
  const values = mockIndicatorValues(symbol)
  return {
    symbol,
    date: TODAY,
    close: quote.close,
    change_percent: quote.change_percent,
    volume: quote.volume,
    volume_ratio: quote.volume_ratio,
    rsi_14: values.rsi_14,
    sma_20: values.sma_20,
    sma_50: values.sma_50,
    sma_200: values.sma_200,
    return_1m: round((seededRandom(symbol, 80) - 0.5) * 0.2, 6),
    return_3m: round((seededRandom(symbol, 81) - 0.5) * 0.4, 6),
    return_1y: round((seededRandom(symbol, 82) - 0.5) * 0.9, 6),
    volatility: values.volatility_20,
    max_drawdown: round(-seededRandom(symbol, 83) * 0.5, 6),
    distance_to_52w_high: round(-seededRandom(symbol, 84) * 0.3, 6),
    distance_to_52w_low: round(seededRandom(symbol, 85) * 0.6, 6),
    trend: mockTrend(symbol),
    indexes: mockIndexes(symbol),
  }
}

export const mockScreen = (request: ScreenerRequest): ScreenerResponse => {
  const limit = request.limit ?? 50
  const offset = request.offset ?? 0
  const index = request.filters?.index ?? 'all'
  const all = universe()
    .map(mockScreenerMatch)
    .filter(match => index === 'all' || match.indexes.includes(index))
  return {
    matches: all.slice(offset, offset + limit),
    date: TODAY,
    total_count: all.length,
    limit,
    offset,
    universe_size: all.length,
  }
}

export const mockScreenerPresets = (): ScreenerPresetsResponse => ({
  presets: [
    {
      id: 'momentum_leaders',
      name: 'Momentum leaders',
      description: 'Names in a confirmed uptrend near 52-week highs.',
      filters: { above_sma50: true, above_sma200: true, golden_cross: true },
      sort_by: 'return_3m',
      sort_direction: 'desc',
    },
    {
      id: 'oversold_bounce',
      name: 'Oversold bounce candidates',
      description: 'Deeply oversold RSI while holding the long-term trend.',
      filters: { max_rsi: 32, above_sma200: true },
      sort_by: 'rsi_14',
      sort_direction: 'asc',
    },
    {
      id: 'volume_breakout',
      name: 'Volume breakouts',
      description: 'Rising on at least double the average volume.',
      filters: { min_volume_ratio: 2, min_change_percent: 0.02, macd_bullish: true },
      sort_by: 'volume_ratio',
      sort_direction: 'desc',
    },
  ],
})

const mockWatchlistStore: Watchlist[] = [
  {
    id: 'mock-watchlist-1',
    user_id: 'mock-user',
    name: 'Default',
    items: universe()
      .slice(0, 5)
      .map(symbol => ({ symbol, note: null, added_at: new Date().toISOString() })),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const mockWatchlists = (): WatchlistListResponse => ({
  watchlists: mockWatchlistStore,
  total_count: mockWatchlistStore.length,
})

export const mockWatchlist = (watchlistId: string): Watchlist =>
  mockWatchlistStore.find(w => w.id === watchlistId) ?? mockWatchlistStore[0]

export const mockCreateWatchlist = (name: string, symbols: string[]): Watchlist => {
  const created: Watchlist = {
    id: `mock-watchlist-${mockWatchlistStore.length + 1}`,
    user_id: 'mock-user',
    name,
    items: symbols.map(symbol => ({ symbol: symbol.toUpperCase(), note: null, added_at: new Date().toISOString() })),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  mockWatchlistStore.push(created)
  return created
}

export const mockWatchlistQuotes = (watchlistId: string): WatchlistQuotesResponse => {
  const watchlist = mockWatchlist(watchlistId)
  const quotes = watchlist.items.map(item => mockQuote(item.symbol))
  return {
    watchlist_id: watchlist.id ?? 'mock-watchlist-1',
    name: watchlist.name,
    quotes,
    total_count: quotes.length,
  }
}

const mockAlertStore: Alert[] = []

export const mockAlerts = (activeOnly: boolean): AlertListResponse => {
  const alerts = activeOnly ? mockAlertStore.filter(a => a.is_active) : mockAlertStore
  return { alerts, total_count: alerts.length }
}

export const mockCreateAlert = (request: AlertCreateRequest): Alert => {
  const alert: Alert = {
    id: `mock-alert-${mockAlertStore.length + 1}`,
    user_id: 'mock-user',
    symbol: request.symbol.toUpperCase(),
    alert_type: request.alert_type,
    threshold: request.threshold ?? null,
    is_active: true,
    triggered_at: null,
    last_checked_at: null,
    note: request.note ?? null,
    created_at: new Date().toISOString(),
  }
  mockAlertStore.push(alert)
  return alert
}

export const mockDeleteAlert = (alertId: string): void => {
  const index = mockAlertStore.findIndex(a => a.id === alertId)
  if (index >= 0) mockAlertStore.splice(index, 1)
}

export const mockCheckAlerts = (): AlertCheckResponse => ({
  checked: mockAlertStore.length,
  triggered: [],
})

/**
 * Types for the market intelligence, analysis, screener and watchlist APIs.
 */

export type TrendDirection =
  | 'strong_uptrend'
  | 'uptrend'
  | 'neutral'
  | 'downtrend'
  | 'strong_downtrend'

export type SignalStrength =
  | 'strongly_bullish'
  | 'bullish'
  | 'neutral'
  | 'bearish'
  | 'strongly_bearish'

export type SignalStrengthInput = SignalStrength | 'strong_buy' | 'buy' | 'sell' | 'strong_sell'

export function normalizeSignalStrength(signal: SignalStrengthInput): SignalStrength {
  switch (signal) {
    case 'strong_buy': return 'strongly_bullish'
    case 'buy': return 'bullish'
    case 'sell': return 'bearish'
    case 'strong_sell': return 'strongly_bearish'
    default: return signal
  }
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'very_high'

export type MoverCategory =
  | 'gainers'
  | 'losers'
  | 'most_active'
  | 'unusual_volume'
  | 'gap_up'
  | 'gap_down'
  | 'new_high_52w'
  | 'new_low_52w'

export type AlertType =
  | 'price_above'
  | 'price_below'
  | 'percent_change_up'
  | 'percent_change_down'
  | 'rsi_above'
  | 'rsi_below'
  | 'volume_spike'
  | 'cross_above_sma50'
  | 'cross_below_sma50'

export type SortDirection = 'asc' | 'desc'

export interface SymbolQuote {
  symbol: string
  date?: string | null
  close?: number | null
  open?: number | null
  high?: number | null
  low?: number | null
  volume?: number | null
  change?: number | null
  change_percent?: number | null
  volume_ratio?: number | null
  week52_high?: number | null
  week52_low?: number | null
}

export interface MoverEntry extends SymbolQuote {
  metric?: number | null
  metric_name?: string | null
}

export interface MoversResponse {
  category: MoverCategory
  date?: string | null
  entries: MoverEntry[]
  total_count: number
}

export interface MarketBreadth {
  date?: string | null
  total_symbols: number
  advancers: number
  decliners: number
  unchanged: number
  unchanged_symbols: string[]
  advance_decline_ratio?: number | null
  percent_advancing?: number | null
  above_sma20_percent?: number | null
  above_sma50_percent?: number | null
  above_sma200_percent?: number | null
  new_highs_52w: number
  new_lows_52w: number
  average_change_percent?: number | null
  median_change_percent?: number | null
  total_volume?: number | null
}

export interface MarketSentimentComponent {
  raw_value?: number | null
  score?: number | null
  weight: number
}

export interface MarketSentiment {
  score: number
  label: 'extreme_greed' | 'greed' | 'neutral' | 'fear' | 'extreme_fear'
  components: Record<string, MarketSentimentComponent>
  summary: string
}

export interface MarketOverviewResponse {
  date?: string | null
  breadth: MarketBreadth
  sentiment: MarketSentiment
  top_gainers: MoverEntry[]
  top_losers: MoverEntry[]
  most_active: MoverEntry[]
  generated_at: string
}

export interface PerformanceDistributionBucket {
  label: string
  lower_bound?: number | null
  upper_bound?: number | null
  count: number
  percent?: number | null
}

export interface PerformanceDistributionResponse {
  date?: string | null
  window_days: number
  buckets: PerformanceDistributionBucket[]
  total_symbols: number
}

export interface HeatmapEntry {
  symbol: string
  change_percent?: number | null
  volume?: number | null
  close?: number | null
}

export interface HeatmapResponse {
  date?: string | null
  window_days: number
  entries: HeatmapEntry[]
}

export interface IndicatorSnapshot {
  symbol: string
  date?: string | null
  values: Record<string, number | null>
}

export interface IndicatorSeriesPoint {
  date: string
  values: Record<string, number | null>
}

export interface IndicatorSeriesResponse {
  symbol: string
  indicators: string[]
  points: IndicatorSeriesPoint[]
  total_records: number
}

export interface SupportResistanceLevels {
  support: number[]
  resistance: number[]
  pivot: Record<string, number>
}

export interface TechnicalSignal {
  name: string
  verdict: string
  detail: string
  bullish?: boolean | null
  weight: number
}

export interface TechnicalAnalysisResponse {
  symbol: string
  date?: string | null
  quote: SymbolQuote
  trend: TrendDirection
  signal: SignalStrengthInput
  signal_score: number
  indicators: Record<string, number | null>
  signals: TechnicalSignal[]
  levels: SupportResistanceLevels
  performance: Record<string, number | null>
  narrative: string
}

export interface RiskMetrics {
  symbol: string
  window_days: number
  benchmark?: string | null
  metrics: Record<string, number | null>
  risk_level?: RiskLevel | null
}

export interface PeerComparisonEntry {
  symbol: string
  change_percent_1m?: number | null
  change_percent_3m?: number | null
  change_percent_1y?: number | null
  annualized_volatility?: number | null
  sharpe_ratio?: number | null
  max_drawdown?: number | null
  correlation?: number | null
  relative_strength?: number | null
}

export interface PeerComparisonResponse {
  symbol: string
  window_days: number
  peers: PeerComparisonEntry[]
  base?: PeerComparisonEntry | null
}

export interface CorrelationResponse {
  symbols: string[]
  window_days: number
  matrix: Record<string, Record<string, number | null>>
}

export interface SeasonalityBucket {
  period: number
  label: string
  average_return?: number | null
  median_return?: number | null
  positive_rate?: number | null
  sample_size: number
}

export interface SeasonalityResponse {
  symbol: string
  granularity: 'month' | 'weekday'
  buckets: SeasonalityBucket[]
}

export interface SymbolProfileResponse {
  symbol: string
  quote: SymbolQuote
  technical: TechnicalAnalysisResponse
  risk: RiskMetrics
  levels: SupportResistanceLevels
  performance: Record<string, number | null>
  prediction?: Record<string, unknown> | null
  generated_at: string
}

/** The index universes the backend covers. `all` is their union. */
export type StockIndex = 'all' | 'sp500' | 'nasdaq100'

export interface ScreenerFilters {
  index?: StockIndex

  // Price and liquidity
  min_price?: number
  max_price?: number
  min_volume?: number
  min_avg_volume?: number
  min_volume_ratio?: number
  max_volume_ratio?: number

  // Momentum
  min_change_percent?: number
  max_change_percent?: number
  min_return_1m?: number
  max_return_1m?: number
  min_return_3m?: number
  max_return_3m?: number
  min_return_1y?: number
  max_return_1y?: number
  min_rsi?: number
  max_rsi?: number

  // Trend structure
  trends?: TrendDirection[]
  above_sma20?: boolean
  above_sma50?: boolean
  above_sma200?: boolean
  macd_bullish?: boolean
  golden_cross?: boolean

  // Risk
  min_volatility?: number
  max_volatility?: number
  max_drawdown_floor?: number

  // Position in the 52-week range
  min_distance_to_52w_high?: number
  max_distance_to_52w_high?: number
  min_distance_to_52w_low?: number
  max_distance_to_52w_low?: number
  near_52w_high_percent?: number
  near_52w_low_percent?: number

  symbols?: string[]
}

export interface ScreenerRequest {
  filters?: ScreenerFilters
  sort_by?: string
  sort_direction?: SortDirection
  limit?: number
  offset?: number
}

export interface ScreenerMatch {
  symbol: string
  date?: string | null
  close?: number | null
  change_percent?: number | null
  volume?: number | null
  avg_volume_20?: number | null
  volume_ratio?: number | null
  rsi_14?: number | null
  sma_20?: number | null
  sma_50?: number | null
  sma_200?: number | null
  return_1m?: number | null
  return_3m?: number | null
  return_1y?: number | null
  volatility?: number | null
  max_drawdown?: number | null
  distance_to_52w_high?: number | null
  distance_to_52w_low?: number | null
  trend?: TrendDirection | null
  indexes: string[]
}

export interface ScreenerResponse {
  matches: ScreenerMatch[]
  date?: string | null
  total_count: number
  limit: number
  offset: number
  universe_size: number
}

export interface ScreenerPreset {
  id: string
  name: string
  description: string
  filters: ScreenerFilters
  sort_by: string
  sort_direction: SortDirection
}

export interface ScreenerPresetsResponse {
  presets: ScreenerPreset[]
}

/** A screen the user named and kept. */
export interface ScreenerStrategy {
  id: string
  user_id: string
  name: string
  filters: ScreenerFilters
  sort_by: string
  sort_direction: SortDirection
  created_at: string
  updated_at: string
}

export interface ScreenerStrategyCreateRequest {
  name: string
  filters: ScreenerFilters
  sort_by?: string
  sort_direction?: SortDirection
}

export interface ScreenerStrategyUpdateRequest {
  name?: string
  filters?: ScreenerFilters
  sort_by?: string
  sort_direction?: SortDirection
}

export interface ScreenerStrategyListResponse {
  strategies: ScreenerStrategy[]
  total_count: number
}

export interface WatchlistItem {
  symbol: string
  note?: string | null
  added_at: string
}

export interface Watchlist {
  id?: string | null
  user_id: string
  name: string
  items: WatchlistItem[]
  created_at: string
  updated_at: string
}

export interface WatchlistListResponse {
  watchlists: Watchlist[]
  total_count: number
}

export interface WatchlistQuotesResponse {
  watchlist_id: string
  name: string
  quotes: SymbolQuote[]
  total_count: number
}

export interface Alert {
  id?: string | null
  user_id: string
  symbol: string
  alert_type: AlertType
  threshold?: number | null
  is_active: boolean
  triggered_at?: string | null
  last_checked_at?: string | null
  note?: string | null
  created_at: string
}

export interface AlertCreateRequest {
  symbol: string
  alert_type: AlertType
  threshold?: number
  note?: string
}

export interface AlertListResponse {
  alerts: Alert[]
  total_count: number
}

export interface TriggeredAlert {
  alert: Alert
  current_value?: number | null
  message: string
}

export interface AlertCheckResponse {
  checked: number
  triggered: TriggeredAlert[]
}

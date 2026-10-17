import type { PivotPicksResponse } from './picks'

export interface AlphaRankItem {
  market: string
  date: string
  symbol: string
  rank: number
  horizon: number
  tag?: string | null
  generated_at?: string | null
  signal_model: 'alpha_rank'
  score: number
  consensus: number
  predicted_excess_return: number
  /** Continuous rank_hat percentile in the 0..1 range, not an ordinal rank. */
  predicted_rank: number
  top20_probability: number
  close: number | null
  max_gain?: number | null
  max_loss?: number | null
  days_to_max_gain?: number | null
  days_to_max_loss?: number | null
  path_complete?: boolean | null
}

export interface AlphaRankResponse {
  market: string
  date: string
  horizon: number | null
  items: AlphaRankItem[]
  total_count: number
}

export interface SignalsResponse {
  market: string
  date: string
  pivot: PivotPicksResponse | null
  alpharank: AlphaRankResponse | null
}

export interface SignalsDatesResponse {
  market: string
  dates: string[]
  count: number
}

export interface AlphaRankHistoryResponse {
  market: string
  symbol?: string
  ticker?: string
  count: number
  items: AlphaRankItem[]
}

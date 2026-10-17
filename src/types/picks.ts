/**
 * Types for the pivot pick list.
 *
 * A pick is an **event**, not a ranking. The model scores the whole universe
 * each session, but a score is a slow-moving *state*; what gets published is the
 * sparse set of bars where a rule actually fired — roughly 1.9% of them. Most
 * sessions produce a handful, some produce none, and "nothing turned today" is
 * a real answer rather than an empty page.
 */

export type PickDirection = 'long' | 'short'

/** What fired. A pick is one of these. */
export type PickEvent = 'BUY_TURN' | 'SELL_TURN' | 'TREND_BUY' | 'BASE_BREAKOUT'

/** Which question the event answers. */
export type PickKind = 'reversal' | 'trend'

/**
 * The model's *state* label on the trigger bar. Context only — it does not
 * decide the side. An event is dated by its trigger while its setup may be up
 * to three sessions earlier, so the state has often decayed to HOLD or flipped
 * by the time a reversal confirms. `direction` is the decision.
 */
export type PivotAction = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL'

export interface PivotPick {
  date: string // 'YYYY-MM-DD'
  market: string
  symbol: string
  event: PickEvent
  kind: PickKind
  direction: PickDirection
  /** Presentation order within its side that day; it gates nothing. */
  rank: number
  horizon: number

  action: PivotAction
  /** Signed conviction; small magnitude (~ -0.5..0.5). */
  score: number
  /** 0..1 percentile within the day's full cross-section. */
  confidence: number
  swing_position: number | null
  p_up: number | null

  /** 0..1 share of the last 40 sessions called bullish. Context, not a gate. */
  sustained_bullish: number | null
  /** '; '-separated plain-language drivers. */
  rationale: string | null

  close: number | null
  price: number | null

  /**
   * What the name did over the horizon after the signal fired. Null for recent
   * signals whose horizon has not elapsed — still open, not missing.
   */
  /** The stock's own return over the horizon. Null while it has not elapsed. */
  forward_return: number | null
  /** The same return from the position's side; negated for shorts. */
  signal_return: number | null
  /** signal_return with the day's common market move removed. */
  excess_return: number | null

  /*
   * The path the position took, not just where it ended. Computed by the
   * backend from its own OHLC archive, so an endpoint return of roughly zero
   * no longer hides a run to +8% that was given back.
   */
  /** Best the position was ever up, intraday highs included. */
  max_gain: number | null
  /** Worst it was ever down, intraday lows included. */
  max_loss: number | null
  /** Trading days from the signal to its best point. */
  days_to_max_gain: number | null
  /** Trading days from the signal to its worst point. */
  days_to_max_loss: number | null
  /** False while the horizon has not fully elapsed. */
  path_complete: boolean | null

  /**
   * Whether this reversal landed within a few bars of a real swing point. Null
   * for trend signals — they fire on a new 60-day high, the opposite of a swing
   * low, so pivot labels ask them the wrong question.
   */
  pivot_hit: boolean | null
}

export interface PivotPicksResponse {
  market: string
  date: string | null
  horizon: number | null
  longs: PivotPick[]
  shorts: PivotPick[]
  total_count: number
  /** Events by type for this session. */
  counts: Partial<Record<PickEvent, number>>
}

export interface PivotDatesResponse {
  market: string
  dates: string[]
  count: number
}

export interface PivotHistoryResponse {
  market: string
  symbol: string
  count: number
  /** Ascending by date. */
  items: PivotPick[]
}

export interface PivotSummary {
  market: string
  date: string | null
  horizon: number | null
  long_count: number
  short_count: number
  counts: Partial<Record<PickEvent, number>>
  top_longs: PivotPick[]
  top_shorts: PivotPick[]
  generated_at: string | null
}

export interface PivotPerformance {
  market: string
  direction: PickDirection | null
  event: PickEvent | null
  horizon: number | null
  /** Signals whose horizon has elapsed. */
  evaluated: number
  /** Signals published but not yet resolvable. */
  pending: number
  win_rate: number | null
  avg_return: number | null
  median_return: number | null
  best_return: number | null
  worst_return: number | null
  /**
   * Benchmark-relative. This is the number that says whether the signal added
   * anything over simply being in the market that day — the raw figure alone is
   * dominated by whichever way the market moved.
   */
  excess_win_rate: number | null
  avg_excess_return: number | null
  median_excess_return: number | null

  /** Turning-point detection — the model's actual objective. Reversals only. */
  detection_scored: number
  detection_rate: number | null
  detection_base_rate: number | null
  detection_lift: number | null

  start: string | null
  end: string | null
}

/**
 * Performance per event type. There is deliberately no combined figure: longs
 * and shorts carry opposite raw returns by construction, so an average over
 * both describes the period's mix rather than the system.
 */
export interface PivotPerformanceBreakdown {
  market: string
  horizon: number | null
  by_event: PivotPerformance[]
}

export interface PivotRunModel {
  trained_at?: string | null
  rows?: number | null
  symbols?: number | null
  features?: number | null
  start?: string | null
  end?: string | null
  retrained?: boolean | null
  age_days?: number | null
}

export interface PivotRun {
  market: string
  date: string | null
  horizon: number | null
  tag: string | null
  status: string
  started_at: string | null
  finished_at: string | null
  duration_seconds: number | null
  symbols_scored: number
  published: number
  counts: Record<string, number>
  model: PivotRunModel | null
  /** The run itself failed. */
  error: string | null
  /**
   * The run succeeded but its picks never reached the database, so what is
   * displayed belongs to an earlier session.
   */
  publish_error: string | null
}

export const PICK_EVENTS: PickEvent[] = ['BUY_TURN', 'TREND_BUY', 'BASE_BREAKOUT', 'SELL_TURN']

/**
 * The product-level split. A trend signal is bullish too — it is a
 * different *kind* of long (joining an advance rather than calling a bottom),
 * which the card shows, but it belongs on the same side of the book.
 */
export type PickBias = 'bullish' | 'bearish'

export const biasOf = (pick: Pick<PivotPick, 'direction'>): PickBias =>
  pick.direction === 'short' ? 'bearish' : 'bullish'

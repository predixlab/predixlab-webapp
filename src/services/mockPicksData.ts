/**
 * Mock pivot picks for offline/demo mode.
 *
 * Mirrors the real publication semantics so the UI behaves identically without
 * a backend. The important property to reproduce is **sparsity**: picks are
 * events, roughly 1.9% of bar-days fire, session counts vary, and some sessions
 * produce nothing at all. A mock that always returned a full board would hide
 * exactly the states the UI has to handle.
 */

import type {
  PickDirection,
  PickEvent,
  PickKind,
  PivotAction,
  PivotDatesResponse,
  PivotHistoryResponse,
  PivotPerformance,
  PivotPerformanceBreakdown,
  PivotPick,
  PivotPicksResponse,
  PivotRun,
  PivotSummary,
} from '@/types/picks'

import { mockSymbols } from './mockData'

const MARKET_DEFAULT = 'us'
const HORIZON = 10
/** Share of the universe that fires on a session, as measured on the real run. */
const EVENT_RATE = 0.019

/** Deterministic hash so a symbol/date pair always renders the same numbers. */
const seed = (text: string): number => {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // FNV-1a alone barely diffuses its last byte, so keys differing only in the
  // final character ('…:dg' vs '…:dl') land within ~2% of each other and the
  // fixtures come out visibly correlated. One avalanche round fixes that.
  h ^= h >>> 16
  h = Math.imul(h, 2246822507)
  h ^= h >>> 13
  h = Math.imul(h, 3266489909)
  h ^= h >>> 16
  return (h >>> 0) / 4294967295
}

const isWeekend = (d: Date): boolean => d.getDay() === 0 || d.getDay() === 6

/** Recent trading sessions, newest first. */
const sessionList = (limit: number): string[] => {
  const dates: string[] = []
  const cursor = new Date()
  while (dates.length < limit) {
    if (!isWeekend(cursor)) dates.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() - 1)
  }
  return dates
}

const universe = (): string[] =>
  mockSymbols.length >= 60
    ? mockSymbols
    : [...mockSymbols, ...Array.from({ length: 60 }, (_, i) => `SYM${i}`)]

const buildPick = (
  symbol: string,
  date: string,
  event: PickEvent,
  rank: number,
  market: string,
): PivotPick => {
  const r = seed(`${symbol}:${date}:${event}`)
  const long = event !== 'SELL_TURN'
  const direction: PickDirection = long ? 'long' : 'short'
  const kind: PickKind =
    event === 'TREND_BUY' || event === 'BASE_BREAKOUT' ? 'trend' : 'reversal'

  const magnitude = 0.12 - rank * 0.004 + r * 0.01
  const score = Number(((long ? 1 : -1) * Math.max(magnitude, 0.005)).toFixed(4))
  const price = Number((20 + r * 380).toFixed(2))
  // The state on the trigger bar has often decayed by the time the event
  // confirms. Reproducing that keeps the UI honest: it must read the side from
  // `direction`, never from `action`.
  const action: PivotAction =
    r < 0.45 ? 'HOLD' : long ? (r < 0.8 ? 'STRONG_BUY' : 'BUY') : r < 0.8 ? 'STRONG_SELL' : 'SELL'

  const reasons = long
    ? event === 'TREND_BUY'
      ? ['new 60-day high', 'sustained model conviction']
      : event === 'BASE_BREAKOUT'
        ? ['new 20-day high', 'compressed ATR', 'expanding volume']
        : ['price sits near the bottom of its 60-day range', 'RSI is oversold']
    : ['price sits near the top of its 60-day range', 'RSI is overbought']

  return {
    date,
    market,
    symbol,
    event,
    kind,
    direction,
    rank,
    horizon: HORIZON,
    action,
    score,
    confidence: Number(Math.max(0.5, 1 - rank * 0.012 - r * 0.02).toFixed(3)),
    swing_position: Number((long ? 0.15 + r * 0.3 : 0.55 + r * 0.3).toFixed(3)),
    p_up: Number((long ? 0.52 + r * 0.12 : 0.34 + r * 0.12).toFixed(4)),
    sustained_bullish: long ? Number((0.5 + r * 0.45).toFixed(3)) : null,
    rationale: reasons.join('; '),
    close: Number((price / 12).toFixed(4)),
    price,
    forward_return: null,
    signal_return: null,
    excess_return: null,
    max_gain: null,
    max_loss: null,
    days_to_max_gain: null,
    days_to_max_loss: null,
    path_complete: null,
    pivot_hit: null,
  }
}

/** Events are sparse and their count varies by session, including zero. */
const buildSession = (date: string, market: string): PivotPick[] => {
  const picks: PivotPick[] = []
  let longRank = 0
  let shortRank = 0
  universe().forEach(symbol => {
    const r = seed(`${symbol}:${date}:fire`)
    if (r > EVENT_RATE * 3) return
    const event: PickEvent =
      r < EVENT_RATE * 0.75
        ? 'BUY_TURN'
        : r < EVENT_RATE * 1.5
          ? 'SELL_TURN'
          : r < EVENT_RATE * 2.25
            ? 'TREND_BUY'
            : 'BASE_BREAKOUT'
    const long = event !== 'SELL_TURN'
    const rank = long ? (longRank += 1) : (shortRank += 1)
    picks.push(buildPick(symbol, date, event, rank, market))
  })
  return picks
}

const eventCounts = (picks: PivotPick[]): Partial<Record<PickEvent, number>> => {
  const counts: Partial<Record<PickEvent, number>> = {}
  picks.forEach(p => {
    counts[p.event] = (counts[p.event] ?? 0) + 1
  })
  return counts
}

export const mockPivotDates = (market = MARKET_DEFAULT, limit = 60): PivotDatesResponse => {
  const dates = sessionList(limit)
  return { market, dates, count: dates.length }
}

export const mockPivotPicksByDate = (
  date: string,
  market = MARKET_DEFAULT,
  direction?: PickDirection,
  event?: PickEvent,
  limit = 100,
): PivotPicksResponse => {
  let all = buildSession(date, market)
  if (event) all = all.filter(p => p.event === event)
  const longs = direction === 'short' ? [] : all.filter(p => p.direction === 'long').slice(0, limit)
  const shorts = direction === 'long' ? [] : all.filter(p => p.direction === 'short').slice(0, limit)
  return {
    market,
    date,
    horizon: HORIZON,
    longs,
    shorts,
    total_count: longs.length + shorts.length,
    counts: eventCounts([...longs, ...shorts]),
  }
}

export const mockLatestPivotPicks = (
  market = MARKET_DEFAULT,
  direction?: PickDirection,
  event?: PickEvent,
  limit = 100,
): PivotPicksResponse => mockPivotPicksByDate(sessionList(1)[0], market, direction, event, limit)

export const mockPivotPickForSymbol = (
  date: string,
  symbol: string,
  market = MARKET_DEFAULT,
): PivotPick => buildPick(symbol.toUpperCase(), date, 'BUY_TURN', 1, market)

export const mockPivotSymbolHistory = (
  symbol: string,
  market = MARKET_DEFAULT,
  limit = 120,
): PivotHistoryResponse => {
  // A single name is picked occasionally, not every session.
  const items = sessionList(limit * 6)
    .filter((_, i) => i % 6 === 0)
    .slice(0, limit)
    .map((date, i) => {
      const event: PickEvent =
        i % 5 === 0
          ? 'SELL_TURN'
          : i % 7 === 0
            ? 'TREND_BUY'
            : i % 11 === 0
              ? 'BASE_BREAKOUT'
              : 'BUY_TURN'
      const pick = buildPick(symbol.toUpperCase(), date, event, (i % 8) + 1, market)
      // Older events have a completed horizon; the newest few are still open,
      // which is what the "still open" marker in the UI is for.
      if (i <= 1) {
        // The horizon has not elapsed, so the path so far is partial.
        pick.path_complete = false
      } else {
        const r = seed(`${symbol}:${date}:outcome`)
        const forward = Number((r * 0.16 - 0.075).toFixed(4))
        pick.forward_return = forward
        pick.signal_return = pick.direction === 'short' ? -forward : forward
        pick.excess_return = Number(((pick.signal_return ?? 0) - 0.005).toFixed(4))

        // The path always brackets the endpoint: it ran at least as far up and
        // at least as far down as where it finished. Reproducing that keeps the
        // mock honest about why an endpoint return can hide a round trip.
        const settled = pick.signal_return ?? 0
        const overshoot = seed(`${symbol}:${date}:peak`) * 0.06
        const undershoot = seed(`${symbol}:${date}:trough`) * 0.06
        pick.max_gain = Number((Math.max(settled, 0) + overshoot).toFixed(4))
        pick.max_loss = Number((Math.min(settled, 0) - undershoot).toFixed(4))
        pick.days_to_max_gain = 1 + Math.floor(seed(`${symbol}:${date}:dg`) * HORIZON)
        pick.days_to_max_loss = 1 + Math.floor(seed(`${symbol}:${date}:dl`) * HORIZON)
        pick.path_complete = true
      }
      return pick
    })
    .reverse()
  return { market, symbol: symbol.toUpperCase(), count: items.length, items }
}

export const mockPivotSummary = (market = MARKET_DEFAULT): PivotSummary => {
  const date = sessionList(1)[0]
  const session = mockPivotPicksByDate(date, market)
  return {
    market,
    date,
    horizon: HORIZON,
    long_count: session.longs.length,
    short_count: session.shorts.length,
    counts: session.counts,
    top_longs: session.longs.slice(0, 5),
    top_shorts: session.shorts.slice(0, 5),
    generated_at: new Date().toISOString(),
  }
}

export const mockPivotPerformance = (
  market = MARKET_DEFAULT,
  direction?: PickDirection,
  event?: PickEvent,
): PivotPerformance => ({
  market,
  direction: direction ?? null,
  event: event ?? null,
  horizon: HORIZON,
  evaluated: 6738,
  pending: 92,
  win_rate: 0.503,
  avg_return: 0.0011,
  median_return: 0.0004,
  best_return: 0.5014,
  worst_return: -0.3335,
  excess_win_rate: 0.5082,
  avg_excess_return: 0.0014,
  median_excess_return: 0.0008,
  detection_scored: event === 'TREND_BUY' || event === 'BASE_BREAKOUT' ? 0 : 3100,
  detection_rate: event === 'TREND_BUY' || event === 'BASE_BREAKOUT' ? null : 0.566,
  detection_base_rate:
    event === 'TREND_BUY' || event === 'BASE_BREAKOUT' ? null : 0.183,
  detection_lift: event === 'TREND_BUY' || event === 'BASE_BREAKOUT' ? null : 3.09,
  start: sessionList(400)[399],
  end: sessionList(1)[0],
})

export const mockPivotPerformanceBreakdown = (
  market = MARKET_DEFAULT,
): PivotPerformanceBreakdown => ({
  market,
  horizon: HORIZON,
  by_event: (['BUY_TURN', 'SELL_TURN', 'TREND_BUY', 'BASE_BREAKOUT'] as PickEvent[]).map(event => ({
    ...mockPivotPerformance(market, undefined, event),
    evaluated:
      event === 'TREND_BUY'
        ? 439
        : event === 'BASE_BREAKOUT'
          ? 374
          : event === 'BUY_TURN'
            ? 3070
            : 3229,
    win_rate: event === 'SELL_TURN' ? 0.4704 : 0.5342,
    avg_return: event === 'SELL_TURN' ? -0.0036 : 0.0055,
    avg_excess_return: event === 'SELL_TURN' ? 0.0011 : 0.0018,
  })),
})

export const mockLatestPivotRun = (market = MARKET_DEFAULT): PivotRun => {
  const finished = new Date()
  const started = new Date(finished.getTime() - 214_000)
  const session = mockPivotPicksByDate(sessionList(1)[0], market)
  return {
    market,
    date: sessionList(1)[0],
    horizon: HORIZON,
    tag: 'default',
    status: 'success',
    started_at: started.toISOString(),
    finished_at: finished.toISOString(),
    duration_seconds: 214,
    symbols_scored: 514,
    published: session.total_count,
    counts: session.counts as Record<string, number>,
    model: {
      trained_at: new Date(finished.getTime() - 86_400_000).toISOString(),
      rows: 1_156_059,
      features: 122,
      retrained: false,
    },
    error: null,
    publish_error: null,
  }
}

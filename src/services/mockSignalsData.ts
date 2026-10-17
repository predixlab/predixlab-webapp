import type {
  AlphaRankHistoryResponse,
  AlphaRankItem,
  AlphaRankResponse,
  SignalsDatesResponse,
  SignalsResponse,
} from '@/types'

import { mockSymbols } from './mockData'
import { mockPivotDates, mockPivotPicksByDate } from './mockPicksData'

const MARKET_DEFAULT = 'us'
const HORIZON = 10

const isWeekend = (date: Date): boolean => date.getDay() === 0 || date.getDay() === 6

const sessionList = (limit: number): string[] => {
  const dates: string[] = []
  const cursor = new Date()
  while (dates.length < limit) {
    if (!isWeekend(cursor)) dates.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() - 1)
  }
  return dates
}

const seed = (text: string): number => {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  hash ^= hash >>> 16
  hash = Math.imul(hash, 2246822507)
  hash ^= hash >>> 13
  return (hash >>> 0) / 4294967295
}

const buildAlphaRank = (date: string, market: string): AlphaRankResponse => {
  const symbols = mockSymbols.length >= 30
    ? mockSymbols
    : [...mockSymbols, ...Array.from({ length: 30 }, (_, index) => `ALP${index + 1}`)]
  const generatedAt = `${date}T23:30:00Z`

  const items: AlphaRankItem[] = symbols
    .map(symbol => {
      const strength = seed(`${date}:${symbol}:alpha`)
      const agreement = seed(`${date}:${symbol}:consensus`)
      const excess = (strength - 0.78) * 0.09
      return {
        market,
        date,
        symbol,
        rank: 0,
        horizon: HORIZON,
        tag: strength > 0.9 ? 'high_conviction' : null,
        generated_at: generatedAt,
        signal_model: 'alpha_rank' as const,
        score: Number((0.45 + strength * 0.52).toFixed(4)),
        consensus: Number((0.52 + agreement * 0.45).toFixed(4)),
        predicted_excess_return: Number(excess.toFixed(4)),
        predicted_rank: Number((0.5 + strength * 0.49).toFixed(4)),
        top20_probability: Number((0.25 + strength * 0.7).toFixed(4)),
        close: Number((18 + seed(`${date}:${symbol}:close`) * 430).toFixed(2)),
      }
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 15)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }))

  return {
    market,
    date,
    horizon: HORIZON,
    items,
    total_count: items.length,
  }
}

export const mockSignalsByDate = (
  date: string,
  market = MARKET_DEFAULT,
): SignalsResponse => ({
  market,
  date,
  pivot: mockPivotPicksByDate(date, market),
  alpharank: buildAlphaRank(date, market),
})

export const mockLatestSignals = (market = MARKET_DEFAULT): SignalsResponse => {
  const date = mockPivotDates(market, 1).dates[0]
  return mockSignalsByDate(date, market)
}

export const mockSignalsDates = (
  market = MARKET_DEFAULT,
  limit = 60,
): SignalsDatesResponse => mockPivotDates(market, limit)

export const mockAlphaRankHistory = (
  ticker: string,
  market = MARKET_DEFAULT,
  limit = 250,
): AlphaRankHistoryResponse => {
  const symbol = ticker.toUpperCase()
  const items = sessionList(limit * 8)
    .map(date => buildAlphaRank(date, market).items.find(item => item.symbol === symbol))
    .filter((item): item is AlphaRankItem => Boolean(item))
    .slice(0, limit)
    .map((item, index) => {
      if (index <= 1) return { ...item, path_complete: false }
      const outcome = seed(`${symbol}:${item.date}:alpha-outcome`)
      const endpoint = outcome * 0.18 - 0.07
      return {
        ...item,
        max_gain: Number((Math.max(endpoint, 0) + seed(`${symbol}:${item.date}:alpha-peak`) * 0.07).toFixed(4)),
        max_loss: Number((Math.min(endpoint, 0) - seed(`${symbol}:${item.date}:alpha-trough`) * 0.05).toFixed(4)),
        days_to_max_gain: 1 + Math.floor(seed(`${symbol}:${item.date}:alpha-dg`) * HORIZON),
        days_to_max_loss: 1 + Math.floor(seed(`${symbol}:${item.date}:alpha-dl`) * HORIZON),
        path_complete: true,
      }
    })
    .reverse()

  return { market, symbol, ticker: symbol, count: items.length, items }
}

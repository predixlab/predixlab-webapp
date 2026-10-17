import { USER_NOTICE_VERSION } from '@/constants/legal'
import {
  User,
  DailyPicks,
  PredictionsResponse,
  StockData,
  BacktestResult,
  AvailableDates,
  StockList,
  Direction,
  StockPick,
  Prediction,
  Trade,
} from '@/types'

// Mock user data
export const mockUser: User = {
  id: '1',
  email: 'mock@example.com',
  name: 'Mock User',
  role: 'premium',
  daily_signals_email_enabled: true,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-08-29T00:00:00Z',
  last_login: '2024-08-29T12:00:00Z',
  email_verified: true,
  premium_expires_at: '2099-12-31T23:59:59Z',
  has_premium_access: true,
  premium_access_expires_at: '2099-12-31T23:59:59Z',
  preferred_language: 'en',
  user_notice_version: USER_NOTICE_VERSION,
  user_notice_accepted_at: '2026-08-09T00:00:00Z',
}

// Mock stock symbols
export const mockSymbols = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
  'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'PYPL', 'UBER', 'SPOT',
  'ZOOM', 'SQ', 'TWTR', 'SNAP', 'PINS', 'ROKU', 'ZM', 'DOCU'
]

// Generate mock stock picks
export const generateMockStockPicks = (_direction: Direction): StockPick[] => {
  const count = Math.floor(Math.random() * 10) + 5 // 5-14 picks
  const picks: StockPick[] = []

  for (let i = 0; i < count; i++) {
    const symbol = mockSymbols[Math.floor(Math.random() * mockSymbols.length)]
    picks.push({
      instrument: symbol,
      score: Math.random() * 100,
      strategy: `Strategy_${i + 1}`,
      final_score: Math.random() * 10,
      weighted_score: Math.random() * 5
    })
  }

  return picks.sort((a, b) => b.score - a.score)
}

// Generate mock predictions
export const generateMockPredictions = (): Prediction[] => {
  const count = Math.floor(Math.random() * 20) + 10 // 10-29 predictions
  const predictions: Prediction[] = []

  for (let i = 0; i < count; i++) {
    const instrument = mockSymbols[Math.floor(Math.random() * mockSymbols.length)]

    predictions.push({
      instrument,
      date: new Date().toISOString(),
      us_rise_1d: Math.random() * 100,
      us_rise_5d: Math.random() * 100,
      us_decline_1d: Math.random() * 100,
      us_decline_5d: Math.random() * 100
    })
  }

  return predictions.sort((a, b) => (b.us_rise_1d || 0) - (a.us_rise_1d || 0))
}

// Generate mock stock data
export const generateMockStockData = (symbol: string): StockData[] => {
  const data: StockData[] = []
  const startDate = new Date('2024-01-01')
  const endDate = new Date()
  let currentPrice = Math.random() * 200 + 50 // Start between 50-250

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
      const volatility = 0.02 // 2% daily volatility
      const change = (Math.random() - 0.5) * volatility * currentPrice

      const open = currentPrice
      const close = currentPrice + change
      const high = Math.max(open, close) + Math.random() * 5
      const low = Math.min(open, close) - Math.random() * 5
      const volume = Math.floor(Math.random() * 10000000) + 1000000

      data.push({
        symbol,
        date: date.toISOString().split('T')[0],
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume
      })

      currentPrice = close
    }
  }

  return data
}

// Generate mock backtest result
export const generateMockBacktest = (symbol: string, periodDays: number): BacktestResult => {
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000)

  // Generate trades
  const trades: Trade[] = []
  const numTrades = Math.floor(Math.random() * 20) + 5
  const currentDate = new Date(startDate)

  for (let i = 0; i < numTrades; i++) {
    const action = i % 2 === 0 ? 'BUY' : 'SELL'
    const price = Math.random() * 200 + 50
    const quantity = Math.floor(Math.random() * 100) + 1
    const value = price * quantity

    trades.push({
      date: currentDate.toISOString().split('T')[0],
      action,
      price: Number(price.toFixed(2)),
      quantity,
      value: Number(value.toFixed(2)),
      profit_loss: action === 'SELL' ? Number((Math.random() * 1000 - 500).toFixed(2)) : undefined
    })

    // Move to next trade date (random 1-7 days)
    currentDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 7) + 1)
  }

  const initialCapital = 10000
  const totalReturn = Math.random() * 0.4 - 0.2 // -20% to 20%
  const finalValue = initialCapital * (1 + totalReturn)
  const profitableTrades = trades.filter(t => t.profit_loss && t.profit_loss > 0).length
  const losingTrades = trades.filter(t => t.profit_loss && t.profit_loss < 0).length

  return {
    symbol,
    period_days: periodDays,
    signals: [],
    performance: [],
    summary_stats: {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      initial_capital: initialCapital,
      final_value: Number(finalValue.toFixed(2)),
      total_return: Number(totalReturn.toFixed(4)),
      annualized_return: Number((totalReturn * (365 / periodDays)).toFixed(4)),
      max_drawdown: Number((Math.random() * 0.1).toFixed(4)),
      sharpe_ratio: Number((Math.random() * 2).toFixed(2)),
      win_rate: Number((profitableTrades / (profitableTrades + losingTrades)).toFixed(2)),
      total_trades: profitableTrades + losingTrades,
      profitable_trades: profitableTrades,
      losing_trades: losingTrades,
      avg_win: Number((Math.random() * 500 + 100).toFixed(2)),
      avg_loss: Number(-(Math.random() * 300 + 50).toFixed(2)),
      trades
    }
  }
}

// Generate available dates
export const generateMockAvailableDates = (): AvailableDates => {
  const dates: string[] = []
  const startDate = new Date('2024-01-01')
  const endDate = new Date()

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
      dates.push(date.toISOString().split('T')[0])
    }
  }

  return {
    pick_dates: dates,
    prediction_dates: dates
  }
}

// Mock daily picks data
export const mockDailyPicks: Record<string, DailyPicks> = {}
export const mockPredictions: Record<string, PredictionsResponse> = {}
export const mockStockData: Record<string, StockData[]> = {}
export const mockBacktestResults: Record<string, BacktestResult> = {}

// Generate some initial mock data
const today = new Date().toISOString().split('T')[0]
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

// Initialize some mock data
mockDailyPicks[today] = {
  date: today,
  direction: 'RISING',
  picks: generateMockStockPicks('rising'),
  total_count: 10,
  is_premium_required: false
}

mockDailyPicks[yesterday] = {
  date: yesterday,
  direction: 'FALLING',
  picks: generateMockStockPicks('declining'),
  total_count: 8,
  is_premium_required: false
}

mockPredictions[today] = {
  date: today,
  predictions: generateMockPredictions(),
  total_count: 25
}

// Pre-generate some stock data
mockSymbols.slice(0, 5).forEach(symbol => {
  mockStockData[symbol] = generateMockStockData(symbol)
  mockBacktestResults[symbol] = generateMockBacktest(symbol, 90)
})

export const mockStockList: StockList = {
  symbols: mockSymbols,
  total_count: mockSymbols.length
}

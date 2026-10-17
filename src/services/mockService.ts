/* eslint-disable no-console -- mock service intentionally logs simulated API activity in mock mode */
import {
  AuthToken,
  EmailLoginRequest,
  EmailLoginVerify,
  EmailRegisterCodeRequest,
  UserRegister,
  OAuthExchangeRequest,
  OAuthConfirmRequest,
  OAuthLinkRequest,
  RefreshTokenRequest,
  User,
  UserUpdate,
  UserNoticeAcceptanceRequest,
  AccountDeletionRequest,
  DailyPicksResponse,
  PredictionsResponse,
  LatestPredictionsResponse,
  StockDataResponse,
  BacktestResult,
  AvailableDatesResponse,
  StockListResponse,
  Direction,
  MatchType,
  Prediction,
  AnomalyContract,
  AnomalyOption,
  OptionsAnomalyDatesResponse,
  GexAnalysis,
  GexAvailableDatesResponse,
  GexAvailableSymbolsResponse,
  GexHighlightSignal,
  GexHighlightsResponse,
  GexScopeKey,
  OptionsStructureAnalysis,
  OptionsStructureHighlightSignal,
  OptionsStructureHighlightsResponse,
  SubscriptionInfo,
  CreateCheckoutSessionRequest,
  CheckoutSessionResponse,
  SubscriptionPricesResponse,
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
  MoversResponse,
  PeerComparisonResponse,
  PerformanceDistributionResponse,
  RiskMetrics,
  ScreenerPresetsResponse,
  ScreenerRequest,
  ScreenerResponse,
  ScreenerStrategy,
  ScreenerStrategyCreateRequest,
  ScreenerStrategyListResponse,
  ScreenerStrategyUpdateRequest,
  StockIndex,
  SeasonalityResponse,
  SymbolProfileResponse,
  SymbolQuote,
  TechnicalAnalysisResponse,
  Watchlist,
  WatchlistListResponse,
  WatchlistQuotesResponse,
  PickDirection,
  PickEvent,
  PivotPick,
  PivotPicksResponse,
  PivotDatesResponse,
  PivotHistoryResponse,
  PivotSummary,
  PivotPerformance,
  PivotPerformanceBreakdown,
  PivotRun,
  AlphaRankHistoryResponse,
  SignalsDatesResponse,
  SignalsResponse,
  ReferralClickRequest,
  ReferralValidationResponse,
  ReferralSummary,
} from '@/types'

import {
  mockUser,
  generateMockStockPicks,
  generateMockPredictions,
  generateMockStockData,
  generateMockBacktest,
  generateMockAvailableDates,
  mockPredictions,
  mockStockData,
  mockBacktestResults,
  mockSymbols
} from './mockData'
import * as mockMarket from './mockMarketData'
import * as mockPivot from './mockPicksData'
import * as mockSignals from './mockSignalsData'

// Simulate network delay
const simulateDelay = (ms = 300): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Mock authentication token
const mockAuthToken: AuthToken = {
  access_token: 'mock_access_token_12345',
  refresh_token: 'mock_refresh_token_67890',
  token_type: 'Bearer',
  expires_in: 3600,
  user: mockUser
}

export class MockService {
  // Auth API methods - Email login/registration
  async requestEmailLoginCode(data: EmailLoginRequest): Promise<void> {
    await simulateDelay()
    console.log('Mock: Requested email login code for:', data.email)
  }

  async verifyEmailLogin(data: EmailLoginVerify): Promise<AuthToken> {
    await simulateDelay()
    console.log('Mock: Verified email login for:', data.email)
    return mockAuthToken
  }

  async requestEmailRegisterCode(data: EmailRegisterCodeRequest): Promise<void> {
    await simulateDelay()
    console.log('Mock: Requested email register code for:', data.email)
  }

  async registerUser(data: UserRegister): Promise<AuthToken> {
    await simulateDelay()
    console.log('Mock: Registered user:', data.email)
    return mockAuthToken
  }

  // OAuth methods
  getGoogleLoginUrl(referralCode?: string): string {
    void referralCode
    return 'https://mock-google-oauth.com/auth'
  }

  getMicrosoftLoginUrl(referralCode?: string): string {
    void referralCode
    return 'https://mock-microsoft-oauth.com/auth'
  }

  async exchangeOAuthCode(data: OAuthExchangeRequest): Promise<AuthToken> {
    await simulateDelay()
    console.log('Mock: Exchanged OAuth code for provider:', data.provider)
    return mockAuthToken
  }

  async confirmOAuthUser(_data: OAuthConfirmRequest): Promise<AuthToken> {
    await simulateDelay()
    console.log('Mock: Confirmed OAuth user')
    return mockAuthToken
  }

  // Token management
  async refreshToken(_data: RefreshTokenRequest): Promise<AuthToken> {
    await simulateDelay()
    console.log('Mock: Refreshed token')
    return mockAuthToken
  }

  async logout(): Promise<void> {
    await simulateDelay()
    console.log('Mock: User logged out')
  }

  async logoutAllDevices(): Promise<void> {
    await simulateDelay()
    console.log('Mock: Logged out from all devices')
  }

  // User profile
  async getCurrentUser(): Promise<User> {
    await simulateDelay()
    console.log('Mock: Retrieved current user')
    return mockUser
  }

  async updateUserProfile(data: UserUpdate): Promise<User> {
    await simulateDelay()
    console.log('Mock: Updated user profile:', data)
    return { ...mockUser, ...data }
  }

  async deleteAccount(data: AccountDeletionRequest): Promise<void> {
    await simulateDelay()
    if (data.confirmation.toLowerCase() !== mockUser.email.toLowerCase()) {
      throw new Error('Email confirmation does not match')
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    console.log('Mock: Deleted user account')
  }

  async acceptUserNotice(data: UserNoticeAcceptanceRequest): Promise<User> {
    await simulateDelay()
    return {
      ...mockUser,
      user_notice_version: data.user_notice_version,
      user_notice_accepted_at: new Date().toISOString(),
    }
  }

  async trackReferralClick(
    data: ReferralClickRequest,
  ): Promise<ReferralValidationResponse> {
    await simulateDelay()
    return {
      valid: data.referral_code.toUpperCase() === 'PREDIX01',
      invitee_reward_days: 7,
    }
  }

  async getReferralSummary(): Promise<ReferralSummary> {
    await simulateDelay()
    return {
      enabled: true,
      referral_code: 'PREDIX01',
      referral_url: `${window.location.origin}/register?ref=PREDIX01`,
      clicks: 18,
      signups: 7,
      successful_referrals: 7,
      capped_referrals: 0,
      conversion_rate: 38.9,
      reward_days_earned: 105,
      deferred_reward_days: 15,
      inviter_reward_days: 15,
      invitee_reward_days: 7,
      max_rewarded_referrals: 20,
      recent_activity: [
        {
          created_at: new Date().toISOString(),
          status: 'rewarded',
          reward_days: 15,
        },
      ],
    }
  }

  // OAuth link account method
  async linkOAuthAccount(data: OAuthLinkRequest): Promise<void> {
    await simulateDelay()
    console.log('Mock: Linked OAuth account:', data.oauth_token)
  }

  // Stocks API methods - Updated to match OpenAPI specification
  async getAvailableDates(): Promise<AvailableDatesResponse> {
    await simulateDelay()
    console.log('Mock: Retrieved available dates')
    const mockData = generateMockAvailableDates()
    return {
      dates: mockData.pick_dates
    }
  }

  async getDailyPicks(date: string, direction?: Direction): Promise<DailyPicksResponse> {
    await simulateDelay()
    console.log(`Mock: Retrieved daily picks for ${date} (${direction || 'all'})`)

    const risingPicks = generateMockStockPicks('rising').map(pick => ({
      instrument: pick.instrument,
      direction: 'rising' as const,
      score: pick.score,
      final_score: pick.final_score,
      weighted_score: pick.weighted_score,
      strategy: pick.strategy,
      date: new Date(date).toISOString()
    }))

    const fallingPicks = generateMockStockPicks('declining').map(pick => ({
      instrument: pick.instrument,
      direction: 'declining' as const,
      score: pick.score,
      final_score: pick.final_score,
      weighted_score: pick.weighted_score,
      strategy: pick.strategy,
      date: new Date(date).toISOString()
    }))

    return {
      date,
      risings: direction === 'declining' ? [] : risingPicks,
      fallings: direction === 'rising' ? [] : fallingPicks
    }
  }

  async getRisingPicks(date: string): Promise<DailyPicksResponse> {
    return this.getDailyPicks(date, 'rising')
  }

  async getFallingPicks(date: string): Promise<DailyPicksResponse> {
    return this.getDailyPicks(date, 'declining')
  }

  async getLatestPicks(): Promise<DailyPicksResponse> {
    await simulateDelay()
    console.log('Mock: Retrieved latest picks')

    const availableDates = await this.getAvailableDates()
    const latestDate = availableDates.dates[0]

    return this.getDailyPicks(latestDate)
  }

  async getPredictions(date: string): Promise<PredictionsResponse> {
    await simulateDelay()
    console.log(`Mock: Retrieved predictions for ${date}`)

    if (!mockPredictions[date]) {
      mockPredictions[date] = {
        date,
        predictions: generateMockPredictions(),
        total_count: Math.floor(Math.random() * 30) + 10
      }
    }

    return mockPredictions[date]
  }

  async getStockData(symbol: string, startDate?: string, endDate?: string, period?: string): Promise<StockDataResponse> {
    await simulateDelay()
    console.log(`Mock: Retrieved stock data for ${symbol}`)

    if (!mockStockData[symbol]) {
      mockStockData[symbol] = generateMockStockData(symbol)
    }

    let data = mockStockData[symbol]

    // Apply filtering based on parameters
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      data = data.filter(d => {
        const date = new Date(d.date)
        return date >= start && date <= end
      })
    } else if (period) {
      const monthsMap: Record<string, number> = { '1m': 1, '3m': 3, '6m': 6, '9m': 9, '1y': 12, '2y': 24, '3y': 36 }
      const months = monthsMap[period]
      if (months && data.length) {
        // Anchored on the newest bar, matching the backend. Anchoring on `now`
        // returns nothing as soon as the series lags real time.
        const latest = data.reduce(
          (max, d) => Math.max(max, new Date(d.date).getTime()),
          Number.NEGATIVE_INFINITY,
        )
        const cutoff = new Date(latest)
        cutoff.setMonth(cutoff.getMonth() - months)
        data = data.filter(d => new Date(d.date) >= cutoff)
      }
    }

    return {
      symbol,
      data,
      total_records: data.length
    }
  }

  async getAllStocks(limit?: number, offset?: number): Promise<StockListResponse> {
    await simulateDelay()
    console.log(`Mock: Retrieved all stocks (limit: ${limit}, offset: ${offset})`)

    const startIndex = offset || 0
    const endIndex = limit ? startIndex + limit : mockSymbols.length
    const symbols = mockSymbols.slice(startIndex, endIndex)

    return {
      symbols,
      total_count: mockSymbols.length
    }
  }

  async searchStocks(query: string, matchType: MatchType = 'infix', limit?: number): Promise<StockListResponse> {
    await simulateDelay()
    console.log(`Mock: Searched stocks for query: ${query} (${matchType})`)

    const filteredSymbols = mockSymbols.filter(symbol => {
      const lowerSymbol = symbol.toLowerCase()
      const lowerQuery = query.toLowerCase()

      if (matchType === 'prefix') {
        return lowerSymbol.startsWith(lowerQuery)
      } else {
        return lowerSymbol.includes(lowerQuery)
      }
    })

    const symbols = limit ? filteredSymbols.slice(0, limit) : filteredSymbols

    return {
      symbols,
      total_count: filteredSymbols.length
    }
  }

  async runBacktest(symbol: string, periodDays = 90): Promise<BacktestResult> {
    await simulateDelay(800) // Longer delay for backtest simulation
    console.log(`Mock: Running backtest for ${symbol} (${periodDays} days)`)

    const key = `${symbol}_${periodDays}`
    if (!mockBacktestResults[key]) {
      mockBacktestResults[key] = generateMockBacktest(symbol, periodDays)
    }

    return mockBacktestResults[key]
  }

  // New API methods from OpenAPI specification
  async getLatestPredictions(market = 'us'): Promise<LatestPredictionsResponse> {
    await simulateDelay()
    console.log(`Mock: Retrieved latest predictions for market: ${market}`)

    const predictions = generateMockPredictions()
    return {
      date: new Date().toISOString().split('T')[0],
      predictions,
      total_count: predictions.length
    }
  }

  async getPredictionByDateAndInstrument(date: string, instrument: string, market = 'us'): Promise<Prediction> {
    await simulateDelay()
    console.log(`Mock: Retrieved prediction for ${instrument} on ${date} (${market})`)

    const predictions = generateMockPredictions()
    const prediction = predictions.find(p => p.instrument === instrument) || predictions[0]

    return {
      ...prediction,
      instrument,
      date: new Date(date).toISOString()
    }
  }

  // Options / anomalies mock endpoints
  async getOptionAnomalies(offset = 0, limit = 20): Promise<AnomalyOption[]> {
    await simulateDelay(500)
    console.log(`Mock: Retrieved option anomalies (offset=${offset}, limit=${limit})`)

    const results: AnomalyOption[] = []
    const today = new Date()
    for (let i = 0; i < limit; i++) {
      const idx = (offset + i) % mockSymbols.length
      const symbol = mockSymbols[idx]
      const date = new Date(today.getTime() - (offset + i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const itemCount = Math.floor(Math.random() * 3) + 1
      const items: AnomalyContract[] = []

      for (let j = 0; j < itemCount; j++) {
        const optionType: AnomalyContract['option_type'] = Math.random() > 0.5 ? 'calls' : 'puts'
        const strike = Number((Math.random() * 300 + 10).toFixed(2))
        const expiration = new Date(today.getTime() + Math.floor(Math.random() * 120) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        items.push({
          symbol,
          contract: `${symbol}-${optionType.charAt(0).toUpperCase()}${Math.floor(Math.random() * 10000)}`,
          option_type: optionType,
          strike,
          expiration,
          open_interest_today: Math.floor(Math.random() * 10000),
          open_interest_previous: Math.floor(Math.random() * 10000),
          oi_change: Math.floor(Math.random() * 500) - 250,
          volume_today: Math.floor(Math.random() * 5000),
          volume_previous: Math.floor(Math.random() * 5000),
          volume_change: Math.floor(Math.random() * 300) - 150,
          in_the_money: Math.random() > 0.5,
          last_price: Number((Math.random() * 50).toFixed(2)),
          underlying_price: Number((Math.random() * 500).toFixed(2)),
          anomaly_score: Number((Math.random() * 10).toFixed(2)),
          position_type: undefined
        })
      }

      results.push({
        symbol,
        date,
        items,
        anomaly_score: Number((Math.random() * 10).toFixed(2))
      })
    }

    return results
  }

  async getLatestOptionAnomalies(): Promise<AnomalyOption[]> {
    await simulateDelay(300)
    console.log('Mock: Retrieved latest option anomalies')

    return this.getOptionAnomalies(0, 20)
  }

  async getOptionAnomalyDates(limit = 60): Promise<OptionsAnomalyDatesResponse> {
    await simulateDelay(150)
    const dates: string[] = []
    const cursor = new Date()
    while (dates.length < limit) {
      if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
        dates.push(cursor.toISOString().split('T')[0])
      }
      cursor.setDate(cursor.getDate() - 1)
    }
    return { dates, count: dates.length }
  }

  async getOptionAnomaliesByDate(date: string): Promise<AnomalyOption[]> {
    await simulateDelay(400)
    console.log(`Mock: Retrieved option anomalies for date: ${date}`)

    const results: AnomalyOption[] = []
    const count = Math.min(20, mockSymbols.length)
    for (let i = 0; i < count; i++) {
      const symbol = mockSymbols[i]
      const itemCount = Math.floor(Math.random() * 3) + 1
      const items: AnomalyContract[] = []

      for (let j = 0; j < itemCount; j++) {
        const optionType: AnomalyContract['option_type'] = Math.random() > 0.5 ? 'calls' : 'puts'
        const strike = Number((Math.random() * 300 + 10).toFixed(2))
        items.push({
          symbol,
          contract: `${symbol}-${optionType.charAt(0).toUpperCase()}${Math.floor(Math.random() * 10000)}`,
          option_type: optionType,
          strike,
          expiration: new Date(Date.now() + Math.floor(Math.random() * 120) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          open_interest_today: Math.floor(Math.random() * 10000),
          open_interest_previous: Math.floor(Math.random() * 10000),
          oi_change: Math.floor(Math.random() * 500) - 250,
          volume_today: Math.floor(Math.random() * 5000),
          volume_previous: Math.floor(Math.random() * 5000),
          volume_change: Math.floor(Math.random() * 300) - 150,
          in_the_money: Math.random() > 0.5,
          last_price: Number((Math.random() * 50).toFixed(2)),
          underlying_price: Number((Math.random() * 500).toFixed(2)),
          anomaly_score: Number((Math.random() * 10).toFixed(2)),
          position_type: undefined
        })
      }

      results.push({
        symbol,
        date,
        items,
        anomaly_score: Number((Math.random() * 10).toFixed(2))
      })
    }

    return results
  }

  async getLatestGex(symbol: string): Promise<GexAnalysis> {
    await simulateDelay(300)
    return this.getGexByDate(new Date().toISOString().split('T')[0], symbol)
  }

  async getGexByDate(date: string, symbol: string): Promise<GexAnalysis> {
    await simulateDelay(300)
    const normalized = symbol.toUpperCase()
    const spotBySymbol: Record<string, number> = {
      SPY: 650,
      QQQ: 585,
      IWM: 230,
      DIA: 455,
      AAPL: 308,
      NVDA: 197,
      TSLA: 313,
    }
    const spot = spotBySymbol[normalized] ?? 150
    const strikes = Array.from({ length: 17 }, (_, index) =>
      Number((spot * (0.92 + index * 0.01)).toFixed(2)),
    )
    const scopeMultipliers: Record<GexScopeKey, number> = {
      all: 1,
      '7d': 0.42,
      '30d': 0.7,
    }
    const scopes = (Object.keys(scopeMultipliers) as GexScopeKey[]).map(key => {
      const multiplier = scopeMultipliers[key]
      const strike_buckets = strikes.map((strike, index) => {
        const distance = Math.abs(index - 8)
        const call = (9 - distance) * 18_000_000 * multiplier * (index >= 8 ? 1.5 : 0.7)
        const put = -(9 - distance) * 15_000_000 * multiplier * (index <= 8 ? 1.4 : 0.6)
        return { strike, call_gex: call, put_gex: put, net_gex: call + put }
      })
      const call_gex = strike_buckets.reduce((sum, item) => sum + item.call_gex, 0)
      const put_gex = strike_buckets.reduce((sum, item) => sum + item.put_gex, 0)
      const net_gex = call_gex + put_gex
      return {
        key,
        net_gex,
        call_gex,
        put_gex,
        previous_net_gex: net_gex * 0.86,
        net_gex_change: net_gex * 0.14,
        regime: 'positive' as const,
        gamma_flip: spot * 0.94,
        previous_gamma_flip: spot * 0.932,
        call_wall: strikes[11],
        put_wall: strikes[6],
        previous_call_wall: strikes[10],
        previous_put_wall: strikes[5],
        decomposition: {
          oi_change: net_gex * 0.09,
          greeks: net_gex * 0.03,
          new_contracts: net_gex * 0.025,
          removed_contracts: net_gex * -0.005,
        },
        strike_buckets,
        top_drivers: [
          {
            contract: `${normalized}260918C${Math.round(strikes[11] * 1000)}`,
            option_type: 'calls' as const,
            strike: strikes[11],
            expiration: date,
            open_interest_today: 18000,
            open_interest_previous: 11000,
            oi_change: 7000,
            gex_today: net_gex * 0.18,
            gex_previous: net_gex * 0.08,
            gex_change: net_gex * 0.1,
            share_of_absolute_change: 0.42,
            attribution: 'oi_change' as const,
            is_unusual: true,
            anomaly_score: 82,
          },
          {
            contract: `${normalized}260918P${Math.round(strikes[6] * 1000)}`,
            option_type: 'puts' as const,
            strike: strikes[6],
            expiration: date,
            open_interest_today: 15000,
            open_interest_previous: 12000,
            oi_change: 3000,
            gex_today: net_gex * -0.12,
            gex_previous: net_gex * -0.08,
            gex_change: net_gex * -0.04,
            share_of_absolute_change: 0.17,
            attribution: 'greeks' as const,
            is_unusual: false,
            anomaly_score: null,
          },
        ],
      }
    })

    return {
      symbol: normalized,
      date,
      previous_date: date,
      generated_at: new Date().toISOString(),
      underlying_price: spot,
      previous_underlying_price: spot * 0.99,
      contract_count: 3200,
      valid_gamma_contract_count: 3100,
      oi_gamma_coverage: 0.982,
      model: 'call_positive_put_negative',
      spot_move: 0.01,
      scopes,
    }
  }

  async getGexDates(symbol: string, limit = 60): Promise<GexAvailableDatesResponse> {
    await simulateDelay(150)
    const dates = Array.from({ length: Math.min(limit, 22) }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - index)
      return date.toISOString().split('T')[0]
    }).filter(value => {
      const weekday = new Date(`${value}T12:00:00`).getDay()
      return weekday !== 0 && weekday !== 6
    })
    return { symbol: symbol.toUpperCase(), dates, count: dates.length }
  }

  async getLatestOptionsStructure(symbol: string): Promise<OptionsStructureAnalysis> {
    await simulateDelay(200)
    const normalized = symbol.toUpperCase()
    const spot = normalized === 'NVDA' ? 218 : normalized === 'AAPL' ? 225 : 150
    const expirations = [7, 14, 30, 60].map(days => {
      const expiration = new Date()
      expiration.setDate(expiration.getDate() + days)
      return { days, expiration: expiration.toISOString().slice(0, 10) }
    })
    return {
      symbol: normalized,
      date: new Date().toISOString().slice(0, 10),
      previous_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      generated_at: new Date().toISOString(),
      underlying_price: spot,
      previous_underlying_price: spot * 0.99,
      summary: {
        front_expiration: expirations[0].expiration,
        atm_iv: 0.32,
        previous_atm_iv: 0.30,
        atm_iv_change: 0.02,
        downside_skew: 0.07,
        previous_downside_skew: 0.05,
        downside_skew_change: 0.02,
        total_open_interest: 820000,
        previous_total_open_interest: 790000,
        total_oi_change: 30000,
        call_oi_change: 18000,
        put_oi_change: 12000,
        new_contracts: 36,
        closed_contracts: 21,
      },
      term_structure: expirations.map(({ days, expiration }, index) => ({
        expiration,
        days_to_expiry: days,
        atm_iv: 0.32 - index * 0.015,
        previous_atm_iv: 0.30 - index * 0.01,
        atm_iv_change: 0.02 - index * 0.005,
        call_open_interest: 120000 + index * 30000,
        put_open_interest: 100000 + index * 25000,
        call_oi_change: 8000 - index * 1000,
        put_oi_change: 5000 - index * 700,
      })),
      skew_expirations: expirations.map(({ days, expiration }, expiryIndex) => ({
        expiration,
        days_to_expiry: days,
        points: [-0.5, -0.4, -0.25, -0.1, 0.1, 0.25, 0.4, 0.5].map(delta => ({
          delta,
          option_type: delta < 0 ? 'puts' as const : 'calls' as const,
          iv: 0.27 + Math.abs(delta - 0.08) * 0.16 + expiryIndex * 0.005,
          previous_iv: 0.26 + Math.abs(delta - 0.05) * 0.14 + expiryIndex * 0.005,
          iv_change: 0.01,
        })),
      })),
      position_migrations: Array.from({ length: 16 }, (_, index) => {
        const callChange = (index % 2 ? -1 : 1) * (12000 - index * 500)
        const putChange = (index % 3 ? 1 : -1) * (9000 - index * 350)
        return {
          expiration: expirations[index % expirations.length].expiration,
          days_to_expiry: expirations[index % expirations.length].days,
          strike: Number((spot * (0.88 + index * 0.018)).toFixed(2)),
          call_open_interest: 30000 + callChange,
          previous_call_open_interest: 30000,
          call_oi_change: callChange,
          put_open_interest: 26000 + putChange,
          previous_put_open_interest: 26000,
          put_oi_change: putChange,
          total_oi_change: callChange + putChange,
          absolute_oi_change: Math.abs(callChange) + Math.abs(putChange),
          call_volume: 5000 + index * 300,
          put_volume: 4200 + index * 240,
          kind: callChange + putChange >= 0 ? 'increased' as const : 'decreased' as const,
        }
      }),
    }
  }

  async getOptionsStructureHighlights(
    limit = 6,
    signal?: OptionsStructureHighlightSignal,
  ): Promise<OptionsStructureHighlightsResponse> {
    await simulateDelay(150)
    const candidates: OptionsStructureHighlightsResponse['items'] = [
      ['ROST', 'iv_expansion', 98, 0.61, 0, 29340, 0.55],
      ['MRNA', 'iv_crush', 97, -0.76, 0, 143509, 0.17],
      ['FITB', 'downside_hedging', 91, 0, 0.12, 12400, 0.08],
      ['HST', 'upside_chasing', 89, 0.64, -0.15, 4200, 0.06],
      ['COIN', 'position_rotation', 94, 0.04, 0, 78085, 0.07],
      ['WMT', 'term_dislocation', 92, -0.37, 0, 184968, 0.15],
    ].map(([symbol, primary_signal, attention_score, atmIv, skewChange, oi, oiRatio]) => ({
      symbol: String(symbol),
      date: new Date().toISOString().split('T')[0],
      underlying_price: 100,
      attention_score: Number(attention_score),
      primary_signal: primary_signal as OptionsStructureHighlightSignal,
      atm_iv_change: Number(atmIv),
      downside_skew: Number(skewChange),
      downside_skew_change: Number(skewChange),
      total_oi_change: Number(oi),
      total_oi_change_ratio: Number(oiRatio),
      migration_ratio: Number(oiRatio),
      term_spread: Number(atmIv),
      term_spread_change: Number(atmIv),
    }))
    const items = candidates
      .filter(item => !signal || item.primary_signal === signal)
      .slice(0, limit)
    return { date: items[0]?.date, items, count: items.length }
  }

  async getOptionsStructureSymbols(
    query = '',
    limit = 1000,
  ): Promise<GexAvailableSymbolsResponse> {
    await simulateDelay(100)
    const normalized = query.trim().toUpperCase()
    const symbols = ['AAPL', 'MSFT', 'NVDA', 'QQQ', 'SPY', 'TSLA']
      .filter(symbol => !normalized || symbol.includes(normalized))
      .slice(0, limit)
    return { symbols, count: symbols.length }
  }

  async getGexSymbols(query = '', limit = 1000): Promise<GexAvailableSymbolsResponse> {
    await simulateDelay(150)
    const candidates = ['AAPL', 'DIA', 'IWM', 'MSFT', 'NVDA', 'QQQ', 'SPY', 'TSLA']
    const normalized = query.trim().toUpperCase()
    const symbols = candidates
      .filter(symbol => !normalized || symbol.includes(normalized))
      .slice(0, limit)
    return { symbols, count: symbols.length }
  }

  async getGexHighlights(
    limit = 6,
    signal?: GexHighlightSignal,
  ): Promise<GexHighlightsResponse> {
    await simulateDelay(150)
    const date = new Date().toISOString().split('T')[0]
    const balancedCandidates = [
      ['SPY', 'positive_gamma', 'positive'],
      ['TSLA', 'negative_gamma', 'negative'],
      ['NVDA', 'near_flip', 'negative'],
      ['AAPL', 'gex_change', 'positive'],
      ['MSFT', 'wall_shift', 'positive'],
      ['QQQ', 'high_activity', 'neutral'],
    ] as const
    const filteredSymbols = ['SPY', 'QQQ', 'AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'META']
    const candidates = signal
      ? filteredSymbols.map(symbol => [
          symbol,
          signal,
          signal === 'negative_gamma' ? 'negative' : 'positive',
        ] as const)
      : balancedCandidates
    const items: GexHighlightsResponse['items'] = candidates
      .slice(0, limit)
      .map(([symbol, primary_signal, regime], index) => ({
        symbol,
        date,
        attention_score: 88 - index * 6,
        primary_signal,
        regime,
        underlying_price: 100 + index * 25,
        gamma_flip_distance: index % 2 === 0 ? 0.018 : -0.024,
        net_gex_change: (index % 2 === 0 ? -1 : 1) * (900_000_000 - index * 80_000_000),
        net_gex_change_ratio: index % 2 === 0 ? -0.32 : 0.24,
        call_wall_change: index % 3 === 0 ? 5 : 0,
        put_wall_change: index % 3 === 1 ? -4 : 0,
      }))
    return { date, items, count: items.length }
  }

  // Subscription API methods
  async createCheckoutSession(data: CreateCheckoutSessionRequest): Promise<CheckoutSessionResponse> {
    await simulateDelay()
    console.log('Mock: Created checkout session:', data)

    return {
      checkout_url: 'https://mock-stripe-checkout.com/session',
      session_id: 'mock_session_12345'
    }
  }

  async getSubscriptionInfo(): Promise<SubscriptionInfo | null> {
    await simulateDelay()
    console.log('Mock: Retrieved subscription info')

    return {
      status: 'active',
      billing_interval: 'month',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      trial_end: null,
      cancel_at_period_end: false
    }
  }

  async cancelSubscription(): Promise<void> {
    await simulateDelay()
    console.log('Mock: Cancelled subscription')
  }

  async getSubscriptionPrices(): Promise<SubscriptionPricesResponse> {
    await simulateDelay()
    console.log('Mock: Retrieved subscription prices')

    return {
      prices: [
        {
          id: 'price_mock_monthly',
          interval: 'month',
          amount: 20,
          currency: 'USD',
          product: 'premium_subscription'
        },
        {
          id: 'price_mock_yearly',
          interval: 'year',
          amount: 192,
          currency: 'USD',
          product: 'premium_subscription'
        }
      ],
      trial_period_days: 7
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Stripe publishable-key payload shape is provider-defined
  async getStripePublishableKey(): Promise<any> {
    await simulateDelay()
    console.log('Mock: Retrieved Stripe publishable key')

    return {
      publishable_key: 'pk_test_mock_publishable_key_12345'
    }
  }

  // Market intelligence endpoints
  async getMarketOverview(moversLimit = 5): Promise<MarketOverviewResponse> {
    await simulateDelay()
    return mockMarket.mockOverview(moversLimit)
  }

  async getMarketBreadth(): Promise<MarketBreadth> {
    await simulateDelay()
    return mockMarket.mockBreadth()
  }

  async getMarketSentiment(): Promise<MarketSentiment> {
    await simulateDelay()
    return mockMarket.mockSentiment(mockMarket.mockBreadth())
  }

  async getMarketMovers(category: MoverCategory = 'gainers', limit = 20): Promise<MoversResponse> {
    await simulateDelay()
    return mockMarket.mockMovers(category, limit)
  }

  async getPerformanceDistribution(windowDays = 1): Promise<PerformanceDistributionResponse> {
    await simulateDelay()
    return mockMarket.mockDistribution(windowDays)
  }

  async getMarketHeatmap(windowDays = 1, limit = 100): Promise<HeatmapResponse> {
    await simulateDelay()
    return mockMarket.mockHeatmap(windowDays, limit)
  }

  async getQuotes(symbols: string[]): Promise<SymbolQuote[]> {
    await simulateDelay()
    return symbols.map(symbol => mockMarket.mockQuote(symbol.toUpperCase()))
  }

  // Symbol analysis endpoints
  async getTechnicalAnalysis(symbol: string): Promise<TechnicalAnalysisResponse> {
    await simulateDelay()
    return mockMarket.mockTechnicalAnalysis(symbol.toUpperCase())
  }

  async getIndicatorSnapshot(symbol: string): Promise<IndicatorSnapshot> {
    await simulateDelay()
    return mockMarket.mockIndicatorSnapshot(symbol.toUpperCase())
  }

  async getIndicatorSeries(symbol: string, names: string[], limit = 250): Promise<IndicatorSeriesResponse> {
    await simulateDelay()
    return mockMarket.mockIndicatorSeries(symbol.toUpperCase(), names, limit)
  }

  async getRiskMetrics(symbol: string, windowDays = 252, benchmark?: string): Promise<RiskMetrics> {
    await simulateDelay()
    return mockMarket.mockRiskMetrics(symbol.toUpperCase(), windowDays, benchmark)
  }

  async comparePeers(symbol: string, peers: string[], windowDays = 252): Promise<PeerComparisonResponse> {
    await simulateDelay()
    return mockMarket.mockPeerComparison(symbol.toUpperCase(), peers.map(p => p.toUpperCase()), windowDays)
  }

  async getSeasonality(symbol: string, granularity: 'month' | 'weekday' = 'month'): Promise<SeasonalityResponse> {
    await simulateDelay()
    return mockMarket.mockSeasonality(symbol.toUpperCase(), granularity)
  }

  async getSymbolProfile(symbol: string, benchmark?: string): Promise<SymbolProfileResponse> {
    await simulateDelay()
    return mockMarket.mockSymbolProfile(symbol.toUpperCase(), benchmark)
  }

  async getCorrelationMatrix(symbols: string[], windowDays = 252): Promise<CorrelationResponse> {
    await simulateDelay()
    return mockMarket.mockCorrelation(symbols.map(s => s.toUpperCase()), windowDays)
  }

  // Screener endpoints
  async runScreen(request: ScreenerRequest): Promise<ScreenerResponse> {
    await simulateDelay()
    return mockMarket.mockScreen(request)
  }

  async getScreenerPresets(): Promise<ScreenerPresetsResponse> {
    await simulateDelay()
    return mockMarket.mockScreenerPresets()
  }

  async runScreenerPreset(
    presetId: string,
    limit = 50,
    offset = 0,
    index: StockIndex = 'all'
  ): Promise<ScreenerResponse> {
    await simulateDelay()
    console.log('Mock: Running screener preset', presetId)
    return mockMarket.mockScreen({ filters: { index }, limit, offset })
  }

  // Saved strategies live in memory for the session: mock mode exists to make
  // the UI explorable, and a screen that vanishes on save would not do that.
  private screenerStrategies: ScreenerStrategy[] = []

  async listScreenerStrategies(): Promise<ScreenerStrategyListResponse> {
    await simulateDelay()
    return {
      strategies: [...this.screenerStrategies],
      total_count: this.screenerStrategies.length
    }
  }

  async createScreenerStrategy(
    request: ScreenerStrategyCreateRequest
  ): Promise<ScreenerStrategy> {
    await simulateDelay()
    if (this.screenerStrategies.some(s => s.name === request.name)) {
      throw new Error(`Strategy '${request.name}' already exists`)
    }
    const now = new Date().toISOString()
    const strategy: ScreenerStrategy = {
      id: `mock-${Date.now()}`,
      user_id: 'mock-user',
      name: request.name,
      filters: request.filters,
      sort_by: request.sort_by ?? 'change_percent',
      sort_direction: request.sort_direction ?? 'desc',
      created_at: now,
      updated_at: now
    }
    this.screenerStrategies.push(strategy)
    return strategy
  }

  async updateScreenerStrategy(
    strategyId: string,
    request: ScreenerStrategyUpdateRequest
  ): Promise<ScreenerStrategy> {
    await simulateDelay()
    const strategy = this.screenerStrategies.find(s => s.id === strategyId)
    if (!strategy) throw new Error('Strategy not found')
    Object.assign(strategy, request, { updated_at: new Date().toISOString() })
    return strategy
  }

  async deleteScreenerStrategy(strategyId: string): Promise<void> {
    await simulateDelay()
    this.screenerStrategies = this.screenerStrategies.filter(s => s.id !== strategyId)
  }

  async runScreenerStrategy(
    strategyId: string,
    limit = 50,
    offset = 0,
    index?: StockIndex
  ): Promise<ScreenerResponse> {
    await simulateDelay()
    const strategy = this.screenerStrategies.find(s => s.id === strategyId)
    const filters = { ...(strategy?.filters ?? {}), ...(index ? { index } : {}) }
    return mockMarket.mockScreen({ filters, limit, offset })
  }

  // Watchlist endpoints
  async getWatchlists(): Promise<WatchlistListResponse> {
    await simulateDelay()
    return mockMarket.mockWatchlists()
  }

  async createWatchlist(name: string, symbols: string[] = []): Promise<Watchlist> {
    await simulateDelay()
    return mockMarket.mockCreateWatchlist(name, symbols)
  }

  async getWatchlist(watchlistId: string): Promise<Watchlist> {
    await simulateDelay()
    return mockMarket.mockWatchlist(watchlistId)
  }

  async deleteWatchlist(watchlistId: string): Promise<void> {
    await simulateDelay()
    console.log('Mock: Deleted watchlist', watchlistId)
  }

  async addWatchlistSymbol(watchlistId: string, symbol: string): Promise<Watchlist> {
    await simulateDelay()
    const watchlist = mockMarket.mockWatchlist(watchlistId)
    if (!watchlist.items.some(item => item.symbol === symbol.toUpperCase())) {
      watchlist.items.push({ symbol: symbol.toUpperCase(), note: null, added_at: new Date().toISOString() })
    }
    return watchlist
  }

  async removeWatchlistSymbol(watchlistId: string, symbol: string): Promise<Watchlist> {
    await simulateDelay()
    const watchlist = mockMarket.mockWatchlist(watchlistId)
    watchlist.items = watchlist.items.filter(item => item.symbol !== symbol.toUpperCase())
    return watchlist
  }

  async getWatchlistQuotes(watchlistId: string): Promise<WatchlistQuotesResponse> {
    await simulateDelay()
    return mockMarket.mockWatchlistQuotes(watchlistId)
  }

  // Alert endpoints
  async getAlerts(activeOnly = false): Promise<AlertListResponse> {
    await simulateDelay()
    return mockMarket.mockAlerts(activeOnly)
  }

  async createAlert(request: AlertCreateRequest): Promise<Alert> {
    await simulateDelay()
    return mockMarket.mockCreateAlert(request)
  }

  async deleteAlert(alertId: string): Promise<void> {
    await simulateDelay()
    mockMarket.mockDeleteAlert(alertId)
  }

  async checkAlerts(): Promise<AlertCheckResponse> {
    await simulateDelay()
    return mockMarket.mockCheckAlerts()
  }

  // Combined signal workspace
  async getLatestSignals(market = 'us'): Promise<SignalsResponse> {
    await simulateDelay()
    return mockSignals.mockLatestSignals(market)
  }

  async getSignalsByDate(date: string, market = 'us'): Promise<SignalsResponse> {
    await simulateDelay()
    return mockSignals.mockSignalsByDate(date, market)
  }

  async getSignalsDates(market = 'us', limit = 60): Promise<SignalsDatesResponse> {
    await simulateDelay()
    return mockSignals.mockSignalsDates(market, limit)
  }

  async getAlphaRankTickerHistory(
    ticker: string,
    market = 'us',
    limit = 250
  ): Promise<AlphaRankHistoryResponse> {
    await simulateDelay()
    return mockSignals.mockAlphaRankHistory(ticker, market, limit)
  }

  // Pivot picks
  async getPivotDates(market = 'us', limit = 60): Promise<PivotDatesResponse> {
    await simulateDelay()
    return mockPivot.mockPivotDates(market, limit)
  }

  async getLatestPivotPicks(
    market = 'us',
    direction?: PickDirection,
    event?: PickEvent,
    limit = 100
  ): Promise<PivotPicksResponse> {
    await simulateDelay()
    return mockPivot.mockLatestPivotPicks(market, direction, event, limit)
  }

  async getPivotPicksByDate(
    date: string,
    market = 'us',
    direction?: PickDirection,
    event?: PickEvent,
    limit = 100
  ): Promise<PivotPicksResponse> {
    await simulateDelay()
    return mockPivot.mockPivotPicksByDate(date, market, direction, event, limit)
  }

  async getPivotPickForSymbol(date: string, symbol: string, market = 'us'): Promise<PivotPick> {
    await simulateDelay()
    return mockPivot.mockPivotPickForSymbol(date, symbol, market)
  }

  async getPivotSymbolHistory(symbol: string, market = 'us', limit = 120): Promise<PivotHistoryResponse> {
    await simulateDelay()
    return mockPivot.mockPivotSymbolHistory(symbol, market, limit)
  }

  async getPivotSummary(market = 'us'): Promise<PivotSummary> {
    await simulateDelay()
    return mockPivot.mockPivotSummary(market)
  }

  async getPivotPerformance(
    market = 'us',
    direction?: PickDirection,
    event?: PickEvent
  ): Promise<PivotPerformance> {
    await simulateDelay()
    return mockPivot.mockPivotPerformance(market, direction, event)
  }

  async getPivotPerformanceBreakdown(market = 'us'): Promise<PivotPerformanceBreakdown> {
    await simulateDelay()
    return mockPivot.mockPivotPerformanceBreakdown(market)
  }

  async getLatestPivotRun(market = 'us'): Promise<PivotRun> {
    await simulateDelay()
    return mockPivot.mockLatestPivotRun(market)
  }

  // Utility methods
  isAuthenticated(): boolean {
    return true // Always authenticated in mock mode
  }

  getCurrentUserFromStorage(): User | null {
    return mockUser
  }
}

export const mockService = new MockService()

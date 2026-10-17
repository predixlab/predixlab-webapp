import axios, { AxiosInstance, AxiosError } from 'axios'

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
  ApiError,
  Prediction,
  AnomalyOption,
  OptionsAnomalyDatesResponse,
  GexAnalysis,
  GexAvailableDatesResponse,
  GexAvailableSymbolsResponse,
  GexHighlightSignal,
  GexHighlightsResponse,
  OptionsStructureAnalysis,
  OptionsStructureHighlightSignal,
  OptionsStructureHighlightsResponse,
  SubscriptionInfo,
  CreateCheckoutSessionRequest,
  CheckoutSessionResponse,
  SubscriptionPricesResponse,
  MarketOverviewResponse,
  MarketBreadth,
  MarketSentiment,
  MoverCategory,
  MoversResponse,
  PerformanceDistributionResponse,
  HeatmapResponse,
  SymbolQuote,
  TechnicalAnalysisResponse,
  IndicatorSnapshot,
  IndicatorSeriesResponse,
  RiskMetrics,
  PeerComparisonResponse,
  SeasonalityResponse,
  SymbolProfileResponse,
  CorrelationResponse,
  ScreenerRequest,
  ScreenerResponse,
  ScreenerStrategy,
  ScreenerStrategyCreateRequest,
  ScreenerStrategyListResponse,
  ScreenerStrategyUpdateRequest,
  StockIndex,
  ScreenerPresetsResponse,
  Watchlist,
  WatchlistListResponse,
  WatchlistQuotesResponse,
  Alert,
  AlertCreateRequest,
  AlertListResponse,
  AlertCheckResponse,
  PivotPicksResponse,
  PivotPick,
  PickEvent,
  PivotDatesResponse,
  PivotHistoryResponse,
  PivotSummary,
  PivotPerformance,
  PivotPerformanceBreakdown,
  PivotRun,
  PickDirection,
  AlphaRankHistoryResponse,
  SignalsDatesResponse,
  SignalsResponse,
  ReferralClickRequest,
  ReferralValidationResponse,
  ReferralSummary,
} from '@/types'

export const isUnauthorizedError = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 401
  }

  return (
    typeof error === 'object' &&
    error !== null &&
    'status_code' in error &&
    error.status_code === 401
  )
}

class ApiClient {
  private client: AxiosInstance
  private refreshTokenPromise: Promise<string | null> | null = null

  constructor() {
    const baseURL = import.meta.env.PROD ? 'https://api.predixlab.com/api' : '/api'
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const isAuthRequest = config.url?.includes('/v1/auth/')
        if (!isAuthRequest && this.getRefreshToken()) {
          try {
            await this.initializeSession()
          } catch (error) {
            if (isUnauthorizedError(error)) {
              this.clearAuthAndRedirect()
            }
            return Promise.reject(error)
          }
        }

        const token = this.getAccessToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: unknown) => {
        if (!axios.isAxiosError(error)) {
          return Promise.reject(error)
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- axios request config is loosely typed here to attach the _retry flag
        const originalRequest = (error.config || {}) as any

        // Prevent attempting to refresh if the failing request is the refresh endpoint itself.
        // This avoids an infinite loop when the refresh token is invalid/expired.
        const refreshEndpoint = '/v1/auth/refresh'
        const requestUrl = originalRequest?.url || ''
        const baseUrl = this.client.defaults.baseURL || ''
        const isRefreshRequest =
          (typeof requestUrl === 'string' && requestUrl.includes(refreshEndpoint)) ||
          requestUrl === `${baseUrl}${refreshEndpoint}`

        if (error.response?.status === 401 && originalRequest._retry) {
          this.clearAuthAndRedirect()
          return Promise.reject(this.handleError(error))
        }

        if (error.response?.status === 401) {
          // Let the original request decide how to handle a failed refresh.
          if (isRefreshRequest) {
            return Promise.reject(this.handleError(error))
          }

          originalRequest._retry = true
          const hasStoredCredentials = Boolean(
            this.getAccessToken() || this.getRefreshToken()
          )

          try {
            const newToken = await this.refreshAccessToken()
            if (newToken) {
              originalRequest.headers = originalRequest.headers || {}
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return this.client(originalRequest)
            }
            if (hasStoredCredentials) {
              this.clearAuthAndRedirect()
            }
          } catch (refreshError) {
            if (isUnauthorizedError(refreshError)) {
              this.clearAuthAndRedirect()
            }
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(this.handleError(error))
      }
    )
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response?.data) {
      const data = error.response.data
      if (typeof data === 'object' && data !== null) {
        return {
          ...(data as ApiError),
          status_code: error.response.status,
        }
      }

      return {
        detail: typeof data === 'string' ? data : 'Request failed.',
        status_code: error.response.status,
      }
    }

    if (error.message === 'Network Error') {
      return { detail: 'Network error. Please check your connection.' }
    }

    return { detail: 'An unexpected error occurred.' }
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('access_token')
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token')
  }

  private isAccessTokenExpiring(): boolean {
    const expiresAt = Number(localStorage.getItem('access_token_expires_at'))
    return !Number.isFinite(expiresAt) || expiresAt <= Date.now() + 60_000
  }

  private setTokens(tokens: AuthToken): void {
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    localStorage.setItem(
      'access_token_expires_at',
      String(Date.now() + tokens.expires_in * 1000)
    )
    localStorage.setItem('user', JSON.stringify(tokens.user))
    sessionStorage.setItem('auth_session_last_request_at', String(Date.now()))
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('access_token_expires_at')
    localStorage.removeItem('user')
    sessionStorage.removeItem('auth_session_last_request_at')
  }

  private clearAuthAndRedirect(): void {
    this.clearTokens()
    window.location.href = '/login'
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise
    }

    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      return null
    }

    this.refreshTokenPromise = this.refreshToken({ refresh_token: refreshToken })
      .then((response) => {
        this.setTokens(response)
        return response.access_token
      })
      .finally(() => {
        this.refreshTokenPromise = null
      })

    return this.refreshTokenPromise
  }

  // Auth API methods - Email login/registration
  async requestEmailLoginCode(data: EmailLoginRequest): Promise<void> {
    const response = await this.client.post('/v1/auth/login/request-code', data)
    return response.data
  }

  async verifyEmailLogin(data: EmailLoginVerify): Promise<AuthToken> {
    const response = await this.client.post('/v1/auth/login', data)
    this.setTokens(response.data)
    return response.data
  }

  async requestEmailRegisterCode(data: EmailRegisterCodeRequest): Promise<void> {
    const response = await this.client.post('/v1/auth/register/request-code', data)
    return response.data
  }

  async registerUser(data: UserRegister): Promise<AuthToken> {
    const response = await this.client.post('/v1/auth/register', data)
    this.setTokens(response.data)
    return response.data
  }

  // OAuth methods
  getGoogleLoginUrl(referralCode?: string): string {
    const query = referralCode
      ? `?referral_code=${encodeURIComponent(referralCode)}`
      : ''
    return `${this.client.defaults.baseURL}/v1/auth/google${query}`
  }

  getMicrosoftLoginUrl(referralCode?: string): string {
    const query = referralCode
      ? `?referral_code=${encodeURIComponent(referralCode)}`
      : ''
    return `${this.client.defaults.baseURL}/v1/auth/microsoft${query}`
  }

  async exchangeOAuthCode(data: OAuthExchangeRequest): Promise<AuthToken> {
    const response = await this.client.post('/v1/auth/oauth/exchange', data)
    this.setTokens(response.data)
    return response.data
  }

  async confirmOAuthUser(data: OAuthConfirmRequest): Promise<AuthToken> {
    const response = await this.client.post('/v1/auth/oauth/confirm', data)
    this.setTokens(response.data)
    return response.data
  }

  // Token management
  private async initializeSession(): Promise<string | null> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise
    }

    const now = Date.now()
    const lastRequestAt = Number(
      sessionStorage.getItem('auth_session_last_request_at')
    )
    const idleDuration = now - lastRequestAt
    if (
      lastRequestAt > 0 &&
      idleDuration >= 0 &&
      idleDuration < 30 * 60 * 1000 &&
      !this.isAccessTokenExpiring()
    ) {
      sessionStorage.setItem('auth_session_last_request_at', String(now))
      return this.getAccessToken()
    }
    return this.refreshAccessToken()
  }

  async refreshToken(data: RefreshTokenRequest): Promise<AuthToken> {
    const response = await this.client.post('/v1/auth/refresh', data)
    return response.data
  }

  async logout(): Promise<void> {
    try {
      await this.refreshTokenPromise?.catch(() => undefined)
      const refreshToken = this.getRefreshToken()
      if (refreshToken) {
        await this.client.post('/v1/auth/logout', { refresh_token: refreshToken })
      }
    } finally {
      this.clearTokens()
    }
  }

  async logoutAllDevices(): Promise<void> {
    await this.refreshTokenPromise?.catch(() => undefined)
    await this.client.post('/v1/auth/logout/all')
    this.clearTokens()
  }

  // User profile
  async getCurrentUser(): Promise<User> {
    const response = await this.client.get('/v1/user/profile')
    return response.data
  }

  async updateUserProfile(data: UserUpdate): Promise<User> {
    const response = await this.client.patch('/v1/user/profile', data)
    return response.data
  }

  async acceptUserNotice(data: UserNoticeAcceptanceRequest): Promise<User> {
    const response = await this.client.post('/v1/user/notice/accept', data)
    localStorage.setItem('user', JSON.stringify(response.data))
    return response.data
  }

  async deleteAccount(data: AccountDeletionRequest): Promise<void> {
    await this.client.delete('/v1/user/account', { data })
    this.clearTokens()
  }

  async trackReferralClick(
    data: ReferralClickRequest,
  ): Promise<ReferralValidationResponse> {
    const response = await this.client.post('/v1/referrals/click', data)
    return response.data
  }

  async getReferralSummary(): Promise<ReferralSummary> {
    const response = await this.client.get('/v1/referrals/summary')
    return response.data
  }

  // OAuth link account method
  async linkOAuthAccount(data: OAuthLinkRequest): Promise<void> {
    const response = await this.client.post('/v1/auth/oauth/link', data)
    return response.data
  }

  // Stocks API methods - Updated to match OpenAPI specification
  async getAvailableDates(): Promise<AvailableDatesResponse> {
    const response = await this.client.get('/v1/stocks/dates')
    return response.data
  }

  async getDailyPicks(date: string, direction?: Direction): Promise<DailyPicksResponse> {
    const response = await this.client.get(`/v1/stocks/picks/${date}`, {
      params: direction ? { direction } : undefined
    })
    return response.data
  }

  async getRisingPicks(date: string): Promise<DailyPicksResponse> {
    const response = await this.client.get(`/v1/stocks/picks/${date}/rising`)
    return response.data
  }

  async getFallingPicks(date: string): Promise<DailyPicksResponse> {
    const response = await this.client.get(`/v1/stocks/picks/${date}/falling`)
    return response.data
  }

  async getLatestPicks(): Promise<DailyPicksResponse> {
    const response = await this.client.get('/v1/stocks/latest-picks')
    return response.data
  }

  async getPredictions(date: string): Promise<PredictionsResponse> {
    const response = await this.client.get(`/v1/stocks/predictions/${date}`)
    return response.data
  }

  async getLatestPredictions(market = 'us'): Promise<LatestPredictionsResponse> {
    const response = await this.client.get('/v1/stocks/latest-predictions', {
      params: { market }
    })
    return response.data
  }

  async getPredictionByDateAndInstrument(date: string, instrument: string, market = 'us'): Promise<Prediction> {
    const response = await this.client.get(`/v1/stocks/predictions/${date}/${instrument}`, {
      params: { market }
    })
    return response.data
  }

  // Options - anomalies endpoints
  async getOptionAnomalies(offset = 0, limit = 20): Promise<AnomalyOption[]> {
    const response = await this.client.get('/v1/options/anomalies', {
      params: { offset, limit }
    })
    return response.data
  }

  async getLatestOptionAnomalies(): Promise<AnomalyOption[]> {
    const response = await this.client.get('/v1/options/anomalies/latest')
    return response.data
  }

  async getOptionAnomalyDates(limit = 60): Promise<OptionsAnomalyDatesResponse> {
    const response = await this.client.get('/v1/options/anomalies/dates', {
      params: { limit },
    })
    return response.data
  }

  async getOptionAnomaliesByDate(date: string): Promise<AnomalyOption[]> {
    const response = await this.client.get(`/v1/options/anomalies/${date}`)
    return response.data
  }

  async getLatestGex(symbol: string): Promise<GexAnalysis> {
    const response = await this.client.get(`/v1/options/gex/latest/${symbol}`)
    return response.data
  }

  async getGexByDate(date: string, symbol: string): Promise<GexAnalysis> {
    const response = await this.client.get(`/v1/options/gex/${date}/${symbol}`)
    return response.data
  }

  async getGexDates(symbol: string, limit = 60): Promise<GexAvailableDatesResponse> {
    const response = await this.client.get(`/v1/options/gex/dates/${symbol}`, {
      params: { limit },
    })
    return response.data
  }

  async getGexSymbols(query = '', limit = 1000): Promise<GexAvailableSymbolsResponse> {
    const response = await this.client.get('/v1/options/gex-symbols', {
      params: { query, limit },
    })
    return response.data
  }

  async getGexHighlights(
    limit = 6,
    signal?: GexHighlightSignal,
  ): Promise<GexHighlightsResponse> {
    const response = await this.client.get('/v1/options/gex/highlights', {
      params: { limit, signal },
    })
    return response.data
  }

  async getLatestOptionsStructure(symbol: string): Promise<OptionsStructureAnalysis> {
    const response = await this.client.get(`/v1/options/structure/latest/${symbol}`)
    return response.data
  }

  async getOptionsStructureHighlights(
    limit = 6,
    signal?: OptionsStructureHighlightSignal,
  ): Promise<OptionsStructureHighlightsResponse> {
    const response = await this.client.get('/v1/options/structure/highlights', {
      params: { limit, signal },
    })
    return response.data
  }

  async getOptionsStructureSymbols(
    query = '',
    limit = 1000,
  ): Promise<GexAvailableSymbolsResponse> {
    const response = await this.client.get('/v1/options/structure-symbols', {
      params: { query, limit },
    })
    return response.data
  }

  async getStockData(symbol: string, startDate?: string, endDate?: string, period?: string): Promise<StockDataResponse> {
    const response = await this.client.get(`/v1/stocks/data/${symbol}`, {
      params: {
        start_date: startDate,
        end_date: endDate,
        period
      }
    })
    return response.data
  }

  async getAllStocks(limit?: number, offset?: number): Promise<StockListResponse> {
    const response = await this.client.get('/v1/stocks/symbols', {
      params: { limit, offset }
    })
    return response.data
  }

  async searchStocks(query: string, matchType: MatchType = 'infix', limit?: number): Promise<StockListResponse> {
    const response = await this.client.get('/v1/stocks/search', {
      params: {
        q: query,
        match_type: matchType,
        limit
      }
    })
    return response.data
  }

  async runBacktest(symbol: string, periodDays = 90): Promise<BacktestResult> {
    const response = await this.client.get(`/v1/stocks/backtest/${symbol}`, {
      params: { period_days: periodDays }
    })
    return response.data
  }


  // Subscription API methods - From OpenAPI specification
  async createCheckoutSession(data: CreateCheckoutSessionRequest): Promise<CheckoutSessionResponse> {
    const response = await this.client.post('/v1/subscription/create-checkout-session', data)
    return response.data
  }

  async getSubscriptionInfo(): Promise<SubscriptionInfo | null> {
    const response = await this.client.get('/v1/subscription/info')
    return response.data
  }

  async cancelSubscription(): Promise<void> {
    const response = await this.client.post('/v1/subscription/cancel')
    return response.data
  }

  async getSubscriptionPrices(): Promise<SubscriptionPricesResponse> {
    const response = await this.client.get('/v1/subscription/prices')
    return response.data
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Stripe publishable-key payload shape is provider-defined
  async getStripePublishableKey(): Promise<any> {
    const response = await this.client.get('/v1/subscription/publishable-key')
    return response.data
  }

  // Market intelligence endpoints
  async getMarketOverview(moversLimit = 5): Promise<MarketOverviewResponse> {
    const response = await this.client.get('/v1/market/overview', {
      params: { movers_limit: moversLimit }
    })
    return response.data
  }

  async getMarketBreadth(): Promise<MarketBreadth> {
    const response = await this.client.get('/v1/market/breadth')
    return response.data
  }

  async getMarketSentiment(): Promise<MarketSentiment> {
    const response = await this.client.get('/v1/market/sentiment')
    return response.data
  }

  async getMarketMovers(category: MoverCategory = 'gainers', limit = 20): Promise<MoversResponse> {
    const response = await this.client.get('/v1/market/movers', {
      params: { category, limit }
    })
    return response.data
  }

  async getPerformanceDistribution(windowDays = 1): Promise<PerformanceDistributionResponse> {
    const response = await this.client.get('/v1/market/performance-distribution', {
      params: { window_days: windowDays }
    })
    return response.data
  }

  async getMarketHeatmap(windowDays = 1, limit = 100): Promise<HeatmapResponse> {
    const response = await this.client.get('/v1/market/heatmap', {
      params: { window_days: windowDays, limit }
    })
    return response.data
  }

  async getQuotes(symbols: string[]): Promise<SymbolQuote[]> {
    const response = await this.client.get('/v1/market/quotes', {
      params: { symbols: symbols.join(',') }
    })
    return response.data
  }

  // Symbol analysis endpoints
  async getTechnicalAnalysis(symbol: string): Promise<TechnicalAnalysisResponse> {
    const response = await this.client.get(`/v1/analysis/${symbol}/technical`)
    return response.data
  }

  async getIndicatorSnapshot(symbol: string): Promise<IndicatorSnapshot> {
    const response = await this.client.get(`/v1/analysis/${symbol}/indicators`)
    return response.data
  }

  async getIndicatorSeries(symbol: string, names: string[], limit = 250): Promise<IndicatorSeriesResponse> {
    const response = await this.client.get(`/v1/analysis/${symbol}/indicators/series`, {
      params: { names: names.join(','), limit }
    })
    return response.data
  }

  async getRiskMetrics(symbol: string, windowDays = 252, benchmark?: string): Promise<RiskMetrics> {
    const response = await this.client.get(`/v1/analysis/${symbol}/risk`, {
      params: { window_days: windowDays, benchmark }
    })
    return response.data
  }

  async comparePeers(symbol: string, peers: string[], windowDays = 252): Promise<PeerComparisonResponse> {
    const response = await this.client.get(`/v1/analysis/${symbol}/peers`, {
      params: { peers: peers.join(','), window_days: windowDays }
    })
    return response.data
  }

  async getSeasonality(symbol: string, granularity: 'month' | 'weekday' = 'month'): Promise<SeasonalityResponse> {
    const response = await this.client.get(`/v1/analysis/${symbol}/seasonality`, {
      params: { granularity }
    })
    return response.data
  }

  async getSymbolProfile(symbol: string, benchmark?: string, includePrediction = true): Promise<SymbolProfileResponse> {
    const response = await this.client.get(`/v1/analysis/${symbol}/profile`, {
      params: { benchmark, include_prediction: includePrediction }
    })
    return response.data
  }

  async getCorrelationMatrix(symbols: string[], windowDays = 252): Promise<CorrelationResponse> {
    const response = await this.client.get('/v1/analysis/correlation', {
      params: { symbols: symbols.join(','), window_days: windowDays }
    })
    return response.data
  }

  // Screener endpoints
  async runScreen(request: ScreenerRequest): Promise<ScreenerResponse> {
    const response = await this.client.post('/v1/screener/run', request)
    return response.data
  }

  async getScreenerPresets(): Promise<ScreenerPresetsResponse> {
    const response = await this.client.get('/v1/screener/presets')
    return response.data
  }

  async runScreenerPreset(
    presetId: string,
    limit = 50,
    offset = 0,
    index: StockIndex = 'all'
  ): Promise<ScreenerResponse> {
    const response = await this.client.get(`/v1/screener/presets/${presetId}`, {
      params: { limit, offset, index }
    })
    return response.data
  }

  // Saved screener strategies
  async listScreenerStrategies(): Promise<ScreenerStrategyListResponse> {
    const response = await this.client.get('/v1/screener/strategies')
    return response.data
  }

  async createScreenerStrategy(
    request: ScreenerStrategyCreateRequest
  ): Promise<ScreenerStrategy> {
    const response = await this.client.post('/v1/screener/strategies', request)
    return response.data
  }

  async updateScreenerStrategy(
    strategyId: string,
    request: ScreenerStrategyUpdateRequest
  ): Promise<ScreenerStrategy> {
    const response = await this.client.patch(`/v1/screener/strategies/${strategyId}`, request)
    return response.data
  }

  async deleteScreenerStrategy(strategyId: string): Promise<void> {
    await this.client.delete(`/v1/screener/strategies/${strategyId}`)
  }

  async runScreenerStrategy(
    strategyId: string,
    limit = 50,
    offset = 0,
    index?: StockIndex
  ): Promise<ScreenerResponse> {
    const response = await this.client.get(`/v1/screener/strategies/${strategyId}/run`, {
      params: { limit, offset, ...(index ? { index } : {}) }
    })
    return response.data
  }

  // Watchlist endpoints
  async getWatchlists(): Promise<WatchlistListResponse> {
    const response = await this.client.get('/v1/watchlist')
    return response.data
  }

  async createWatchlist(name: string, symbols: string[] = []): Promise<Watchlist> {
    const response = await this.client.post('/v1/watchlist', { name, symbols })
    return response.data
  }

  async getWatchlist(watchlistId: string): Promise<Watchlist> {
    const response = await this.client.get(`/v1/watchlist/${watchlistId}`)
    return response.data
  }

  async deleteWatchlist(watchlistId: string): Promise<void> {
    await this.client.delete(`/v1/watchlist/${watchlistId}`)
  }

  async addWatchlistSymbol(watchlistId: string, symbol: string, note?: string): Promise<Watchlist> {
    const response = await this.client.post(`/v1/watchlist/${watchlistId}/symbols`, { symbol, note })
    return response.data
  }

  async removeWatchlistSymbol(watchlistId: string, symbol: string): Promise<Watchlist> {
    const response = await this.client.delete(`/v1/watchlist/${watchlistId}/symbols/${symbol}`)
    return response.data
  }

  async getWatchlistQuotes(watchlistId: string): Promise<WatchlistQuotesResponse> {
    const response = await this.client.get(`/v1/watchlist/${watchlistId}/quotes`)
    return response.data
  }

  // Alert endpoints
  async getAlerts(activeOnly = false): Promise<AlertListResponse> {
    const response = await this.client.get('/v1/alerts', {
      params: { active_only: activeOnly }
    })
    return response.data
  }

  async createAlert(request: AlertCreateRequest): Promise<Alert> {
    const response = await this.client.post('/v1/alerts', request)
    return response.data
  }

  async deleteAlert(alertId: string): Promise<void> {
    await this.client.delete(`/v1/alerts/${alertId}`)
  }

  async checkAlerts(): Promise<AlertCheckResponse> {
    const response = await this.client.post('/v1/alerts/check')
    return response.data
  }

  // Combined daily signal workspace. The dashboard uses these endpoints so
  // AlphaRank and Pivot always describe the same completed model session.
  async getLatestSignals(market = 'us'): Promise<SignalsResponse> {
    const response = await this.client.get('/v1/signals', {
      params: { market }
    })
    return response.data
  }

  async getSignalsByDate(date: string, market = 'us'): Promise<SignalsResponse> {
    const response = await this.client.get(`/v1/signals/${date}`, {
      params: { market }
    })
    return response.data
  }

  async getSignalsDates(market = 'us', limit = 60): Promise<SignalsDatesResponse> {
    const response = await this.client.get('/v1/signals/dates', {
      params: { market, limit }
    })
    return response.data
  }

  async getAlphaRankTickerHistory(
    ticker: string,
    market = 'us',
    limit = 250
  ): Promise<AlphaRankHistoryResponse> {
    const response = await this.client.get(`/v1/signals/alpharank/tickers/${ticker}/history`, {
      params: { market, limit }
    })
    return response.data
  }

  // Pivot picks — the short list published by the predixlab-pivot job.
  // The scored cross-section it was chosen from is a model artifact and is not
  // exposed by the API.
  async getPivotDates(market = 'us', limit = 60): Promise<PivotDatesResponse> {
    const response = await this.client.get('/v1/pivot/dates', {
      params: { market, limit }
    })
    return response.data
  }

  async getLatestPivotPicks(
    market = 'us',
    direction?: PickDirection,
    event?: PickEvent,
    limit = 100
  ): Promise<PivotPicksResponse> {
    const response = await this.client.get('/v1/pivot/picks/latest', {
      params: { market, direction, event, limit }
    })
    return response.data
  }

  async getPivotPicksByDate(
    date: string,
    market = 'us',
    direction?: PickDirection,
    event?: PickEvent,
    limit = 100
  ): Promise<PivotPicksResponse> {
    const response = await this.client.get(`/v1/pivot/picks/${date}`, {
      params: { market, direction, event, limit }
    })
    return response.data
  }

  async getPivotPickForSymbol(date: string, symbol: string, market = 'us'): Promise<PivotPick> {
    const response = await this.client.get(`/v1/pivot/picks/${date}/${symbol}`, {
      params: { market }
    })
    return response.data
  }

  async getPivotSymbolHistory(symbol: string, market = 'us', limit = 120): Promise<PivotHistoryResponse> {
    const response = await this.client.get(`/v1/pivot/symbols/${symbol}/history`, {
      params: { market, limit }
    })
    return response.data
  }

  async getPivotSummary(market = 'us'): Promise<PivotSummary> {
    const response = await this.client.get('/v1/pivot/summary', {
      params: { market }
    })
    return response.data
  }

  async getPivotPerformance(
    market = 'us',
    direction?: PickDirection,
    event?: PickEvent
  ): Promise<PivotPerformance> {
    const response = await this.client.get('/v1/pivot/performance', {
      params: { market, direction, event }
    })
    return response.data
  }

  async getPivotPerformanceBreakdown(market = 'us'): Promise<PivotPerformanceBreakdown> {
    const response = await this.client.get('/v1/pivot/performance/breakdown', {
      params: { market }
    })
    return response.data
  }

  async getLatestPivotRun(market = 'us'): Promise<PivotRun> {
    const response = await this.client.get('/v1/pivot/runs/latest', {
      params: { market }
    })
    return response.data
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  }

  getCurrentUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
    return null
  }
}

export const apiClient = new ApiClient()
export default apiClient

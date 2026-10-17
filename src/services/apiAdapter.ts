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

import { apiClient } from './api'
import { mockService } from './mockService'

// Check if mock mode is enabled via query parameter
const isMockMode = (): boolean => {
  if (import.meta.env.PROD) return false
  if (typeof window === 'undefined') return false
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('mock') === 'true'
}

// API Adapter that switches between real API and mock service
class ApiAdapter {
  // Auth API methods - Email login/registration
  async requestEmailLoginCode(data: EmailLoginRequest): Promise<void> {
    if (isMockMode()) {
      return mockService.requestEmailLoginCode(data)
    }
    return apiClient.requestEmailLoginCode(data)
  }

  async verifyEmailLogin(data: EmailLoginVerify): Promise<AuthToken> {
    if (isMockMode()) {
      return mockService.verifyEmailLogin(data)
    }
    return apiClient.verifyEmailLogin(data)
  }

  async requestEmailRegisterCode(data: EmailRegisterCodeRequest): Promise<void> {
    if (isMockMode()) {
      return mockService.requestEmailRegisterCode(data)
    }
    return apiClient.requestEmailRegisterCode(data)
  }

  async registerUser(data: UserRegister): Promise<AuthToken> {
    if (isMockMode()) {
      return mockService.registerUser(data)
    }
    return apiClient.registerUser(data)
  }

  // OAuth methods
  getGoogleLoginUrl(referralCode?: string): string {
    if (isMockMode()) {
      return mockService.getGoogleLoginUrl(referralCode)
    }
    return apiClient.getGoogleLoginUrl(referralCode)
  }

  getMicrosoftLoginUrl(referralCode?: string): string {
    if (isMockMode()) {
      return mockService.getMicrosoftLoginUrl(referralCode)
    }
    return apiClient.getMicrosoftLoginUrl(referralCode)
  }

  async exchangeOAuthCode(data: OAuthExchangeRequest): Promise<AuthToken> {
    if (isMockMode()) {
      return mockService.exchangeOAuthCode(data)
    }
    return apiClient.exchangeOAuthCode(data)
  }

  async confirmOAuthUser(data: OAuthConfirmRequest): Promise<AuthToken> {
    if (isMockMode()) {
      return mockService.confirmOAuthUser(data)
    }
    return apiClient.confirmOAuthUser(data)
  }

  // Token management
  async refreshToken(data: RefreshTokenRequest): Promise<AuthToken> {
    if (isMockMode()) {
      return mockService.refreshToken(data)
    }
    return apiClient.refreshToken(data)
  }

  async logout(): Promise<void> {
    if (isMockMode()) {
      return mockService.logout()
    }
    return apiClient.logout()
  }

  async logoutAllDevices(): Promise<void> {
    if (isMockMode()) {
      return mockService.logoutAllDevices()
    }
    return apiClient.logoutAllDevices()
  }

  // User profile
  async getCurrentUser(): Promise<User> {
    if (isMockMode()) {
      return mockService.getCurrentUser()
    }
    return apiClient.getCurrentUser()
  }

  async updateUserProfile(data: UserUpdate): Promise<User> {
    if (isMockMode()) {
      return mockService.updateUserProfile(data)
    }
    return apiClient.updateUserProfile(data)
  }

  async deleteAccount(data: AccountDeletionRequest): Promise<void> {
    if (isMockMode()) {
      return mockService.deleteAccount(data)
    }
    return apiClient.deleteAccount(data)
  }

  async trackReferralClick(
    data: ReferralClickRequest,
  ): Promise<ReferralValidationResponse> {
    if (isMockMode()) {
      return mockService.trackReferralClick(data)
    }
    return apiClient.trackReferralClick(data)
  }

  async getReferralSummary(): Promise<ReferralSummary> {
    if (isMockMode()) {
      return mockService.getReferralSummary()
    }
    return apiClient.getReferralSummary()
  }

  async acceptUserNotice(data: UserNoticeAcceptanceRequest): Promise<User> {
    if (isMockMode()) {
      return mockService.acceptUserNotice(data)
    }
    return apiClient.acceptUserNotice(data)
  }

  // OAuth link account method
  async linkOAuthAccount(data: OAuthLinkRequest): Promise<void> {
    if (isMockMode()) {
      return mockService.linkOAuthAccount(data)
    }
    return apiClient.linkOAuthAccount(data)
  }

  // Stocks API methods - Updated to match OpenAPI specification
  async getAvailableDates(): Promise<AvailableDatesResponse> {
    if (isMockMode()) {
      return mockService.getAvailableDates()
    }
    return apiClient.getAvailableDates()
  }

  async getDailyPicks(date: string, direction?: Direction): Promise<DailyPicksResponse> {
    if (isMockMode()) {
      return mockService.getDailyPicks(date, direction)
    }
    return apiClient.getDailyPicks(date, direction)
  }

  async getRisingPicks(date: string): Promise<DailyPicksResponse> {
    if (isMockMode()) {
      return mockService.getRisingPicks(date)
    }
    return apiClient.getRisingPicks(date)
  }

  async getFallingPicks(date: string): Promise<DailyPicksResponse> {
    if (isMockMode()) {
      return mockService.getFallingPicks(date)
    }
    return apiClient.getFallingPicks(date)
  }

  async getLatestPicks(): Promise<DailyPicksResponse> {
    if (isMockMode()) {
      return mockService.getLatestPicks()
    }
    return apiClient.getLatestPicks()
  }

  async getPredictions(date: string): Promise<PredictionsResponse> {
    if (isMockMode()) {
      return mockService.getPredictions(date)
    }
    return apiClient.getPredictions(date)
  }

  async getStockData(symbol: string, startDate?: string, endDate?: string, period?: string): Promise<StockDataResponse> {
    if (isMockMode()) {
      return mockService.getStockData(symbol, startDate, endDate, period)
    }
    return apiClient.getStockData(symbol, startDate, endDate, period)
  }

  async getAllStocks(limit?: number, offset?: number): Promise<StockListResponse> {
    if (isMockMode()) {
      return mockService.getAllStocks(limit, offset)
    }
    return apiClient.getAllStocks(limit, offset)
  }

  async searchStocks(query: string, matchType: MatchType = 'infix', limit?: number): Promise<StockListResponse> {
    if (isMockMode()) {
      return mockService.searchStocks(query, matchType, limit)
    }
    return apiClient.searchStocks(query, matchType, limit)
  }

  async runBacktest(symbol: string, periodDays = 90): Promise<BacktestResult> {
    if (isMockMode()) {
      return mockService.runBacktest(symbol, periodDays)
    }
    return apiClient.runBacktest(symbol, periodDays)
  }

  // New API methods from OpenAPI specification
  async getLatestPredictions(market = 'us'): Promise<LatestPredictionsResponse> {
    if (isMockMode()) {
      return mockService.getLatestPredictions(market)
    }
    return apiClient.getLatestPredictions(market)
  }

  async getPredictionByDateAndInstrument(date: string, instrument: string, market = 'us'): Promise<Prediction> {
    if (isMockMode()) {
      return mockService.getPredictionByDateAndInstrument(date, instrument, market)
    }
    return apiClient.getPredictionByDateAndInstrument(date, instrument, market)
  }

  // Options - anomalies endpoints
  async getOptionAnomalies(offset = 0, limit = 20): Promise<AnomalyOption[]> {
    if (isMockMode()) {
      return mockService.getOptionAnomalies(offset, limit)
    }
    return apiClient.getOptionAnomalies(offset, limit)
  }

  async getLatestOptionAnomalies(): Promise<AnomalyOption[]> {
    if (isMockMode()) {
      return mockService.getLatestOptionAnomalies()
    }
    return apiClient.getLatestOptionAnomalies()
  }

  async getOptionAnomalyDates(limit = 60): Promise<OptionsAnomalyDatesResponse> {
    if (isMockMode()) {
      return mockService.getOptionAnomalyDates(limit)
    }
    return apiClient.getOptionAnomalyDates(limit)
  }

  async getOptionAnomaliesByDate(date: string): Promise<AnomalyOption[]> {
    if (isMockMode()) {
      return mockService.getOptionAnomaliesByDate(date)
    }
    return apiClient.getOptionAnomaliesByDate(date)
  }

  async getLatestGex(symbol: string): Promise<GexAnalysis> {
    if (isMockMode()) {
      return mockService.getLatestGex(symbol)
    }
    return apiClient.getLatestGex(symbol)
  }

  async getGexByDate(date: string, symbol: string): Promise<GexAnalysis> {
    if (isMockMode()) {
      return mockService.getGexByDate(date, symbol)
    }
    return apiClient.getGexByDate(date, symbol)
  }

  async getGexDates(symbol: string, limit = 60): Promise<GexAvailableDatesResponse> {
    if (isMockMode()) {
      return mockService.getGexDates(symbol, limit)
    }
    return apiClient.getGexDates(symbol, limit)
  }

  async getGexSymbols(query = '', limit = 1000): Promise<GexAvailableSymbolsResponse> {
    if (isMockMode()) {
      return mockService.getGexSymbols(query, limit)
    }
    return apiClient.getGexSymbols(query, limit)
  }

  async getGexHighlights(
    limit = 6,
    signal?: GexHighlightSignal,
  ): Promise<GexHighlightsResponse> {
    if (isMockMode()) {
      return mockService.getGexHighlights(limit, signal)
    }
    return apiClient.getGexHighlights(limit, signal)
  }

  async getLatestOptionsStructure(symbol: string): Promise<OptionsStructureAnalysis> {
    if (isMockMode()) {
      return mockService.getLatestOptionsStructure(symbol)
    }
    return apiClient.getLatestOptionsStructure(symbol)
  }

  async getOptionsStructureHighlights(
    limit = 6,
    signal?: OptionsStructureHighlightSignal,
  ): Promise<OptionsStructureHighlightsResponse> {
    if (isMockMode()) {
      return mockService.getOptionsStructureHighlights(limit, signal)
    }
    return apiClient.getOptionsStructureHighlights(limit, signal)
  }

  async getOptionsStructureSymbols(
    query = '',
    limit = 1000,
  ): Promise<GexAvailableSymbolsResponse> {
    if (isMockMode()) {
      return mockService.getOptionsStructureSymbols(query, limit)
    }
    return apiClient.getOptionsStructureSymbols(query, limit)
  }

  // Subscription API methods
  async createCheckoutSession(data: CreateCheckoutSessionRequest): Promise<CheckoutSessionResponse> {
    if (isMockMode()) {
      return mockService.createCheckoutSession(data)
    }
    return apiClient.createCheckoutSession(data)
  }

  async getSubscriptionInfo(): Promise<SubscriptionInfo | null> {
    if (isMockMode()) {
      return mockService.getSubscriptionInfo()
    }
    return apiClient.getSubscriptionInfo()
  }

  async cancelSubscription(): Promise<void> {
    if (isMockMode()) {
      return mockService.cancelSubscription()
    }
    return apiClient.cancelSubscription()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- delegates to provider-defined subscription price payload
  async getSubscriptionPrices(): Promise<any> {
    if (isMockMode()) {
      return mockService.getSubscriptionPrices()
    }
    return apiClient.getSubscriptionPrices()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Stripe publishable-key payload shape is provider-defined
  async getStripePublishableKey(): Promise<any> {
    if (isMockMode()) {
      return mockService.getStripePublishableKey()
    }
    return apiClient.getStripePublishableKey()
  }

  // Market intelligence endpoints
  async getMarketOverview(moversLimit = 5): Promise<MarketOverviewResponse> {
    if (isMockMode()) {
      return mockService.getMarketOverview(moversLimit)
    }
    return apiClient.getMarketOverview(moversLimit)
  }

  async getMarketBreadth(): Promise<MarketBreadth> {
    if (isMockMode()) {
      return mockService.getMarketBreadth()
    }
    return apiClient.getMarketBreadth()
  }

  async getMarketSentiment(): Promise<MarketSentiment> {
    if (isMockMode()) {
      return mockService.getMarketSentiment()
    }
    return apiClient.getMarketSentiment()
  }

  async getMarketMovers(category: MoverCategory = 'gainers', limit = 20): Promise<MoversResponse> {
    if (isMockMode()) {
      return mockService.getMarketMovers(category, limit)
    }
    return apiClient.getMarketMovers(category, limit)
  }

  async getPerformanceDistribution(windowDays = 1): Promise<PerformanceDistributionResponse> {
    if (isMockMode()) {
      return mockService.getPerformanceDistribution(windowDays)
    }
    return apiClient.getPerformanceDistribution(windowDays)
  }

  async getMarketHeatmap(windowDays = 1, limit = 100): Promise<HeatmapResponse> {
    if (isMockMode()) {
      return mockService.getMarketHeatmap(windowDays, limit)
    }
    return apiClient.getMarketHeatmap(windowDays, limit)
  }

  async getQuotes(symbols: string[]): Promise<SymbolQuote[]> {
    if (isMockMode()) {
      return mockService.getQuotes(symbols)
    }
    return apiClient.getQuotes(symbols)
  }

  // Symbol analysis endpoints
  async getTechnicalAnalysis(symbol: string): Promise<TechnicalAnalysisResponse> {
    if (isMockMode()) {
      return mockService.getTechnicalAnalysis(symbol)
    }
    return apiClient.getTechnicalAnalysis(symbol)
  }

  async getIndicatorSnapshot(symbol: string): Promise<IndicatorSnapshot> {
    if (isMockMode()) {
      return mockService.getIndicatorSnapshot(symbol)
    }
    return apiClient.getIndicatorSnapshot(symbol)
  }

  async getIndicatorSeries(symbol: string, names: string[], limit = 250): Promise<IndicatorSeriesResponse> {
    if (isMockMode()) {
      return mockService.getIndicatorSeries(symbol, names, limit)
    }
    return apiClient.getIndicatorSeries(symbol, names, limit)
  }

  async getRiskMetrics(symbol: string, windowDays = 252, benchmark?: string): Promise<RiskMetrics> {
    if (isMockMode()) {
      return mockService.getRiskMetrics(symbol, windowDays, benchmark)
    }
    return apiClient.getRiskMetrics(symbol, windowDays, benchmark)
  }

  async comparePeers(symbol: string, peers: string[], windowDays = 252): Promise<PeerComparisonResponse> {
    if (isMockMode()) {
      return mockService.comparePeers(symbol, peers, windowDays)
    }
    return apiClient.comparePeers(symbol, peers, windowDays)
  }

  async getSeasonality(symbol: string, granularity: 'month' | 'weekday' = 'month'): Promise<SeasonalityResponse> {
    if (isMockMode()) {
      return mockService.getSeasonality(symbol, granularity)
    }
    return apiClient.getSeasonality(symbol, granularity)
  }

  async getSymbolProfile(symbol: string, benchmark?: string, includePrediction = true): Promise<SymbolProfileResponse> {
    if (isMockMode()) {
      return mockService.getSymbolProfile(symbol, benchmark)
    }
    return apiClient.getSymbolProfile(symbol, benchmark, includePrediction)
  }

  async getCorrelationMatrix(symbols: string[], windowDays = 252): Promise<CorrelationResponse> {
    if (isMockMode()) {
      return mockService.getCorrelationMatrix(symbols, windowDays)
    }
    return apiClient.getCorrelationMatrix(symbols, windowDays)
  }

  // Screener endpoints
  async runScreen(request: ScreenerRequest): Promise<ScreenerResponse> {
    if (isMockMode()) {
      return mockService.runScreen(request)
    }
    return apiClient.runScreen(request)
  }

  async getScreenerPresets(): Promise<ScreenerPresetsResponse> {
    if (isMockMode()) {
      return mockService.getScreenerPresets()
    }
    return apiClient.getScreenerPresets()
  }

  async runScreenerPreset(
    presetId: string,
    limit = 50,
    offset = 0,
    index: StockIndex = 'all'
  ): Promise<ScreenerResponse> {
    if (isMockMode()) {
      return mockService.runScreenerPreset(presetId, limit, offset)
    }
    return apiClient.runScreenerPreset(presetId, limit, offset, index)
  }

  // Saved screener strategies. Mock mode keeps them in memory so the page is
  // fully explorable without a backend.
  async listScreenerStrategies(): Promise<ScreenerStrategyListResponse> {
    if (isMockMode()) {
      return mockService.listScreenerStrategies()
    }
    return apiClient.listScreenerStrategies()
  }

  async createScreenerStrategy(
    request: ScreenerStrategyCreateRequest
  ): Promise<ScreenerStrategy> {
    if (isMockMode()) {
      return mockService.createScreenerStrategy(request)
    }
    return apiClient.createScreenerStrategy(request)
  }

  async updateScreenerStrategy(
    strategyId: string,
    request: ScreenerStrategyUpdateRequest
  ): Promise<ScreenerStrategy> {
    if (isMockMode()) {
      return mockService.updateScreenerStrategy(strategyId, request)
    }
    return apiClient.updateScreenerStrategy(strategyId, request)
  }

  async deleteScreenerStrategy(strategyId: string): Promise<void> {
    if (isMockMode()) {
      return mockService.deleteScreenerStrategy(strategyId)
    }
    return apiClient.deleteScreenerStrategy(strategyId)
  }

  async runScreenerStrategy(
    strategyId: string,
    limit = 50,
    offset = 0,
    index?: StockIndex
  ): Promise<ScreenerResponse> {
    if (isMockMode()) {
      return mockService.runScreenerStrategy(strategyId, limit, offset, index)
    }
    return apiClient.runScreenerStrategy(strategyId, limit, offset, index)
  }

  // Watchlist endpoints
  async getWatchlists(): Promise<WatchlistListResponse> {
    if (isMockMode()) {
      return mockService.getWatchlists()
    }
    return apiClient.getWatchlists()
  }

  async createWatchlist(name: string, symbols: string[] = []): Promise<Watchlist> {
    if (isMockMode()) {
      return mockService.createWatchlist(name, symbols)
    }
    return apiClient.createWatchlist(name, symbols)
  }

  async getWatchlist(watchlistId: string): Promise<Watchlist> {
    if (isMockMode()) {
      return mockService.getWatchlist(watchlistId)
    }
    return apiClient.getWatchlist(watchlistId)
  }

  async deleteWatchlist(watchlistId: string): Promise<void> {
    if (isMockMode()) {
      return mockService.deleteWatchlist(watchlistId)
    }
    return apiClient.deleteWatchlist(watchlistId)
  }

  async addWatchlistSymbol(watchlistId: string, symbol: string, note?: string): Promise<Watchlist> {
    if (isMockMode()) {
      return mockService.addWatchlistSymbol(watchlistId, symbol)
    }
    return apiClient.addWatchlistSymbol(watchlistId, symbol, note)
  }

  async removeWatchlistSymbol(watchlistId: string, symbol: string): Promise<Watchlist> {
    if (isMockMode()) {
      return mockService.removeWatchlistSymbol(watchlistId, symbol)
    }
    return apiClient.removeWatchlistSymbol(watchlistId, symbol)
  }

  async getWatchlistQuotes(watchlistId: string): Promise<WatchlistQuotesResponse> {
    if (isMockMode()) {
      return mockService.getWatchlistQuotes(watchlistId)
    }
    return apiClient.getWatchlistQuotes(watchlistId)
  }

  // Alert endpoints
  async getAlerts(activeOnly = false): Promise<AlertListResponse> {
    if (isMockMode()) {
      return mockService.getAlerts(activeOnly)
    }
    return apiClient.getAlerts(activeOnly)
  }

  async createAlert(request: AlertCreateRequest): Promise<Alert> {
    if (isMockMode()) {
      return mockService.createAlert(request)
    }
    return apiClient.createAlert(request)
  }

  async deleteAlert(alertId: string): Promise<void> {
    if (isMockMode()) {
      return mockService.deleteAlert(alertId)
    }
    return apiClient.deleteAlert(alertId)
  }

  async checkAlerts(): Promise<AlertCheckResponse> {
    if (isMockMode()) {
      return mockService.checkAlerts()
    }
    return apiClient.checkAlerts()
  }

  // Combined signal workspace
  async getLatestSignals(market = 'us'): Promise<SignalsResponse> {
    if (isMockMode()) {
      return mockService.getLatestSignals(market)
    }
    return apiClient.getLatestSignals(market)
  }

  async getSignalsByDate(date: string, market = 'us'): Promise<SignalsResponse> {
    if (isMockMode()) {
      return mockService.getSignalsByDate(date, market)
    }
    return apiClient.getSignalsByDate(date, market)
  }

  async getSignalsDates(market = 'us', limit = 60): Promise<SignalsDatesResponse> {
    if (isMockMode()) {
      return mockService.getSignalsDates(market, limit)
    }
    return apiClient.getSignalsDates(market, limit)
  }

  async getAlphaRankTickerHistory(
    ticker: string,
    market = 'us',
    limit = 250
  ): Promise<AlphaRankHistoryResponse> {
    if (isMockMode()) {
      return mockService.getAlphaRankTickerHistory(ticker, market, limit)
    }
    return apiClient.getAlphaRankTickerHistory(ticker, market, limit)
  }

  // Pivot picks
  async getPivotDates(market = 'us', limit = 60): Promise<PivotDatesResponse> {
    if (isMockMode()) {
      return mockService.getPivotDates(market, limit)
    }
    return apiClient.getPivotDates(market, limit)
  }

  async getLatestPivotPicks(
    market = 'us',
    direction?: PickDirection,
    event?: PickEvent,
    limit = 100
  ): Promise<PivotPicksResponse> {
    if (isMockMode()) {
      return mockService.getLatestPivotPicks(market, direction, event, limit)
    }
    return apiClient.getLatestPivotPicks(market, direction, event, limit)
  }

  async getPivotPicksByDate(
    date: string,
    market = 'us',
    direction?: PickDirection,
    event?: PickEvent,
    limit = 100
  ): Promise<PivotPicksResponse> {
    if (isMockMode()) {
      return mockService.getPivotPicksByDate(date, market, direction, event, limit)
    }
    return apiClient.getPivotPicksByDate(date, market, direction, event, limit)
  }

  async getPivotPickForSymbol(date: string, symbol: string, market = 'us'): Promise<PivotPick> {
    if (isMockMode()) {
      return mockService.getPivotPickForSymbol(date, symbol, market)
    }
    return apiClient.getPivotPickForSymbol(date, symbol, market)
  }

  async getPivotSymbolHistory(symbol: string, market = 'us', limit = 120): Promise<PivotHistoryResponse> {
    if (isMockMode()) {
      return mockService.getPivotSymbolHistory(symbol, market, limit)
    }
    return apiClient.getPivotSymbolHistory(symbol, market, limit)
  }

  async getPivotSummary(market = 'us'): Promise<PivotSummary> {
    if (isMockMode()) {
      return mockService.getPivotSummary(market)
    }
    return apiClient.getPivotSummary(market)
  }

  async getPivotPerformance(
    market = 'us',
    direction?: PickDirection,
    event?: PickEvent
  ): Promise<PivotPerformance> {
    if (isMockMode()) {
      return mockService.getPivotPerformance(market, direction, event)
    }
    return apiClient.getPivotPerformance(market, direction, event)
  }

  async getPivotPerformanceBreakdown(market = 'us'): Promise<PivotPerformanceBreakdown> {
    if (isMockMode()) {
      return mockService.getPivotPerformanceBreakdown(market)
    }
    return apiClient.getPivotPerformanceBreakdown(market)
  }

  async getLatestPivotRun(market = 'us'): Promise<PivotRun> {
    if (isMockMode()) {
      return mockService.getLatestPivotRun(market)
    }
    return apiClient.getLatestPivotRun(market)
  }

  // Utility methods
  isAuthenticated(): boolean {
    if (isMockMode()) {
      return mockService.isAuthenticated()
    }
    return apiClient.isAuthenticated()
  }

  getCurrentUserFromStorage(): User | null {
    if (isMockMode()) {
      return mockService.getCurrentUserFromStorage()
    }
    return apiClient.getCurrentUserFromStorage()
  }

  // Additional utility method to check current mode
  isMockModeEnabled(): boolean {
    return isMockMode()
  }
}

// Export singleton instance
export const api = new ApiAdapter()
export default api

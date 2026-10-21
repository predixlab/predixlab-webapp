export * from './market'
export * from './picks'
export * from './signals'

export interface User {
  id: string
  email: string
  name?: string
  role: 'free' | 'premium' | 'admin'
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
  email_verified: boolean
  premium_expires_at?: string
  has_premium_access: boolean
  premium_access_expires_at?: string
  referral_access_expires_at?: string
  preferred_language: 'zh' | 'en'
  daily_signals_email_enabled: boolean
  user_notice_version?: string
  user_notice_accepted_at?: string
}

export interface AuthToken {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

// Email login types
export interface EmailLoginRequest {
  email: string
}

export interface EmailLoginVerify {
  email: string
  code: string
  redirect_uri?: string
}

// Email registration types
export interface EmailRegisterCodeRequest {
  email: string
  preferred_language?: 'en' | 'zh'
}

export interface UserRegister {
  email: string
  code: string
  name?: string
  preferred_language?: 'en' | 'zh'
  user_notice_version: string
  referral_code?: string
}

export interface ReferralClickRequest {
  referral_code: string
  visitor_id: string
}

export interface ReferralValidationResponse {
  valid: boolean
  invitee_reward_days: number
}

export interface ReferralActivity {
  created_at: string
  status: 'pending' | 'rewarded' | 'capped'
  reward_days: number
}

export interface ReferralSummary {
  enabled: boolean
  referral_code: string
  referral_url: string
  clicks: number
  signups: number
  successful_referrals: number
  capped_referrals: number
  conversion_rate: number
  reward_days_earned: number
  deferred_reward_days: number
  reward_access_expires_at?: string
  inviter_reward_days: number
  invitee_reward_days: number
  max_rewarded_referrals: number
  recent_activity: ReferralActivity[]
}

// OAuth types
export interface OAuthExchangeRequest {
  code: string
  provider: 'google' | 'microsoft'
}

export interface OAuthConfirmRequest {
  oauth_token: string
  confirmed?: boolean
  name?: string
  user_notice_version: string
}

export interface UserNoticeAcceptanceRequest {
  user_notice_version: string
}

export interface AccountDeletionRequest {
  confirmation: string
}

export interface OAuthLinkRequest {
  oauth_token: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface UserUpdate {
  name?: string
  preferred_language?: 'en' | 'zh'
  daily_signals_email_enabled?: boolean
}

// Legacy types for backward compatibility
export interface LoginRequest {
  email: string
}

export interface LoginVerify {
  email: string
  code: string
}

// Stock data types from OpenAPI
export interface StockData {
  symbol: string
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface StockDataResponse {
  symbol: string
  is_index: boolean
  data: StockData[]
  total_records: number
}

// Daily picks types from OpenAPI
export interface DailyPick {
  instrument: string
  direction: 'rising' | 'declining'
  score?: number
  final_score?: number
  weighted_score?: number
  strategy?: string
  date: string
}

export interface DailyPicksResponse {
  date: string
  risings: DailyPick[]
  fallings: DailyPick[]
}

// Predictions types from OpenAPI
export interface Prediction {
  instrument: string
  us_rise_1d?: number
  us_rise_5d?: number
  us_decline_1d?: number
  us_decline_5d?: number
  date: string
}

export interface PredictionsResponse {
  date: string
  predictions: Prediction[]
  total_count: number
}

export interface LatestPredictionsResponse {
  date: string
  predictions: Prediction[]
  total_count: number
}

// Backtest types from OpenAPI
export interface BacktestSignal {
  date: string
  direction: 'rising' | 'declining'
  score?: number
  strategy?: string
}

export interface BacktestPerformance {
  signal_date: string
  direction: 'rising' | 'declining'
  days: number
  return_pct: number
  score?: number
}

export interface BacktestResult {
  symbol: string
  period_days: number
  signals: BacktestSignal[]
  performance: BacktestPerformance[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- backtest summary stats are dynamic key/value metrics
  summary_stats: Record<string, any>
}

// Trading calendar from OpenAPI
export interface TradingCalendarResponse {
  dates: string[]
  total_count: number
  limit: number
  offset: number
}

// Stock list from OpenAPI
export interface StockListResponse {
  symbols: string[]
  total_count: number
}

// Legacy types for backward compatibility
export interface StockPick {
  instrument: string
  score: number
  strategy?: string
  final_score?: number
  weighted_score?: number
}

export interface DailyPicks {
  date: string
  direction: 'RISING' | 'FALLING'
  picks: StockPick[]
  total_count: number
  is_premium_required: boolean
}

export interface LatestPicksResponse {
  date: string
  risings: DailyPick[]
  fallings: DailyPick[]
}

export interface AvailableDates {
  pick_dates: string[]
  prediction_dates: string[]
}

export interface StockList {
  symbols: string[]
  total_count: number
}

export interface Trade {
  date: string
  action: 'BUY' | 'SELL'
  price: number
  quantity: number
  value: number
  profit_loss?: number
}

export interface ApiError {
  detail: string
  status_code?: number
}

export interface ChartData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface SignalData {
  date: string
  signal: 'rising' | 'falling'
  model: 'pivot' | 'alpharank'
}

export type Direction = 'rising' | 'declining'

// OpenAPI Direction enum
export type ApiDirection = 'rising' | 'declining'

// Legacy Direction type for backward compatibility
export type LegacyDirection = 'RISING' | 'FALLING'

// Match type for search
export type MatchType = 'prefix' | 'infix'

// OAuth provider type
export type OAuthProvider = 'google' | 'microsoft'

// Language type
export type Language = 'zh' | 'en'

// User role type
export type UserRoleType = 'free' | 'premium' | 'admin'

export type UserRole = 'FREE' | 'PREMIUM' | 'ENTERPRISE'

// Subscription types from OpenAPI
export interface SubscriptionInfo {
  status?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | null
  billing_interval?: 'month' | 'year' | null
  current_period_end?: string | null
  trial_end?: string | null
  cancel_at_period_end?: boolean | null
}

export interface CreateCheckoutSessionRequest {
  billing_interval: 'month' | 'year'
  success_url: string
  cancel_url: string
}

export interface CheckoutSessionResponse {
  checkout_url: string
  session_id: string
}

export type BillingInterval = 'month' | 'year'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'

// Available dates response from OpenAPI
export interface AvailableDatesResponse {
  dates: string[]
}

export interface SubscriptionPrice {
  id: string
  interval: string
  amount: number
  currency: string
  product: string
}

export interface SubscriptionPricesResponse {
  prices: SubscriptionPrice[]
  trial_period_days: number
}

// Keep for backward compatibility
export interface PricingPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  popular?: boolean
  description: string
}

/**
 * Options / Anomalies types (from OpenAPI)
 */
export type OptionType = 'calls' | 'puts'

export type PositionType = 'Natural' | 'NewContract' | 'NewPosition' | 'ClosePosition' | 'HighActivity'

export interface AnomalyContract {
  symbol: string
  contract: string
  option_type: OptionType
  strike: number
  expiration?: string | null
  open_interest_today?: number | null
  open_interest_previous?: number | null
  oi_change?: number | null
  volume_today?: number | null
  volume_previous?: number | null
  volume_change?: number | null
  in_the_money?: boolean | null
  last_price?: number | null
  underlying_price?: number | null
  anomaly_score?: number | null
  position_type?: PositionType | null
}

export interface AnomalyOption {
  symbol: string
  date: string
  items: AnomalyContract[]
  anomaly_score?: number | null
}

export interface OptionsAnomalyDatesResponse {
  dates: string[]
  count: number
}

export type GexScopeKey = 'all' | '7d' | '30d'
export type GexRegime = 'positive' | 'negative' | 'neutral'
export type GexAttribution = 'oi_change' | 'greeks' | 'new_contract' | 'removed_contract'

export interface GexStrikeBucket {
  strike: number
  call_gex: number
  put_gex: number
  net_gex: number
}

export interface GexDecomposition {
  oi_change: number
  greeks: number
  new_contracts: number
  removed_contracts: number
}

export interface GexDriver {
  contract: string
  option_type: OptionType
  strike: number
  expiration: string
  open_interest_today: number
  open_interest_previous: number
  oi_change: number
  gex_today: number
  gex_previous: number
  gex_change: number
  share_of_absolute_change: number
  attribution: GexAttribution
  is_unusual: boolean
  anomaly_score?: number | null
}

export interface GexScope {
  key: GexScopeKey
  net_gex: number
  call_gex: number
  put_gex: number
  previous_net_gex: number
  net_gex_change: number
  regime: GexRegime
  gamma_flip?: number | null
  previous_gamma_flip?: number | null
  call_wall?: number | null
  put_wall?: number | null
  previous_call_wall?: number | null
  previous_put_wall?: number | null
  decomposition: GexDecomposition
  strike_buckets: GexStrikeBucket[]
  top_drivers: GexDriver[]
}

export interface GexAnalysis {
  symbol: string
  date: string
  previous_date?: string | null
  generated_at: string
  underlying_price: number
  previous_underlying_price?: number | null
  contract_count: number
  valid_gamma_contract_count: number
  oi_gamma_coverage: number
  model: 'call_positive_put_negative'
  spot_move: number
  scopes: GexScope[]
}

export interface GexAvailableDatesResponse {
  symbol: string
  dates: string[]
  count: number
}

export interface GexAvailableSymbolsResponse {
  symbols: string[]
  count: number
}

export type GexHighlightSignal =
  | 'positive_gamma'
  | 'negative_gamma'
  | 'near_flip'
  | 'gex_change'
  | 'wall_shift'
  | 'high_activity'

export interface GexHighlight {
  symbol: string
  date: string
  attention_score: number
  primary_signal: GexHighlightSignal
  regime: GexRegime
  underlying_price: number
  gamma_flip_distance?: number | null
  net_gex_change: number
  net_gex_change_ratio: number
  call_wall_change?: number | null
  put_wall_change?: number | null
}

export interface GexHighlightsResponse {
  date?: string | null
  items: GexHighlight[]
  count: number
}

export interface OptionsStructureSummary {
  front_expiration: string
  skew_expiration?: string | null
  atm_iv?: number | null
  previous_atm_iv?: number | null
  atm_iv_change?: number | null
  downside_skew?: number | null
  previous_downside_skew?: number | null
  downside_skew_change?: number | null
  total_open_interest: number
  previous_total_open_interest: number
  total_oi_change: number
  call_oi_change: number
  put_oi_change: number
  new_contracts: number
  closed_contracts: number
}

export interface OptionsTermPoint {
  expiration: string
  days_to_expiry: number
  atm_iv?: number | null
  previous_atm_iv?: number | null
  atm_iv_change?: number | null
  call_open_interest: number
  put_open_interest: number
  call_oi_change: number
  put_oi_change: number
}

export interface OptionsSkewPoint {
  delta: number
  option_type: OptionType
  iv?: number | null
  previous_iv?: number | null
  iv_change?: number | null
  actual_delta?: number | null
  delta_distance?: number | null
  open_interest?: number
  volume?: number
  relative_spread?: number | null
  is_reliable?: boolean
}

export interface OptionsSkewExpiration {
  expiration: string
  days_to_expiry: number
  points: OptionsSkewPoint[]
}

export type OptionsMigrationKind = 'new' | 'closed' | 'increased' | 'decreased' | 'mixed'

export interface OptionsPositionMigration {
  expiration: string
  days_to_expiry: number
  strike: number
  call_open_interest: number
  previous_call_open_interest: number
  call_oi_change: number
  put_open_interest: number
  previous_put_open_interest: number
  put_oi_change: number
  total_oi_change: number
  absolute_oi_change: number
  call_volume: number
  put_volume: number
  kind: OptionsMigrationKind
}

export interface OptionsStructureAnalysis {
  symbol: string
  date: string
  previous_date?: string | null
  generated_at: string
  underlying_price: number
  previous_underlying_price?: number | null
  summary: OptionsStructureSummary
  term_structure: OptionsTermPoint[]
  skew_expirations: OptionsSkewExpiration[]
  position_migrations: OptionsPositionMigration[]
}

export type OptionsStructureHighlightSignal =
  | 'iv_expansion'
  | 'iv_crush'
  | 'downside_hedging'
  | 'upside_chasing'
  | 'position_rotation'
  | 'term_dislocation'

export interface OptionsStructureHighlight {
  symbol: string
  date: string
  underlying_price: number
  attention_score: number
  primary_signal: OptionsStructureHighlightSignal
  atm_iv_change?: number | null
  downside_skew?: number | null
  downside_skew_change?: number | null
  total_oi_change: number
  total_oi_change_ratio: number
  migration_ratio: number
  term_spread?: number | null
  term_spread_change?: number | null
}

export interface OptionsStructureHighlightsResponse {
  date?: string | null
  items: OptionsStructureHighlight[]
  count: number
}

import type { TFunction } from 'i18next'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  Gauge as GaugeIcon,
  Minus,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import TickerLink from '@/components/TickerLink'
import {
  Badge,
  Change,
  EmptyState,
  Page,
  PageHeader,
  Panel,
  Skeleton,
  StatStrip,
  StatTile,
  Tabs,
} from '@/components/ui'
import api from '@/services/apiAdapter'
import {
  MarketOverviewResponse,
  MoverCategory,
  MoverEntry,
  PerformanceDistributionBucket,
  PerformanceDistributionResponse,
} from '@/types'
import { cn, formatDay } from '@/utils'

const MOVER_TABS: MoverCategory[] = ['gainers', 'losers', 'most_active', 'unusual_volume']

const formatPercent = (value?: number | null, digits = 2): string =>
  value === null || value === undefined ? '—' : `${(value * 100).toFixed(digits)}%`

const compact = (value?: number | null): string => {
  if (value === null || value === undefined) return '—'
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(2)}K`
  return value.toFixed(2)
}

const moverMetric = (entry: MoverEntry, category: MoverCategory, t: TFunction) => {
  if (category === 'most_active') {
    const turnover = entry.metric === null || entry.metric === undefined
      ? '—'
      : `$${compact(entry.metric)}`
    return `${t('market.movers.turnover')} ${turnover}`
  }
  if (category === 'unusual_volume') {
    return `${t('market.movers.volRatio')} ${compact(entry.metric)}`
  }
  return `${t('market.movers.volume')} ${compact(entry.volume)}`
}

const MoverRows: React.FC<{
  category: MoverCategory
  entries: MoverEntry[]
  t: TFunction
  startIndex?: number
}> = ({ category, entries, t, startIndex = 0 }) => (
  <ol start={startIndex + 1} className="divide-y divide-border">
    {entries.map((entry, index) => (
      <li key={entry.symbol} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
        <span className="num w-5 shrink-0 text-xs text-text-muted">{startIndex + index + 1}</span>
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-bold text-text-primary">
            <TickerLink symbol={entry.symbol} />
          </p>
          <p className="num mt-1 text-xs leading-5 text-text-muted">
            {moverMetric(entry, category, t)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="num text-sm font-medium text-text-primary">
            {entry.close?.toFixed(2) ?? '—'}
          </p>
          <Change value={entry.change_percent} className="text-xs" />
        </div>
      </li>
    ))}
  </ol>
)

const MoverList: React.FC<{
  category: MoverCategory
  entries: MoverEntry[]
  t: TFunction
}> = ({ category, entries, t }) => (
  <section className="min-w-0">
    <header className="flex items-center justify-between gap-3 border-b border-border bg-surface-raised/60 px-4 py-3 sm:px-5">
      <h3 className="text-sm font-semibold text-text-primary">
        {t(`market.movers.${category}`)}
      </h3>
      <span className="num text-xs text-text-muted">
        {entries.length} {t('market.symbols')}
      </span>
    </header>
    {entries.length > 0 ? (
      <MoverRows category={category} entries={entries} t={t} />
    ) : (
      <EmptyState
        size="sm"
        icon={<BarChart3 className="h-4 w-4" />}
        title={t('market.noMovers')}
        description={t('market.noMoversHint')}
        className="py-10"
      />
    )}
  </section>
)

const bucketColor = (bucket: PerformanceDistributionBucket): string => {
  if (bucket.upper_bound != null && bucket.upper_bound <= 0) return 'bg-bear-vivid'
  if (bucket.lower_bound != null && bucket.lower_bound >= 0) return 'bg-bull-vivid'
  return 'bg-info-vivid'
}

const DistributionChart: React.FC<{
  buckets: PerformanceDistributionBucket[]
  totalSymbols: number
  t: TFunction
}> = ({ buckets, totalSymbols, t }) => {
  if (buckets.length === 0 || totalSymbols === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <EmptyState
          icon={<Activity className="h-4 w-4" />}
          title={t('market.noDistribution')}
          description={t('market.noDistributionHint')}
        />
      </div>
    )
  }

  const maxCount = Math.max(1, ...buckets.map(bucket => bucket.count))

  return (
    <div className="min-w-0">
      <dl className="space-y-3 md:hidden">
        {buckets.map(bucket => (
          <div key={bucket.label} className="grid grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)] items-center gap-4">
            <dt className="num text-xs text-text-secondary">{bucket.label}</dt>
            <dd className="flex min-w-0 items-center gap-3">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-sunken" aria-hidden>
                <div
                  className={cn('h-full rounded-full', bucketColor(bucket))}
                  style={{ width: `${bucket.count / maxCount * 100}%` }}
                />
              </div>
              <span className="num w-9 shrink-0 text-right text-xs font-semibold text-text-primary">
                {bucket.count}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <dl
        className="hidden gap-2 md:grid"
        style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` }}
      >
        {buckets.map(bucket => (
          <div key={bucket.label} className="flex min-w-0 flex-col">
            <dt className="num order-last border-t border-border pt-3 text-center text-xs leading-5 text-text-secondary [overflow-wrap:anywhere]">
              {bucket.label}
            </dt>
            <dd className="flex flex-col items-center">
              <span className="num text-xs font-semibold text-text-primary">{bucket.count}</span>
              <div className="relative mt-3 h-44 w-full max-w-10" aria-hidden>
                <div
                  className={cn('absolute inset-x-0 bottom-0 rounded-t-sm', bucketColor(bucket))}
                  style={{ height: `${bucket.count / maxCount * 100}%` }}
                />
              </div>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

const sentimentTone = (score: number): 'bull' | 'warn' | 'bear' =>
  score >= 55 ? 'bull' : score >= 45 ? 'warn' : 'bear'

const MarketOverviewPage: React.FC = () => {
  const { t } = useTranslation()
  const [overview, setOverview] = useState<MarketOverviewResponse | null>(null)
  const [distribution, setDistribution] = useState<PerformanceDistributionResponse | null>(null)
  const [movers, setMovers] = useState<Record<MoverCategory, MoverEntry[]>>({
    gainers: [],
    losers: [],
    most_active: [],
    unusual_volume: [],
    gap_up: [],
    gap_down: [],
    new_high_52w: [],
    new_low_52w: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [moverCategory, setMoverCategory] = useState<MoverCategory>('gainers')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [
          overviewData,
          distributionData,
          unusualVolume,
          newHighs,
          newLows,
        ] = await Promise.all([
          api.getMarketOverview(10),
          api.getPerformanceDistribution(1),
          api
            .getMarketMovers('unusual_volume', 10)
            .then(response => response.entries)
            .catch(() => []),
          api
            .getMarketMovers('new_high_52w', 10)
            .then(response => response.entries)
            .catch(() => []),
          api
            .getMarketMovers('new_low_52w', 10)
            .then(response => response.entries)
            .catch(() => []),
        ])
        if (cancelled) return
        setOverview(overviewData)
        setDistribution(distributionData)
        setMovers(prev => ({
          ...prev,
          gainers: overviewData.top_gainers,
          losers: overviewData.top_losers,
          most_active: overviewData.most_active,
          unusual_volume: unusualVolume,
          new_high_52w: newHighs,
          new_low_52w: newLows,
        }))
      } catch {
        if (!cancelled) setError(t('errors.loadFailed'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [t])

  if (loading) {
    return (
      <Page>
        <PageHeader title={t('market.title')} subtitle={t('market.subtitle')} />
        <Skeleton height={300} />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton height={350} />
          <Skeleton height={350} />
        </div>
        <Skeleton height={240} />
      </Page>
    )
  }

  if (error || !overview) {
    return (
      <Page>
        <PageHeader title={t('market.title')} subtitle={t('market.subtitle')} />
        <Panel flush>
          <EmptyState
            tone="error"
            icon={<Activity className="h-4 w-4" />}
            title={t('errors.loadFailed')}
            description={error ?? undefined}
          />
        </Panel>
      </Page>
    )
  }

  const { breadth, sentiment } = overview
  const breadthTotal = Math.max(1, breadth.total_symbols)
  const advanceShare = Math.min(100, Math.max(0, breadth.advancers / breadthTotal * 100))
  const declineShare = Math.min(100, Math.max(0, breadth.decliners / breadthTotal * 100))
  const unchangedShare = Math.min(100, Math.max(0, breadth.unchanged / breadthTotal * 100))

  return (
    <Page>
      <PageHeader
        title={t('market.title')}
        date={formatDay(overview.date, '') || undefined}
        subtitle={t('market.subtitle')}
      />

      <Panel flush>
        <div className="grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <section className="min-w-0 border-b border-border bg-surface-raised/60 p-5 sm:p-6 lg:border-r lg:border-b-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <GaugeIcon className="h-4 w-4 text-text-muted" aria-hidden />
              {t('market.sentiment')}
            </h2>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <span className="num text-5xl leading-none font-semibold tracking-[-0.045em] text-text-primary">
                {sentiment.score.toFixed(0)}
              </span>
              <div>
                <Badge tone={sentimentTone(sentiment.score)}>
                  {t(`market.sentimentLabels.${sentiment.label}`, sentiment.label.replace('_', ' '))}
                </Badge>
                <p className="mt-1.5 text-xs text-text-muted">{t('market.sentimentScale')}</p>
              </div>
            </div>
            <div
              className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-strong"
              role="meter"
              aria-label={t('market.sentiment')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(100, Math.max(0, sentiment.score))}
              aria-valuetext={`${sentiment.score.toFixed(0)}: ${t(`market.sentimentLabels.${sentiment.label}`, sentiment.label.replace('_', ' '))}`}
            >
              <div
                className={cn(
                  'h-full rounded-full',
                  sentimentTone(sentiment.score) === 'bull' && 'bg-bull-vivid',
                  sentimentTone(sentiment.score) === 'warn' && 'bg-warn-vivid',
                  sentimentTone(sentiment.score) === 'bear' && 'bg-bear-vivid',
                )}
                style={{ width: `${Math.min(100, Math.max(0, sentiment.score))}%` }}
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-text-secondary">{sentiment.summary}</p>
          </section>

          <section className="min-w-0 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-text-primary">{t('market.breadth')}</h2>
                <p className="mt-1 text-xs leading-5 text-text-muted">{t('market.breadthDescription')}</p>
              </div>
              <Badge tone="muted" className="num">
                {breadth.total_symbols} {t('market.symbols')}
              </Badge>
            </div>

            <dl className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: t('market.advancers'), value: breadth.advancers, tone: 'text-bull', icon: ArrowUpRight },
                { label: t('market.unchanged'), value: breadth.unchanged, tone: 'text-text-secondary', icon: Minus },
                { label: t('market.decliners'), value: breadth.decliners, tone: 'text-bear', icon: ArrowDownRight },
              ].map(({ label, value, tone, icon: Icon }) => (
                <div key={label} className="min-w-0">
                  <dt className="flex flex-wrap items-center gap-1 text-xs text-text-muted">
                    <Icon className={cn('h-3.5 w-3.5 shrink-0', tone)} aria-hidden />
                    {label}
                  </dt>
                  <dd className={cn('num mt-2 text-2xl font-semibold tracking-tight sm:text-3xl', tone)}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <div
              className="mt-5 flex h-2 overflow-hidden rounded-full bg-surface-strong"
              role="img"
              aria-label={`${breadth.advancers} ${t('market.advancers')}, ${breadth.unchanged} ${t('market.unchanged')}, ${breadth.decliners} ${t('market.decliners')}`}
            >
              <div className="bg-bull-vivid" style={{ width: `${advanceShare}%` }} />
              <div className="bg-text-muted" style={{ width: `${unchangedShare}%` }} />
              <div className="bg-bear-vivid" style={{ width: `${declineShare}%` }} />
            </div>
            <p className="mt-2.5 flex items-center justify-between gap-3 text-xs text-text-muted">
              <span>{t('market.percentAdvancing')}</span>
              <span className="num font-semibold text-text-primary">
                {formatPercent(breadth.percent_advancing, 1)}
              </span>
            </p>
            {breadth.unchanged_symbols.length > 0 ? (
              <details className="group mt-4 border-t border-border pt-1">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-xs font-medium text-text-secondary [&::-webkit-details-marker]:hidden">
                  {t('market.unchangedTickers')}
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <div className="flex flex-wrap gap-2 pb-1">
                  {breadth.unchanged_symbols.map(symbol => (
                    <TickerLink key={symbol} symbol={symbol} className="rounded-full hover:no-underline">
                      <Badge tone="muted" className="transition-colors hover:border-accent-line hover:text-accent-400">{symbol}</Badge>
                    </TickerLink>
                  ))}
                </div>
              </details>
            ) : null}
          </section>
        </div>
        <StatStrip columns={4} className="rounded-none border-x-0 border-b-0 shadow-none">
          <StatTile label={t('market.aboveSma20')} value={formatPercent(breadth.above_sma20_percent, 1)} />
          <StatTile label={t('market.aboveSma50')} value={formatPercent(breadth.above_sma50_percent, 1)} />
          <StatTile label={t('market.aboveSma200')} value={formatPercent(breadth.above_sma200_percent, 1)} />
          <StatTile
            label={t('market.newHighsLows')}
            value={
              <>
                <span className="text-bull">{breadth.new_highs_52w}</span>
                <span className="text-text-muted"> / </span>
                <span className="text-bear">{breadth.new_lows_52w}</span>
              </>
            }
          />
        </StatStrip>
      </Panel>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Panel
          title={t('market.distribution')}
          subtitle={t('market.distributionHint')}
          icon={<Activity className="h-4 w-4" />}
          actions={
            distribution ? (
              <Badge tone="muted" className="num">
                {distribution.total_symbols} {t('market.distributionCoverage')}
              </Badge>
            ) : null
          }
        >
          <DistributionChart
            buckets={distribution?.buckets ?? []}
            totalSymbols={distribution?.total_symbols ?? 0}
            t={t}
          />
        </Panel>

        <Panel
          title={t('market.newHighsLows')}
          subtitle={t('market.newHighsLowsHint')}
          icon={<BarChart3 className="h-4 w-4" />}
          flush
        >
          <div className="divide-y divide-border sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {([
              { category: 'new_high_52w', title: 'market.newHighs', count: breadth.new_highs_52w, empty: 'market.noNewHighs', tone: 'text-bull' },
              { category: 'new_low_52w', title: 'market.newLows', count: breadth.new_lows_52w, empty: 'market.noNewLows', tone: 'text-bear' },
            ] as const).map(({ category, title, count, empty, tone }) => (
              <section key={category} className="min-w-0">
                <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-raised/60 px-4 py-3 sm:px-5">
                  <h3 className={cn('text-xs font-semibold', tone)}>{t(title)}</h3>
                  <span className={cn('num text-sm font-semibold', tone)}>{count}</span>
                </div>
                {movers[category].length > 0 ? (
                  <>
                    <MoverRows category={category} entries={movers[category].slice(0, 3)} t={t} />
                    {movers[category].length > 3 ? (
                      <details className="group border-t border-border">
                        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 text-xs font-semibold text-accent-400 sm:px-5 [&::-webkit-details-marker]:hidden">
                          <span className="group-open:hidden">
                            {t('common.showMore')} <span className="num">({movers[category].length - 3})</span>
                          </span>
                          <span className="hidden group-open:inline">{t('common.showLess')}</span>
                          <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                        </summary>
                        <MoverRows category={category} entries={movers[category].slice(3)} startIndex={3} t={t} />
                      </details>
                    ) : null}
                  </>
                ) : (
                  <p className="px-4 py-6 text-sm text-text-muted sm:px-5">{t(empty)}</p>
                )}
              </section>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title={t('market.moversTitle')}
        icon={<BarChart3 className="h-4 w-4" />}
        flush
      >
        <Tabs
          value={moverCategory}
          onChange={setMoverCategory}
          aria-label={t('market.moversTitle')}
          variant="underline"
          items={MOVER_TABS.map(category => ({
            value: category,
            label: t(`market.movers.${category}`),
            count: movers[category].length,
          }))}
          className="px-4 md:hidden"
        />
        <div className="grid md:grid-cols-2 2xl:grid-cols-4">
          {MOVER_TABS.map((category, index) => (
            <div
              key={category}
              className={cn(
                'min-w-0 border-border',
                category !== moverCategory && 'hidden md:block',
                index % 2 === 1 && 'md:border-l',
                index > 1 && 'md:border-t 2xl:border-t-0',
                index > 0 && '2xl:border-l',
              )}
            >
              <MoverList category={category} entries={movers[category]} t={t} />
            </div>
          ))}
        </div>
      </Panel>
    </Page>
  )
}

export default MarketOverviewPage

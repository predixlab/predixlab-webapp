import {
  Check,
  CheckCircle2,
  ChevronRight,
  CircleMinus,
  Clock3,
  Copy,
  Gift,
  Link2,
  MousePointerClick,
  Share2,
  UserPlus,
  Users,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Alert, Button, EmptyState, Field, Page, PageHeader, Panel, Skeleton, StatStrip, StatTile } from '@/components/ui'
import api from '@/services/apiAdapter'
import type { ReferralSummary } from '@/types'
import { cn, formatNumber, parseApiError, toValidDate } from '@/utils'

const ReferralPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [summary, setSummary] = useState<ReferralSummary | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const copiedTimerRef = useRef<number | null>(null)

  useEffect(() => {
    let active = true
    api
      .getReferralSummary()
      .then(value => {
        if (active) setSummary(value)
      })
      .catch(cause => {
        if (active) setError(parseApiError(cause))
      })
    return () => {
      active = false
      if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current)
    }
  }, [])

  const copyLink = async () => {
    if (!summary) return
    setError('')
    try {
      await navigator.clipboard.writeText(summary.referral_url)
      setCopied(true)
      if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError(t('referrals.shareFailed'))
    }
  }

  const shareLink = async () => {
    if (!summary) return
    setError('')
    try {
      if (navigator.share) {
        await navigator.share({
          title: t('referrals.shareTitle'),
          text: t('referrals.shareText', {
            days: summary.invitee_reward_days,
          }),
          url: summary.referral_url,
        })
        return
      }
      await copyLink()
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') return
      setError(t('referrals.shareFailed'))
    }
  }

  const formatDate = (value: string) =>
    toValidDate(value)?.toLocaleDateString(
      i18n.language === 'zh' ? 'zh-CN' : 'en-US',
    ) ?? '\u2014'

  return (
    <Page width="standard">
      <nav
        aria-label={t('referrals.breadcrumbLabel')}
        className="-mb-3 flex flex-wrap items-center gap-1 text-xs text-text-muted"
      >
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="-ml-3 min-h-11"
          onClick={() =>
            navigate({
              pathname: '/profile',
              search:
                searchParams.get('mock') === 'true' ? '?mock=true' : '',
            })
          }
        >
          {t('nav.profile')}
        </Button>
        <ChevronRight className="h-3 w-3" aria-hidden />
        <span aria-current="page">{t('referrals.title')}</span>
      </nav>
      <PageHeader
        title={t('referrals.title')}
        subtitle={t('referrals.description')}
      />

      {error ? <Alert tone="error" className="[overflow-wrap:anywhere]">{error}</Alert> : null}

      {summary && !summary.enabled ? (
        <Alert tone="info">{t('referrals.unavailable')}</Alert>
      ) : summary ? (
        <>
          <Panel
            title={t('referrals.sharePanelTitle')}
            icon={<Link2 className="h-4 w-4" />}
          >
            <div className="grid min-w-0 gap-6 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
              <div className="md:order-last md:border-l md:border-border md:pl-6">
                <p className="text-sm leading-7 text-text-primary">
                  {t('referrals.sharePanelSubtitle', {
                    inviterDays: summary.inviter_reward_days,
                    inviteeDays: summary.invitee_reward_days,
                  })}
                </p>
                <p className="mt-3 text-xs leading-6 text-text-muted">
                  {t('referrals.rewardLimit', {
                    count: summary.max_rewarded_referrals,
                  })}
                </p>
              </div>
              <div className="min-w-0">
                <Field label={t('referrals.yourLink')}>
                  {props => (
                    <textarea
                      {...props}
                      readOnly
                      rows={3}
                      value={summary.referral_url}
                      spellCheck={false}
                      onFocus={event => event.currentTarget.select()}
                      className="input resize-none bg-surface-raised font-mono text-sm leading-6 [overflow-wrap:anywhere]"
                    />
                  )}
                </Field>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    className="min-h-11"
                    onClick={copyLink}
                    leftIcon={
                      copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )
                    }
                  >
                    {copied ? t('referrals.copied') : t('common.copy')}
                  </Button>
                  <Button
                    className="min-h-11"
                    onClick={shareLink}
                    leftIcon={<Share2 className="h-4 w-4" />}
                  >
                    {t('referrals.share')}
                  </Button>
                </div>
                <span className="sr-only" role="status">{copied ? t('referrals.copied') : ''}</span>
              </div>
            </div>
          </Panel>

          <StatStrip columns={4}>
            <StatTile
              label={t('referrals.clicks')}
              value={formatNumber(summary.clicks, 0)}
              icon={<MousePointerClick className="h-3.5 w-3.5" />}
            />
            <StatTile
              label={t('referrals.signups')}
              value={formatNumber(summary.signups, 0)}
              icon={<UserPlus className="h-3.5 w-3.5" />}
            />
            <StatTile
              label={t('referrals.conversion')}
              value={`${summary.conversion_rate.toFixed(1)}%`}
              icon={<Link2 className="h-3.5 w-3.5" />}
            />
            <StatTile
              label={t('referrals.rewardDays')}
              value={formatNumber(summary.reward_days_earned, 0)}
              tone="bull"
              icon={<Gift className="h-3.5 w-3.5" />}
              hint={
                summary.deferred_reward_days > 0 || summary.reward_access_expires_at
                  ? (
                    <>
                      {summary.deferred_reward_days > 0 ? (
                        <span className="block">
                          {t('referrals.deferredReward', { days: summary.deferred_reward_days })}
                        </span>
                      ) : null}
                      {summary.reward_access_expires_at ? (
                        <span className="block">
                          {t('referrals.accessUntil', { date: formatDate(summary.reward_access_expires_at) })}
                        </span>
                      ) : null}
                    </>
                  )
                  : undefined
              }
            />
          </StatStrip>

          <Panel
            title={t('referrals.activity')}
            subtitle={t('referrals.activitySubtitle')}
            icon={<Users className="h-4 w-4" />}
          >
            {summary.recent_activity.length ? (
              <ul className="divide-y divide-border">
                {summary.recent_activity.map((activity, index) => {
                  const ActivityIcon = activity.status === 'rewarded'
                    ? CheckCircle2
                    : activity.status === 'capped'
                      ? CircleMinus
                      : Clock3
                  return (
                    <li
                      key={`${activity.created_at}-${index}`}
                      className="flex items-start justify-between gap-3 py-5 first:pt-0 last:pb-0 sm:items-center sm:gap-5"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-text-secondary">
                          <ActivityIcon className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-6 text-text-primary">
                            {t(`referrals.status.${activity.status}`)}
                          </p>
                          <time dateTime={activity.created_at} className="num mt-1 block text-xs leading-5 text-text-muted">
                            {formatDate(activity.created_at)}
                          </time>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'num max-w-[35%] shrink-0 text-right text-sm leading-6 font-semibold [overflow-wrap:anywhere]',
                          activity.reward_days ? 'text-bull' : 'text-text-muted',
                        )}
                      >
                        {activity.reward_days
                          ? `+${formatNumber(activity.reward_days, 0)} ${t('referrals.days')}`
                          : '\u2014'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <EmptyState
                size="sm"
                icon={<Users className="h-5 w-5" />}
                title={t('referrals.empty')}
              />
            )}
          </Panel>
        </>
      ) : !error ? (
        <Panel title={t('referrals.sharePanelTitle')} aria-busy>
          <div className="flex items-center gap-3 text-sm text-text-secondary" role="status">
            <span className="spinner text-accent-500" aria-hidden />
            <p>{t('common.loading')}</p>
          </div>
          <Skeleton height={92} className="mt-5" />
          <Skeleton height={44} width="45%" className="mt-3" />
        </Panel>
      ) : null}
    </Page>
  )
}

export default ReferralPage

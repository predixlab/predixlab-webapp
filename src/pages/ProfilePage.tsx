import {
  ArrowRight,
  Check,
  CreditCard,
  Crown,
  Globe,
  Mail,
  Pencil,
  Trash2,
  User as UserIcon,
  Users,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import AgentConnectionPanel from '@/components/profile/AgentConnectionPanel'
import { Alert, Badge, Button, Field, Modal, Page, PageHeader, Panel, Skeleton } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/apiAdapter'
import { BillingInterval, Language, SubscriptionInfo, SubscriptionPrice } from '@/types'
import { cn, formatCurrency, toValidDate } from '@/utils'

const FEATURE_KEYS = ['trial', 'latestSignals', 'latestOptions', 'currentPerformance'] as const
const FREE_ACCESS_KEYS = ['delayedSignals', 'chartsHistory', 'marketTools'] as const
const PREMIUM_ACCESS_KEYS = ['latestSignals', 'latestOptions', 'currentPerformance'] as const

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPlan: (billingInterval: BillingInterval) => void
  isLoading: boolean
  pricingPlans: SubscriptionPrice[]
  trialPeriodDays: number
  pricingLoading: boolean
  pricingFailed: boolean
  error: string
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  isLoading,
  pricingPlans,
  trialPeriodDays,
  pricingLoading,
  pricingFailed,
  error,
}) => {
  const { t } = useTranslation()

  const monthlyPlan = pricingPlans.find(plan => plan.interval === 'month')
  const yearlyPlan = pricingPlans.find(plan => plan.interval === 'year')
  const monthlyCost = monthlyPlan ? monthlyPlan.amount * 12 : 0
  const yearlyCost = yearlyPlan ? yearlyPlan.amount : 0
  const savings =
    monthlyCost > 0 && yearlyCost > 0 && monthlyPlan?.currency === yearlyPlan?.currency
      ? Math.round(((monthlyCost - yearlyCost) / monthlyCost) * 100)
      : 0

  const plans = [
    {
      key: 'month' as const,
      name: t('profile.subscriptionModal.monthly'),
      price: monthlyPlan,
      note: t('profile.subscriptionModal.billedMonthly'),
      cta: t('profile.subscriptionModal.selectMonthly'),
    },
    {
      key: 'year' as const,
      name: t('profile.subscriptionModal.yearly'),
      price: yearlyPlan,
      note: t('profile.subscriptionModal.billedYearly'),
      cta: t('profile.subscriptionModal.selectYearly'),
    },
  ]

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={t('profile.subscriptionModal.title')}
      icon={<Crown className="h-4 w-4 text-text-secondary" />}
      size="lg"
      footer={
        <div className="space-y-3">
          {error ? <Alert tone="error">{error}</Alert> : null}
          <div className="grid grid-cols-2 gap-3">
            {plans.map(plan => (
              <Button
                key={plan.key}
                className="min-h-12 min-w-0 px-3 whitespace-normal"
                variant={plan.key === 'year' ? 'primary' : 'secondary'}
                onClick={() => onSelectPlan(plan.key)}
                loading={isLoading}
              >
                {plan.cta}
              </Button>
            ))}
          </div>
          <p className="text-center text-xs leading-5 text-text-muted">
            {t('profile.subscriptionModal.sameBenefits')}
          </p>
        </div>
      }
    >
      <p className="text-sm leading-6 text-text-secondary">
        {t('profile.subscriptionModal.description')}
      </p>

      {pricingFailed || (!pricingLoading && (!monthlyPlan || !yearlyPlan)) ? (
        <Alert tone="error" className="mt-5">{t('errors.loadFailed')}</Alert>
      ) : null}

      <section className="mt-6" aria-busy={pricingLoading}>
        <h3 className="text-sm font-semibold text-text-primary">
          {t('profile.subscriptionModal.chooseBilling')}
        </h3>
        <div className="mt-3 grid grid-cols-2 divide-x divide-border border-y border-border">
          {plans.map(plan => (
            <div
              key={plan.key}
              className="min-w-0 py-5 first:pr-4 last:pl-4 sm:first:pr-6 sm:last:pl-6"
            >
              <h4 className="text-sm font-semibold text-text-primary">{plan.name}</h4>
              {pricingLoading ? (
                <Skeleton className="mt-3 max-w-full" width={110} height={32} />
              ) : (
                <p className="num mt-3 text-2xl font-semibold tracking-[-0.04em] text-text-primary [overflow-wrap:anywhere] sm:text-3xl">
                  {plan.price
                    ? formatCurrency(plan.price.amount / 100, plan.price.currency)
                    : '\u2014'}
                </p>
              )}
              <p className="mt-1 text-xs leading-5 text-text-secondary">{plan.note}</p>
              {plan.key === 'year' && savings > 0 ? (
                <Badge tone="accent" className="mt-3">
                  {t('profile.subscriptionModal.savePercent', { percent: savings })}
                </Badge>
              ) : null}
            </div>
          ))}
        </div>
        {pricingLoading ? <p className="sr-only" role="status">{t('common.loading')}</p> : null}
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-text-primary">
          {t('profile.subscriptionModal.premiumFeatures')}
        </h3>
        <ul className="mt-3 space-y-3">
          {FEATURE_KEYS.filter(key => key !== 'trial' || trialPeriodDays > 0).map(key => (
            <li key={key} className="flex items-start gap-2.5 text-sm leading-6 text-text-secondary">
              <Check className="mt-1 h-4 w-4 shrink-0 text-text-muted" aria-hidden />
              {t(`profile.subscriptionModal.features.${key}`, { days: trialPeriodDays })}
            </li>
          ))}
        </ul>
      </section>
    </Modal>
  )
}

interface SettingsRowProps {
  label: React.ReactNode
  children: React.ReactNode
}

const SettingsRow: React.FC<SettingsRowProps> = ({ label, children }) => (
  <div className="grid items-start gap-2 border-t border-border py-5 first:border-t-0 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-4 xl:grid-cols-1 xl:gap-2">
    <dt className="min-w-0 text-xs font-medium leading-6 text-text-secondary">{label}</dt>
    <dd className="w-full min-w-0">{children}</dd>
  </div>
)

const ProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user, updateUserProfile, deleteAccount } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const memberTypeLabel = (role: string | undefined) => {
    if (!role) return ''
    const key = `profile.memberTypes.${role}`
    const translated = t(key)
    return translated === key ? role : translated
  }

  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingLanguage, setIsEditingLanguage] = useState(false)
  const [editedName, setEditedName] = useState(user?.name || '')
  const [editedLanguage, setEditedLanguage] = useState<Language>(user?.preferred_language || 'en')
  const [isLoading, setIsLoading] = useState(false)
  const [isDailySignalsUpdating, setIsDailySignalsUpdating] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; language?: string; general?: string }>({})
  const [successMessage, setSuccessMessage] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)
  const languageInputRef = useRef<HTMLSelectElement>(null)
  const successTimerRef = useRef<number | null>(null)

  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(
    user?.role === 'premium' || user?.role === 'admin',
  )
  const [subscriptionLoadFailed, setSubscriptionLoadFailed] = useState(false)
  const [subscriptionActionError, setSubscriptionActionError] = useState('')
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isSubscriptionProcessing, setIsSubscriptionProcessing] = useState(false)
  const [pricingPlans, setPricingPlans] = useState<SubscriptionPrice[]>([])
  const [isPricingLoading, setIsPricingLoading] = useState(true)
  const [pricingLoadFailed, setPricingLoadFailed] = useState(false)
  const [trialPeriodDays, setTrialPeriodDays] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const canManageDailySignalsEmail = user?.role === 'premium' || user?.role === 'admin'
  const dailySignalsEmailEnabled =
    canManageDailySignalsEmail && (user?.daily_signals_email_enabled ?? true)

  useEffect(() => {
    if (isEditingName) nameInputRef.current?.focus()
  }, [isEditingName])

  useEffect(() => {
    if (isEditingLanguage) languageInputRef.current?.focus()
  }, [isEditingLanguage])

  useEffect(() => () => {
    if (successTimerRef.current !== null) window.clearTimeout(successTimerRef.current)
  }, [])

  useEffect(() => {
    if (searchParams.get('upgrade') !== 'true' || user?.role !== 'free') return
    setShowSubscriptionModal(true)
    const next = new URLSearchParams(searchParams)
    next.delete('upgrade')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, user?.role])

  useEffect(() => {
    let active = true

    const loadSubscriptionInfo = async () => {
      setSubscriptionInfo(null)
      setSubscriptionLoadFailed(false)
      setIsSubscriptionLoading(user?.role === 'premium' || user?.role === 'admin')
      if (user?.role === 'premium' || user?.role === 'admin') {
        try {
          const info = await api.getSubscriptionInfo()
          if (active) setSubscriptionInfo(info)
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to load subscription info:', error)
          if (active) setSubscriptionLoadFailed(true)
        } finally {
          if (active) setIsSubscriptionLoading(false)
        }
      }
    }

    const loadPricingPlans = async () => {
      setIsPricingLoading(true)
      setPricingLoadFailed(false)
      setPricingPlans([])
      setTrialPeriodDays(0)
      try {
        const response = await api.getSubscriptionPrices()
        if (active) {
          setPricingPlans(response.prices)
          setTrialPeriodDays(response.trial_period_days)
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load pricing plans:', error)
        if (active) setPricingLoadFailed(true)
      } finally {
        if (active) setIsPricingLoading(false)
      }
    }

    loadSubscriptionInfo()
    loadPricingPlans()
    return () => {
      active = false
    }
  }, [user?.role])

  const validateName = (name: string): string | undefined => {
    if (!name.trim()) return t('profile.nameRequired')
    if (name.trim().length < 2) return t('profile.nameTooShort')
    if (name.trim().length > 50) return t('profile.nameTooLong')
    return undefined
  }

  const flashSuccess = (message: string) => {
    if (successTimerRef.current !== null) window.clearTimeout(successTimerRef.current)
    setSuccessMessage(message)
    successTimerRef.current = window.setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleNameSave = async () => {
    const nameError = validateName(editedName)
    if (nameError) {
      setErrors({ name: nameError })
      return
    }
    setIsLoading(true)
    setErrors({})
    try {
      await updateUserProfile({ name: editedName.trim() })
      setIsEditingName(false)
      flashSuccess(t('profile.profileUpdated'))
    } catch {
      setErrors({ name: t('profile.updateFailed') })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLanguageSave = async () => {
    setIsLoading(true)
    setErrors({})
    try {
      await updateUserProfile({ preferred_language: editedLanguage })
      setIsEditingLanguage(false)
      flashSuccess(t('profile.languageUpdated'))
    } catch {
      setErrors({ language: t('profile.updateFailed') })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDailySignalsEmailToggle = async () => {
    if (!canManageDailySignalsEmail) return

    setIsDailySignalsUpdating(true)
    setErrors({})
    try {
      await updateUserProfile({
        daily_signals_email_enabled: !dailySignalsEmailEnabled,
      })
      flashSuccess(t('profile.dailySignalsEmailUpdated'))
    } catch {
      setErrors({ general: t('profile.updateFailed') })
    } finally {
      setIsDailySignalsUpdating(false)
    }
  }

  const handleSelectPlan = async (billingInterval: BillingInterval) => {
    setIsSubscriptionProcessing(true)
    setSubscriptionActionError('')
    try {
      const currentUrl = window.location.origin
      const response = await api.createCheckoutSession({
        billing_interval: billingInterval,
        success_url: `${currentUrl}/profile?payment=success`,
        cancel_url: `${currentUrl}/profile?payment=cancelled`,
      })
      window.location.href = response.checkout_url
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create checkout session:', error)
      setSubscriptionActionError(t('profile.subscriptionModal.error'))
    } finally {
      setIsSubscriptionProcessing(false)
    }
  }

  const handleCancelSubscription = async () => {
    setIsSubscriptionProcessing(true)
    setSubscriptionActionError('')
    try {
      await api.cancelSubscription()
      setSubscriptionInfo(await api.getSubscriptionInfo())
      setShowCancelModal(false)
      flashSuccess(t('profile.subscriptionCanceled'))
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to cancel subscription:', error)
      setSubscriptionActionError(t('profile.updateFailed'))
    } finally {
      setIsSubscriptionProcessing(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (
      !user ||
      deleteConfirmation.trim().toLowerCase() !== user.email.toLowerCase()
    ) return

    setIsDeletingAccount(true)
    setDeleteError('')
    try {
      await deleteAccount(deleteConfirmation.trim())
      window.location.assign('/login?account=deleted')
    } catch {
      setDeleteError(t('profile.deleteAccountConfirm.error'))
      setIsDeletingAccount(false)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    const parsed = toValidDate(dateString)
    return parsed
      ? parsed.toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US')
      : '\u2014'
  }

  const shouldShowUpgradeButton = user?.role === 'free'
  const shouldShowCancelButton =
    user?.role === 'premium' &&
    (subscriptionInfo?.status === 'active' || subscriptionInfo?.status === 'trialing')
  const shouldShowButtons = user?.role !== 'admin'
  const planExpiresAt = user?.premium_expires_at
  const roleTone = user?.role === 'premium' ? 'accent' : user?.role === 'admin' ? 'info' : 'neutral'
  const roleDescription =
    user?.role === 'premium'
      ? t('profile.roleDescriptions.premium')
      : user?.role === 'admin'
        ? t('profile.roleDescriptions.admin')
        : t('profile.roleDescriptions.free')

  const subscriptionFooter =
    shouldShowButtons && shouldShowUpgradeButton ? (
      <Button
        fullWidth
        className="min-h-11 whitespace-normal"
        leftIcon={<Crown className="h-4 w-4" />}
        onClick={() => {
          setSubscriptionActionError('')
          setShowSubscriptionModal(true)
        }}
      >
        {t('profile.upgradeNow')}
      </Button>
    ) : shouldShowButtons && shouldShowCancelButton && !subscriptionInfo?.cancel_at_period_end ? (
      <Button
        fullWidth
        variant="ghost"
        className="min-h-11 whitespace-normal"
        disabled={isSubscriptionProcessing}
        onClick={() => {
          setSubscriptionActionError('')
          setShowCancelModal(true)
        }}
      >
        {t('profile.cancelSubscription')}
      </Button>
    ) : undefined

  const subscriptionDate =
    subscriptionInfo?.status === 'trialing'
      ? subscriptionInfo.trial_end || subscriptionInfo.current_period_end
      : subscriptionInfo?.current_period_end
  const nextBillingScheduled =
    !subscriptionInfo?.cancel_at_period_end &&
    (subscriptionInfo?.status === 'active' || subscriptionInfo?.status === 'trialing')

  return (
    <Page width="standard">
      <PageHeader
        title={t('profile.title')}
        subtitle={t('profile.description')}
      />

      {successMessage ? <Alert tone="success" title={successMessage} /> : null}
      {errors.general ? <Alert tone="error" title={errors.general} /> : null}

      <div className="grid items-start gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
          <Panel
            title={t('profile.accountSettings')}
            subtitle={t('profile.personalInfoDescription')}
            icon={<UserIcon className="h-4 w-4" />}
          >
            <dl>
              <SettingsRow label={t('profile.displayName')}>
                {isEditingName ? (
                  <form
                    onSubmit={event => {
                      event.preventDefault()
                      void handleNameSave()
                    }}
                  >
                    <Field label={t('profile.displayName')} hideLabel error={errors.name}>
                      {props => (
                        <input
                          {...props}
                          ref={nameInputRef}
                          type="text"
                          className="input min-h-11"
                          value={editedName}
                          onChange={event => setEditedName(event.target.value)}
                          placeholder={t('profile.enterDisplayName')}
                          autoComplete="name"
                          disabled={isLoading}
                        />
                      )}
                    </Field>
                    <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                      <Button type="submit" size="sm" className="min-h-11 whitespace-normal" loading={isLoading}>
                        {t('profile.saveDisplayName')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="min-h-11"
                        disabled={isLoading}
                        onClick={() => {
                          setIsEditingName(false)
                          setEditedName(user?.name || '')
                          setErrors({})
                        }}
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <span className="min-w-0 text-sm font-medium text-text-primary [overflow-wrap:anywhere]">
                      {user?.name || t('profile.enterDisplayName')}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="-mr-3 min-h-11"
                      aria-label={t('profile.editDisplayName')}
                      leftIcon={<Pencil className="h-3.5 w-3.5" />}
                      onClick={() => {
                        setIsEditingName(true)
                        setEditedName(user?.name || '')
                        setErrors({})
                      }}
                    >
                      {t('common.edit')}
                    </Button>
                  </div>
                )}
              </SettingsRow>

              <SettingsRow label={t('profile.email')}>
                <span className="block text-sm leading-6 font-medium text-text-primary [overflow-wrap:anywhere]">
                  {user?.email}
                </span>
              </SettingsRow>

              <SettingsRow label={t('profile.preferredLanguage')}>
                {isEditingLanguage ? (
                  <form
                    onSubmit={event => {
                      event.preventDefault()
                      void handleLanguageSave()
                    }}
                  >
                    <Field
                      label={t('profile.preferredLanguage')}
                      hideLabel
                      error={errors.language}
                      icon={<Globe className="h-4 w-4" />}
                    >
                      {props => (
                        <select
                          {...props}
                          ref={languageInputRef}
                          className="input min-h-11 pl-9"
                          value={editedLanguage}
                          onChange={event => setEditedLanguage(event.target.value === 'zh' ? 'zh' : 'en')}
                          disabled={isLoading}
                        >
                          <option value="en">{t('profile.english')}</option>
                          <option value="zh">{t('profile.chinese')}</option>
                        </select>
                      )}
                    </Field>
                    <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                      <Button type="submit" size="sm" className="min-h-11 whitespace-normal" loading={isLoading}>
                        {t('profile.saveLanguage')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="min-h-11"
                        disabled={isLoading}
                        onClick={() => {
                          setIsEditingLanguage(false)
                          setEditedLanguage(user?.preferred_language || 'en')
                          setErrors({})
                        }}
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <span className="text-sm font-medium text-text-primary">
                      {user?.preferred_language === 'zh'
                        ? t('profile.chinese')
                        : t('profile.english')}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="-mr-3 min-h-11"
                      aria-label={t('profile.changeLanguage')}
                      leftIcon={<Pencil className="h-3.5 w-3.5" />}
                      onClick={() => {
                        setIsEditingLanguage(true)
                        setEditedLanguage(user?.preferred_language || 'en')
                        setErrors({})
                      }}
                    >
                      {t('common.edit')}
                    </Button>
                  </div>
                )}
              </SettingsRow>
            </dl>
          </Panel>

          <Panel
            title={t('profile.emailPreferences')}
            subtitle={t('profile.emailPreferencesDescription')}
            icon={<Mail className="h-4 w-4" />}
          >
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {t('profile.dailySignalsEmail')}
                </h3>
                <div id="daily-signals-email-description" className="mt-2 space-y-2 text-sm leading-6 text-text-secondary">
                  <p>{t('profile.dailySignalsEmailDescription')}</p>
                  {!canManageDailySignalsEmail ? (
                    <p className="text-text-muted">{t('profile.dailySignalsEmailPremiumOnly')}</p>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                role="switch"
                aria-checked={dailySignalsEmailEnabled}
                aria-label={t('profile.dailySignalsEmail')}
                aria-describedby="daily-signals-email-description"
                disabled={!canManageDailySignalsEmail || isDailySignalsUpdating}
                loading={isDailySignalsUpdating}
                onClick={handleDailySignalsEmailToggle}
                className="-ml-3 min-h-11 gap-3 self-start"
              >
                <span
                  aria-hidden
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors duration-150',
                    dailySignalsEmailEnabled
                      ? 'border-accent-500 bg-accent-500'
                      : 'border-border-strong bg-surface-strong',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform duration-150',
                      dailySignalsEmailEnabled && 'translate-x-5',
                    )}
                  />
                </span>
                <span>
                  {dailySignalsEmailEnabled ? t('profile.emailEnabled') : t('profile.emailDisabled')}
                </span>
              </Button>
            </div>
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
          <Panel
            title={t('profile.subscription')}
            subtitle={t('profile.membershipDescription')}
            icon={<CreditCard className="h-4 w-4" />}
            footer={subscriptionFooter}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <p className="text-sm font-medium text-text-primary">
                {t('profile.currentPlan')}
              </p>
              <Badge tone={roleTone}>{memberTypeLabel(user?.role)}</Badge>
            </div>

            {user?.role === 'free' ? (
              <div>
                {user.has_premium_access && user.premium_access_expires_at ? (
                  <Alert
                    tone="success"
                    className="mt-5"
                    title={t('profile.referralAccessActive')}
                  >
                    {t('profile.referralAccessUntil', {
                      date: formatDate(user.premium_access_expires_at),
                    })}
                  </Alert>
                ) : null}
                <div className="divide-y divide-border">
                  <section className="py-5">
                    <h3 className="text-sm font-semibold text-text-primary">
                      {t('profile.includedNow')}
                    </h3>
                    <ul className="mt-3 space-y-3">
                      {FREE_ACCESS_KEYS.map(key => (
                        <li
                          key={key}
                          className="flex items-start gap-2.5 text-sm leading-6 text-text-secondary"
                        >
                          <Check className="mt-1 h-4 w-4 shrink-0 text-text-muted" aria-hidden />
                          {t(`profile.freeCapabilities.${key}`)}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="pt-5">
                    <h3 className="text-sm font-semibold text-text-primary">
                      {t('profile.upgradeAdds')}
                    </h3>
                    <ul className="mt-3 space-y-3">
                      {PREMIUM_ACCESS_KEYS.map(key => (
                        <li
                          key={key}
                          className="flex items-start gap-2.5 text-sm leading-6 text-text-secondary"
                        >
                          <Check className="mt-1 h-4 w-4 shrink-0 text-text-muted" aria-hidden />
                          {t(`profile.featureCapabilities.${key}`)}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>
            ) : (
              <div className="space-y-5 pt-5">
                <p className="text-sm leading-6 text-text-secondary">{roleDescription}</p>
                {planExpiresAt ? (
                  <dl>
                    <dt className="text-xs text-text-muted">{t('profile.planExpires')}</dt>
                    <dd className="num mt-1 text-sm font-semibold text-text-primary">
                      {formatDate(planExpiresAt)}
                    </dd>
                  </dl>
                ) : null}

                {user?.role === 'premium' ? (
                  isSubscriptionLoading ? (
                    <div className="space-y-3 border-t border-border pt-5" role="status">
                      <p className="text-sm text-text-secondary">{t('profile.subscriptionInfo.loading')}</p>
                      <Skeleton height={16} width="70%" />
                      <Skeleton height={16} width="45%" />
                    </div>
                  ) : subscriptionLoadFailed ? (
                    <Alert tone="error">{t('profile.subscriptionInfo.loadFailed')}</Alert>
                  ) : (
                    <>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border pt-5">
                        <div className="min-w-0">
                          <dt className="text-xs text-text-muted">{t('profile.subscriptionInfo.status')}</dt>
                          <dd className="mt-2">
                            <Badge
                              tone={
                                subscriptionInfo?.status === 'past_due' || subscriptionInfo?.status === 'unpaid'
                                  ? 'warn'
                                  : 'neutral'
                              }
                            >
                              {subscriptionInfo?.status
                                ? t(`profile.subscriptionInfo.${subscriptionInfo.status}`)
                                : '\u2014'}
                            </Badge>
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-xs text-text-muted">
                            {t('profile.subscriptionInfo.billingInterval')}
                          </dt>
                          <dd className="mt-2 text-sm font-medium text-text-primary">
                            {subscriptionInfo?.billing_interval === 'month'
                              ? t('profile.subscriptionInfo.monthly')
                              : subscriptionInfo?.billing_interval === 'year'
                                ? t('profile.subscriptionInfo.yearly')
                                : '\u2014'}
                          </dd>
                        </div>
                        {subscriptionDate ? (
                          <div className="col-span-2">
                            <dt className="text-xs text-text-muted">
                              {nextBillingScheduled
                                ? t('profile.subscriptionInfo.nextBilling')
                                : t('profile.subscriptionInfo.expiresAt')}
                            </dt>
                            <dd className="num mt-1 text-sm font-semibold text-text-primary">
                              {formatDate(subscriptionDate)}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                      {subscriptionInfo?.cancel_at_period_end ? (
                        <Alert tone="info">{t('profile.subscriptionInfo.cancelAtPeriodEnd')}</Alert>
                      ) : null}
                    </>
                  )
                ) : null}
              </div>
            )}
          </Panel>

          <Panel
            title={t('profile.referralProgram')}
            subtitle={t('profile.referralProgramDescription')}
            icon={<Users className="h-4 w-4" />}
          >
            <p className="text-sm leading-7 text-text-secondary">
              {t('profile.referralProgramDetails')}
            </p>
            <Button
              variant="secondary"
              fullWidth
              className="mt-5 min-h-11 whitespace-normal"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={() =>
                navigate({
                  pathname: '/referrals',
                  search: searchParams.get('mock') === 'true' ? '?mock=true' : '',
                })
              }
            >
              {t('profile.openReferralProgram')}
            </Button>
          </Panel>
        </div>
      </div>

      {user ? <AgentConnectionPanel userId={user.id} /> : null}

      <Panel
        className="border-bear-line"
        title={t('profile.dangerZone')}
        subtitle={t('profile.dangerZoneDescription')}
        icon={<Trash2 className="h-4 w-4 text-bear" />}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-text-primary">
              {t('profile.deleteAccount')}
            </p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              {t('profile.deleteAccountDescription')}
            </p>
          </div>
          <Button
            variant="outline"
            className="min-h-11 w-full self-start border-bear-line whitespace-normal text-bear hover:border-bear-line hover:bg-bear-soft hover:text-bear sm:w-auto sm:self-center"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => {
              setDeleteConfirmation('')
              setDeleteError('')
              setShowDeleteModal(true)
            }}
          >
            {t('profile.deleteAccount')}
          </Button>
        </div>
      </Panel>

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => {
          if (!isSubscriptionProcessing) setShowSubscriptionModal(false)
        }}
        onSelectPlan={handleSelectPlan}
        isLoading={isSubscriptionProcessing}
        pricingPlans={pricingPlans}
        trialPeriodDays={trialPeriodDays}
        pricingLoading={isPricingLoading}
        pricingFailed={pricingLoadFailed}
        error={subscriptionActionError}
      />

      <Modal
        open={showCancelModal}
        onClose={() => {
          if (!isSubscriptionProcessing) setShowCancelModal(false)
        }}
        title={t('profile.cancelSubscriptionConfirm.title')}
        icon={<CreditCard className="h-4 w-4 text-text-secondary" />}
        size="sm"
        footer={
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="secondary"
              fullWidth
              className="min-h-11 whitespace-normal"
              onClick={() => setShowCancelModal(false)}
              disabled={isSubscriptionProcessing}
            >
              {t('profile.cancelSubscriptionConfirm.cancelButton')}
            </Button>
            <Button
              variant="danger"
              fullWidth
              className="min-h-11 whitespace-normal"
              onClick={handleCancelSubscription}
              loading={isSubscriptionProcessing}
            >
              {t('profile.cancelSubscriptionConfirm.confirmButton')}
            </Button>
          </div>
        }
      >
        {subscriptionActionError ? <Alert tone="error" className="mb-4">{subscriptionActionError}</Alert> : null}
        <p className="text-sm leading-7 text-text-secondary">
          {t('profile.cancelSubscriptionConfirm.message')}
        </p>
      </Modal>

      <Modal
        open={showDeleteModal}
        onClose={() => {
          if (!isDeletingAccount) setShowDeleteModal(false)
        }}
        title={t('profile.deleteAccountConfirm.title')}
        icon={<Trash2 className="h-4 w-4 text-danger" />}
        size="sm"
        footer={
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="secondary"
              fullWidth
              className="min-h-11 whitespace-normal"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeletingAccount}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              type="submit"
              form="delete-account-confirmation"
              fullWidth
              className="min-h-11 whitespace-normal"
              loading={isDeletingAccount}
              disabled={
                !user ||
                deleteConfirmation.trim().toLowerCase() !== user.email.toLowerCase()
              }
            >
              {t('profile.deleteAccountConfirm.confirmButton')}
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-7 text-text-secondary">
          {t('profile.deleteAccountConfirm.message')}
        </p>
        <p className="mt-2 text-sm font-semibold text-text-primary [overflow-wrap:anywhere]">{user?.email}</p>
        <ul className="mt-4 list-disc space-y-2 pl-4 text-sm leading-6 text-text-secondary">
          <li>{t('profile.deleteAccountConfirm.billing')}</li>
          <li>{t('profile.deleteAccountConfirm.data')}</li>
          <li>{t('profile.deleteAccountConfirm.irreversible')}</li>
        </ul>
        <form
          id="delete-account-confirmation"
          noValidate
          className="mt-5"
          onSubmit={event => {
            event.preventDefault()
            void handleDeleteAccount()
          }}
        >
          <Field
            label={t('profile.deleteAccountConfirm.emailLabel')}
            error={deleteError || undefined}
          >
            {props => (
              <input
                {...props}
                type="email"
                inputMode="email"
                className="input min-h-11"
                value={deleteConfirmation}
                onChange={event => {
                  setDeleteConfirmation(event.target.value)
                  setDeleteError('')
                }}
                placeholder={user?.email}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                disabled={isDeletingAccount}
              />
            )}
          </Field>
        </form>
      </Modal>
    </Page>
  )
}

export default ProfilePage

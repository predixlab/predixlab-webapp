import { ArrowLeft, CheckCircle2, UserPlus, XCircle } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import AuthShell from '@/components/AuthShell'
import { Alert, Button, Field } from '@/components/ui'
import UserNoticeConsent from '@/components/UserNoticeConsent'
import { USER_NOTICE_VERSION } from '@/constants/legal'
import { useAuth } from '@/contexts/AuthContext'
import apiClient from '@/services/api'
import type { ApiError } from '@/types'

type OAuthCallbackError = Partial<ApiError> & { oauth_token?: string }

const toOAuthCallbackError = (error: unknown): OAuthCallbackError =>
  typeof error === 'object' && error !== null ? (error as OAuthCallbackError) : {}

const AuthCallbackPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshUser } = useAuth()

  const [status, setStatus] = useState<'processing' | 'success' | 'error' | 'confirm_needed'>(
    'processing',
  )
  const [error, setError] = useState('')
  const [oauthToken, setOauthToken] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [provider, setProvider] = useState<'google' | 'microsoft' | ''>('')
  const [noticeAccepted, setNoticeAccepted] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const callbackStartedRef = useRef(false)
  const confirmationStartedRef = useRef(false)

  const handleExchangeCode = useCallback(
    async (code: string, oauthProvider: 'google' | 'microsoft') => {
      try {
        await apiClient.exchangeOAuthCode({ code, provider: oauthProvider })
        await refreshUser()
        setStatus('success')
      } catch (exchangeError: unknown) {
        const oauthError = toOAuthCallbackError(exchangeError)
        if (oauthError?.status_code === 422 && oauthError?.detail?.includes('confirmation')) {
          const token = oauthError?.oauth_token
          if (token) {
            setOauthToken(token)
            setStatus('confirm_needed')
          } else {
            setStatus('error')
            setError(t('auth.oauth_token_not_found'))
          }
        } else {
          setStatus('error')
          setError(oauthError?.detail || t('auth.exchange_code_failed'))
        }
      }
    },
    [refreshUser, t],
  )

  useEffect(() => {
    if (callbackStartedRef.current) return
    callbackStartedRef.current = true

    const handleCallback = async () => {
      const code = searchParams.get('code')
      const token = searchParams.get('oauth_token')
      const callbackProvider = searchParams.get('provider') as 'google' | 'microsoft'
      const callbackStatus = searchParams.get('status') as 'success' | 'confirm'
      const callbackName = searchParams.get('name') || ''
      const callbackEmail = searchParams.get('email') || ''
      const callbackError = searchParams.get('error')

      setProvider(callbackProvider === 'google' || callbackProvider === 'microsoft' ? callbackProvider : '')
      setName(callbackName)
      setEmail(callbackEmail)

      if (callbackError) {
        setStatus('error')
        setError(t('auth.auth_provider_failed', { provider: callbackProvider }))
        return
      }

      if (callbackStatus === 'success') {
        if (!code || !callbackProvider) {
          setStatus('error')
          setError(t('auth.missing_code_or_provider'))
          return
        }
        await handleExchangeCode(code, callbackProvider)
      } else if (callbackStatus === 'confirm') {
        if (!token) {
          setStatus('error')
          setError(t('auth.missing_oauth_token'))
          return
        }
        setOauthToken(token)
        setStatus('confirm_needed')
      } else {
        setStatus('error')
        setError(t('auth.invalid_status'))
      }
    }
    void handleCallback()
  }, [handleExchangeCode, searchParams, t])

  useEffect(() => {
    if (status !== 'success') return
    const timer = window.setTimeout(() => navigate('/', { replace: true }), 800)
    return () => window.clearTimeout(timer)
  }, [navigate, status])

  const handleConfirmRegistration = async () => {
    if (confirmationStartedRef.current) return
    if (!oauthToken) {
      setError(t('auth.oauth_token_missing'))
      return
    }
    if (!name || name.length < 2 || name.length > 50) {
      setError(
        !name
          ? t('auth.displayNameRequired')
          : name.length < 2
            ? t('auth.displayNameTooShort')
            : t('auth.displayNameTooLong'),
      )
      return
    }
    if (!noticeAccepted) {
      setError(t('auth.noticeRequired'))
      return
    }
    confirmationStartedRef.current = true
    setConfirming(true)
    setError('')
    try {
      await apiClient.confirmOAuthUser({
        oauth_token: oauthToken,
        confirmed: true,
        name: name || undefined,
        user_notice_version: USER_NOTICE_VERSION,
      })
      await refreshUser()
      setStatus('success')
    } catch (confirmError: unknown) {
      setStatus('error')
      setError(toOAuthCallbackError(confirmError)?.detail || t('auth.confirm_user_failed'))
    } finally {
      confirmationStartedRef.current = false
      setConfirming(false)
    }
  }

  if (status === 'error') {
    return (
      <AuthShell
        icon={<XCircle className="h-5 w-5 text-bear" />}
        title={t('auth.login_failed')}
      >
        <div className="space-y-6">
          <Alert tone="error" className="[overflow-wrap:anywhere]">{error}</Alert>
          <Button
            size="lg"
            fullWidth
            onClick={() => navigate('/login')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            {t('auth.back_to_login')}
          </Button>
        </div>
      </AuthShell>
    )
  }

  if (status === 'processing') {
    return (
      <AuthShell title={t('auth.processing')}>
        <div className="flex items-center gap-3 border-y border-border py-6" role="status">
          <span className="spinner h-5 w-5 shrink-0 text-accent-500" aria-hidden />
          <p className="text-sm leading-6 text-text-secondary">{t('auth.processing_login')}</p>
        </div>
      </AuthShell>
    )
  }

  if (status === 'success') {
    return (
      <AuthShell
        icon={<CheckCircle2 className="h-5 w-5 text-bull" />}
        title={t('auth.login_successful')}
      >
        <div className="flex items-center gap-3 border-y border-border py-6" role="status">
          <span className="spinner h-5 w-5 shrink-0 text-accent-500" aria-hidden />
          <p className="text-sm leading-6 text-text-secondary">{t('auth.redirecting')}</p>
        </div>
      </AuthShell>
    )
  }

  const nameTooShort = Boolean(name) && name.length < 2
  const nameTooLong = name.length > 50

  return (
    <AuthShell
      icon={<UserPlus className="h-5 w-5" />}
      title={t('auth.welcome_new_user')}
      subtitle={t('auth.confirm_registration_description')}
      footer={
        <div className="space-y-2">
          <p className="text-xs leading-5">{t('auth.confirm_terms_notice')}</p>
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11"
            disabled={confirming}
            leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
            onClick={() => navigate('/login')}
          >
            {t('auth.back_to_login')}
          </Button>
        </div>
      }
    >
      <form
        noValidate
        onSubmit={event => {
          event.preventDefault()
          void handleConfirmRegistration()
        }}
        className="space-y-5"
        aria-busy={confirming}
      >
        {error ? <Alert tone="error" className="[overflow-wrap:anywhere]">{error}</Alert> : null}

        <dl className="divide-y divide-border rounded-md bg-surface-raised px-4">
          <div className="py-3.5">
            <dt className="text-xs text-text-secondary">{t('auth.email')}</dt>
            <dd className="mt-1 text-sm font-semibold text-text-primary [overflow-wrap:anywhere]">
              {email || '\u2014'}
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 py-3.5">
            <dt className="text-xs text-text-secondary">{t('auth.provider')}</dt>
            <dd className="text-sm font-medium text-text-primary">
              {provider === 'google' ? 'Google' : provider === 'microsoft' ? 'Microsoft' : '\u2014'}
            </dd>
          </div>
        </dl>

        <Field
          label={t('auth.display_name')}
          required
          error={
            nameTooShort
              ? t('auth.displayNameTooShort')
              : nameTooLong
                ? t('auth.displayNameTooLong')
                : undefined
          }
        >
          {props => (
            <input
              {...props}
              type="text"
              autoComplete="name"
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder={t('auth.enter_display_name')}
              className="input h-12"
              disabled={confirming}
              required
            />
          )}
        </Field>

        <UserNoticeConsent
          checked={noticeAccepted}
          disabled={confirming}
          onChange={accepted => {
            setNoticeAccepted(accepted)
            if (accepted) setError('')
          }}
          showError={Boolean(error) && !noticeAccepted}
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={confirming}
          disabled={confirming || !name || nameTooShort || nameTooLong || !noticeAccepted}
        >
          {confirming ? t('auth.processing') : t('auth.confirm_and_continue')}
        </Button>
      </form>
    </AuthShell>
  )
}

export default AuthCallbackPage

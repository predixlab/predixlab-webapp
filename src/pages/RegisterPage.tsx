import { ArrowLeft, ArrowRight, Mail, ShieldCheck, User } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FaGoogle, FaMicrosoft } from 'react-icons/fa'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import AuthShell from '@/components/AuthShell'
import { Alert, Button, Field } from '@/components/ui'
import UserNoticeConsent from '@/components/UserNoticeConsent'
import VerificationCodeInput from '@/components/VerificationCodeInput'
import { USER_NOTICE_VERSION } from '@/constants/legal'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/apiAdapter'
import type { ReferralValidationResponse } from '@/types'
import { parseApiError } from '@/utils'

interface RegisterFormData {
  email: string
}

interface VerificationFormData {
  code: string
  name: string
}

const RegisterPage: React.FC = () => {
  const { t } = useTranslation()
  const { registerUser, requestEmailRegisterCode, getGoogleLoginUrl, getMicrosoftLoginUrl } =
    useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [step, setStep] = useState<'email' | 'verification'>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [noticeAccepted, setNoticeAccepted] = useState(false)
  const [showNoticeError, setShowNoticeError] = useState(false)
  const [referralValidation, setReferralValidation] =
    useState<ReferralValidationResponse | null>(null)

  const returnLocation = location.state?.from
  const from = returnLocation
    ? `${returnLocation.pathname}${returnLocation.search ?? ''}${returnLocation.hash ?? ''}`
    : '/'
  const referralCode = new URLSearchParams(location.search)
    .get('ref')
    ?.trim()
    .toUpperCase()
  const acceptedReferralCode = referralValidation?.valid
    ? referralCode
    : undefined

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm<RegisterFormData>()

  const {
    register: registerCode,
    handleSubmit: handleCodeSubmit,
    formState: { errors: codeErrors },
    reset: resetCodeForm,
    control,
  } = useForm<VerificationFormData>({ defaultValues: { code: '', name: '' } })

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  useEffect(() => {
    if (!referralCode) {
      setReferralValidation(null)
      return
    }

    let visitorId = localStorage.getItem('predixlab-referral-visitor')
    if (!visitorId) {
      visitorId = crypto.randomUUID()
      localStorage.setItem('predixlab-referral-visitor', visitorId)
    }

    let active = true
    api
      .trackReferralClick({
        referral_code: referralCode,
        visitor_id: visitorId,
      })
      .then(validation => {
        if (active) setReferralValidation(validation)
      })
      .catch(() => {
        if (active) {
          setReferralValidation({ valid: false, invitee_reward_days: 0 })
        }
      })

    return () => {
      active = false
    }
  }, [referralCode])

  const onEmailSubmit = async (data: RegisterFormData) => {
    if (!noticeAccepted) {
      setShowNoticeError(true)
      return
    }
    setLoading(true)
    setError('')
    try {
      await requestEmailRegisterCode({ email: data.email })
      setEmail(data.email)
      setStep('verification')
      setCountdown(60)
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const onCodeSubmit = async (data: VerificationFormData) => {
    setLoading(true)
    setError('')
    try {
      await registerUser({
        email,
        code: data.code,
        name: data.name,
        user_notice_version: USER_NOTICE_VERSION,
        referral_code: acceptedReferralCode,
      })
      navigate(from, { replace: true })
    } catch (err) {
      setError(parseApiError(err))
      resetCodeForm()
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (countdown > 0) return
    setLoading(true)
    setError('')
    try {
      await requestEmailRegisterCode({ email })
      setCountdown(60)
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      icon={step === 'email' ? <Mail className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
      title={step === 'email' ? t('auth.register') : t('auth.completeRegistration')}
      subtitle={t('auth.registerWithEmail')}
      steps={[t('auth.email'), t('auth.completeRegistration')]}
      currentStep={step === 'email' ? 0 : 1}
      footer={
        step === 'email' ? (
          <p>
            {t('auth.alreadyHaveAccount')}{' '}
            <Link
              to="/login"
              state={location.state}
              className="inline-flex min-h-11 items-center font-semibold text-accent-400 underline decoration-accent-line underline-offset-4 hover:decoration-current"
            >
              {t('auth.loginHere')}
            </Link>
          </p>
        ) : null
      }
    >
      <div className="space-y-6">
        {error ? <Alert tone="error" className="[overflow-wrap:anywhere]">{error}</Alert> : null}
        {referralValidation?.valid ? (
          <Alert tone="success">
            {referralValidation.invitee_reward_days > 0
              ? t('referrals.inviteAccepted', {
                  days: referralValidation.invitee_reward_days,
                })
              : t('referrals.inviteRecognized')}
          </Alert>
        ) : referralValidation ? (
          <Alert tone="warning">{t('referrals.invalidInvite')}</Alert>
        ) : null}

        {step === 'email' ? (
          <form noValidate onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-5" aria-busy={loading}>
            <Field
              label={t('auth.email')}
              required
              error={emailErrors.email?.message}
              icon={<Mail className="h-4 w-4" />}
            >
              {props => (
                <input
                  {...props}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-required
                  disabled={loading}
                  className="input h-12 pl-9"
                  placeholder="you@example.com"
                  {...registerEmail('email', {
                    required: t('auth.emailRequired'),
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: t('auth.emailInvalid'),
                    },
                  })}
                />
              )}
            </Field>

            <UserNoticeConsent
              checked={noticeAccepted}
              disabled={loading}
              onChange={accepted => {
                setNoticeAccepted(accepted)
                if (accepted) setShowNoticeError(false)
              }}
              showError={showNoticeError}
              onInvalid={() => setShowNoticeError(true)}
            />

            <Button
              type="submit"
              size="lg"
              loading={loading}
              disabled={!noticeAccepted}
              fullWidth
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {t('auth.sendRegistrationCode')}
            </Button>
          </form>
        ) : (
          <form noValidate onSubmit={handleCodeSubmit(onCodeSubmit)} className="space-y-5" aria-busy={loading}>
            <div className="flex items-start gap-3 rounded-md bg-surface-raised px-4 py-3.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs leading-5 text-text-secondary">{t('auth.registrationCodeSent')}</p>
                <p className="mt-1 text-sm font-semibold text-text-primary [overflow-wrap:anywhere]">
                  {email}
                </p>
              </div>
            </div>

            <Field label={t('auth.verificationCode')} error={codeErrors.code?.message} required>
              {props => (
                <VerificationCodeInput
                  {...props}
                  name="code"
                  control={control}
                  disabled={loading}
                  rules={{
                    required: t('auth.codeRequired'),
                    pattern: { value: /^\d{6}$/, message: t('auth.codeInvalid') },
                  }}
                />
              )}
            </Field>

            <Field
              label={t('auth.displayName')}
              required
              error={codeErrors.name?.message}
              icon={<User className="h-4 w-4" />}
            >
              {props => (
                <input
                  {...props}
                  type="text"
                  autoComplete="name"
                  aria-required
                  disabled={loading}
                  className="input h-12 pl-9"
                  placeholder={t('auth.enterDisplayName')}
                  {...registerCode('name', {
                    required: t('auth.displayNameRequired'),
                    minLength: { value: 2, message: t('auth.displayNameTooShort') },
                    maxLength: { value: 50, message: t('auth.displayNameTooLong') },
                  })}
                />
              )}
            </Field>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              fullWidth
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {t('auth.completeRegistration')}
            </Button>

            <div className="flex flex-wrap items-center justify-between gap-1 border-t border-border pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-3 min-h-11"
                leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
                disabled={loading}
                onClick={() => {
                  setStep('email')
                  setError('')
                  resetCodeForm()
                }}
              >
                {t('common.back')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-mr-3 ml-auto min-h-11 whitespace-normal"
                onClick={handleResendCode}
                disabled={countdown > 0 || loading}
              >
                {countdown > 0 ? (
                  <>
                    {t('auth.resendCode')} <span className="num">({countdown}s)</span>
                  </>
                ) : (
                  t('auth.resendCode')
                )}
              </Button>
            </div>
          </form>
        )}

        {step === 'email' ? (
          <>
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-text-muted">{t('auth.orContinueWith')}</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                className="min-h-12 min-w-0 px-3"
                disabled={loading}
                onClick={() => {
                  window.location.href = getGoogleLoginUrl(acceptedReferralCode)
                }}
                leftIcon={<FaGoogle className="h-4 w-4" />}
              >
                Google
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                className="min-h-12 min-w-0 px-3"
                disabled={loading}
                onClick={() => {
                  window.location.href = getMicrosoftLoginUrl(acceptedReferralCode)
                }}
                leftIcon={<FaMicrosoft className="h-4 w-4" />}
              >
                Microsoft
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </AuthShell>
  )
}

export default RegisterPage

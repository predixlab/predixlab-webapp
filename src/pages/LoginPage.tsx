import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FaGoogle, FaMicrosoft } from 'react-icons/fa'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import AuthShell from '@/components/AuthShell'
import { Alert, Button, Field } from '@/components/ui'
import { UserNoticeLink } from '@/components/UserNoticeConsent'
import VerificationCodeInput from '@/components/VerificationCodeInput'
import { useAuth } from '@/contexts/AuthContext'
import { parseApiError } from '@/utils'

interface LoginFormData {
  email: string
}

interface VerificationFormData {
  code: string
}

const LoginPage: React.FC = () => {
  const { t } = useTranslation()
  const {
    login,
    isAuthenticated,
    requestEmailLoginCode,
    getGoogleLoginUrl,
    getMicrosoftLoginUrl,
    refreshUser,
  } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [step, setStep] = useState<'email' | 'verification'>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  const returnLocation = location.state?.from
  const from = returnLocation
    ? `${returnLocation.pathname}${returnLocation.search ?? ''}${returnLocation.hash ?? ''}`
    : '/'

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm<LoginFormData>()

  const {
    handleSubmit: handleCodeSubmit,
    formState: { errors: codeErrors },
    reset: resetCodeForm,
    control,
  } = useForm<VerificationFormData>({ defaultValues: { code: '' } })

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          await refreshUser()
          navigate(from, { replace: true })
        } catch {
          /* stay on the login page */
        }
      }
    }
    checkAuth()
  }, [isAuthenticated, navigate, from, refreshUser])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const onEmailSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError('')
    try {
      await requestEmailLoginCode({ email: data.email })
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
      await login(email, data.code)
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
      await requestEmailLoginCode({ email })
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
      title={step === 'email' ? t('auth.login') : t('auth.verificationCode')}
      subtitle={t('auth.loginWithEmail')}
      steps={[t('auth.email'), t('auth.verificationCode')]}
      currentStep={step === 'email' ? 0 : 1}
      footer={
        step === 'email' ? (
          <>
            <p>
              {t('auth.noAccount')}{' '}
              <Link
                to="/register"
                state={location.state}
                className="inline-flex min-h-11 items-center font-semibold text-accent-400 underline decoration-accent-line underline-offset-4 hover:decoration-current"
              >
                {t('auth.registerHere')}
              </Link>
            </p>
            <UserNoticeLink className="mt-2" />
          </>
        ) : null
      }
    >
      <div className="space-y-6">
        {error ? <Alert tone="error" className="[overflow-wrap:anywhere]">{error}</Alert> : null}

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

            <Button
              type="submit"
              size="lg"
              loading={loading}
              fullWidth
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {t('auth.sendCode')}
            </Button>
          </form>
        ) : (
          <form noValidate onSubmit={handleCodeSubmit(onCodeSubmit)} className="space-y-5" aria-busy={loading}>
            <div className="flex items-start gap-3 rounded-md bg-surface-raised px-4 py-3.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs leading-5 text-text-secondary">{t('auth.codeSent')}</p>
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

            <Button
              type="submit"
              size="lg"
              loading={loading}
              fullWidth
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {t('auth.verifyCode')}
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
                aria-label={t('auth.loginWithGoogle')}
                onClick={() => {
                  window.location.href = getGoogleLoginUrl()
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
                aria-label={t('auth.loginWithMicrosoft')}
                onClick={() => {
                  window.location.href = getMicrosoftLoginUrl()
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

export default LoginPage

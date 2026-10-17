import { BarChart3, Check, Clock3, ShieldCheck } from 'lucide-react'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/utils'

interface AuthShellProps {
  icon?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  steps?: string[]
  currentStep?: number
  className?: string
}

const AuthShell: React.FC<AuthShellProps> = ({
  icon,
  title,
  subtitle,
  children,
  footer,
  steps,
  currentStep = 0,
  className,
}) => {
  const { t } = useTranslation()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const previousStepRef = useRef(currentStep)
  const points = [
    { icon: Clock3, label: t('auth.workspaceDaily') },
    { icon: BarChart3, label: t('auth.workspaceMarket') },
    { icon: ShieldCheck, label: t('auth.workspaceTransparent') },
  ]

  useEffect(() => {
    if (previousStepRef.current !== currentStep) {
      headingRef.current?.focus()
      previousStepRef.current = currentStep
    }
  }, [currentStep])

  return (
    <div className="flex w-full min-w-0 flex-1 items-start justify-center bg-app px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-10 lg:items-center lg:py-12">
      <div
        className={cn(
          'pl-fade-in grid w-full min-w-0 max-w-lg overflow-hidden rounded-lg border border-border bg-surface shadow-sm lg:max-w-[68rem] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)]',
          className,
        )}
      >
        <section className="hidden min-h-[38rem] flex-col justify-between gap-12 bg-sidebar p-10 text-[var(--pl-nav-text)] lg:flex xl:p-12">
          <div>
            <p className="text-xs font-semibold tracking-[0.08em] text-[var(--pl-nav-muted)]">
              {t('auth.workspaceLabel')}
            </p>
            <h2 className="mt-8 max-w-md text-[2.25rem] leading-[1.2] font-semibold tracking-[-0.045em] text-[var(--pl-nav-active)]">
              {t('auth.workspaceTitle')}
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7">
              {t('auth.workspaceDescription')}
            </p>
          </div>
          <ul className="divide-y divide-[var(--pl-nav-border)] border-y border-[var(--pl-nav-border)]">
            {points.map(point => {
              const PointIcon = point.icon
              return (
                <li key={point.label} className="flex items-start gap-3 py-4 text-sm leading-6">
                  <PointIcon className="mt-1 h-4 w-4 shrink-0 text-[var(--pl-nav-muted)]" aria-hidden />
                  {point.label}
                </li>
              )
            })}
          </ul>
        </section>

        <section className="flex min-w-0 flex-col justify-center px-5 py-6 sm:p-8 lg:px-10 lg:py-10">
          <div className="mx-auto w-full min-w-0 max-w-md">
            {steps ? (
              <ol className="mb-7 flex gap-4 border-b border-border pb-5">
                {steps.map((label, index) => (
                  <li
                    key={label}
                    aria-current={index === currentStep ? 'step' : undefined}
                    className={cn(
                      'flex min-w-0 flex-1 items-center gap-2 text-xs leading-5',
                      index === currentStep ? 'font-semibold text-text-primary' : 'text-text-muted',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'num flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-2xs',
                        index === currentStep
                          ? 'border-accent-line bg-accent-soft text-accent-400'
                          : 'border-border bg-surface-raised text-text-muted',
                      )}
                    >
                      {index < currentStep ? <Check className="h-3.5 w-3.5" /> : index + 1}
                    </span>
                    <span>{label}</span>
                  </li>
                ))}
              </ol>
            ) : null}

            <header className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="text-2xl font-bold tracking-[-0.04em] text-text-primary outline-none sm:text-3xl"
                >
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mt-2.5 text-sm leading-6 text-text-secondary">{subtitle}</p>
                ) : null}
              </div>
              {icon ? (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-surface-raised text-text-secondary" aria-hidden>
                  {icon}
                </span>
              ) : null}
            </header>

            <div className="mt-7">{children}</div>

            {footer ? (
              <footer className="mt-7 border-t border-border pt-4 text-center text-sm leading-6 text-text-secondary">
                {footer}
              </footer>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}

export default AuthShell

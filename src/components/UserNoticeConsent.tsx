import { AlertTriangle, ShieldCheck } from 'lucide-react'
import React, { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Modal } from '@/components/ui'
import { getPortalLegalUrl } from '@/constants/legal'
import { cn } from '@/utils'

interface UserNoticeConsentProps {
  checked: boolean
  onChange: (checked: boolean) => void
  showError?: boolean
  onInvalid?: () => void
  disabled?: boolean
}

const NOTICE_SECTIONS = ['service', 'data', 'risk', 'responsibility', 'availability'] as const

interface UserNoticeModalProps {
  open: boolean
  onClose: () => void
  onAccept?: () => void
}

const UserNoticeModal: React.FC<UserNoticeModalProps> = ({ open, onClose, onAccept }) => {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('auth.noticeTitle')}
      icon={<AlertTriangle className="h-4 w-4 text-warn" />}
      size="lg"
      footer={
        <Button
          fullWidth
          className="min-h-11 whitespace-normal"
          onClick={() => {
            onAccept?.()
            onClose()
          }}
          leftIcon={onAccept ? <ShieldCheck className="h-4 w-4" /> : undefined}
        >
          {onAccept ? t('auth.noticeAccept') : t('common.close')}
        </Button>
      }
    >
      <div className="space-y-5 text-sm leading-7 text-text-secondary">
        <p>{t('auth.noticeIntro')}</p>

        <div className="divide-y divide-border border-y border-border">
          {NOTICE_SECTIONS.map(section => (
            <section key={section} className="py-5">
              <h3 className="font-semibold text-text-primary">
                {t(`auth.noticeSections.${section}.title`)}
              </h3>
              <p className="mt-1.5">{t(`auth.noticeSections.${section}.body`)}</p>
            </section>
          ))}
        </div>

        <p className="text-xs text-text-muted">{t('auth.noticeEffectiveDate')}</p>
      </div>
    </Modal>
  )
}

const UserNoticeConsent: React.FC<UserNoticeConsentProps> = ({
  checked,
  onChange,
  showError = false,
  onInvalid,
  disabled = false,
}) => {
  const { i18n, t } = useTranslation()
  const checkboxId = useId()
  const descriptionId = `${checkboxId}-description`
  const errorId = `${checkboxId}-error`
  const [noticeOpen, setNoticeOpen] = useState(false)

  return (
    <>
      <div
        className={cn(
          'rounded-md border bg-surface-raised px-3 py-2.5',
          showError && !checked ? 'border-bear-line bg-bear-soft' : 'border-border',
        )}
      >
        <div className="flex items-start gap-1">
          <label
            htmlFor={checkboxId}
            className={cn(
              '-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md',
              disabled ? 'cursor-not-allowed' : 'cursor-pointer',
            )}
          >
            <input
              id={checkboxId}
              type="checkbox"
              required
              checked={checked}
              disabled={disabled}
              onChange={event => onChange(event.target.checked)}
              onInvalid={event => {
                event.preventDefault()
                onInvalid?.()
              }}
              aria-labelledby={descriptionId}
              aria-describedby={showError && !checked ? errorId : undefined}
              aria-invalid={showError && !checked}
              className="h-5 w-5 cursor-inherit rounded accent-[var(--pl-accent-500)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500 disabled:opacity-50"
            />
          </label>
          <div id={descriptionId} className="min-w-0 flex-1 pt-2 text-sm leading-7">
            <label htmlFor={checkboxId} className={cn('text-text-secondary', !disabled && 'cursor-pointer')}>
              {t('auth.noticeConsentPrefix')}{' '}
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setNoticeOpen(true)}
              className="min-h-11 max-w-full justify-start rounded-sm px-0 text-left text-sm whitespace-normal text-accent-400 underline decoration-accent-line underline-offset-4 hover:bg-transparent hover:text-accent-400 hover:decoration-current"
            >
              {t('auth.noticeTitle')}
            </Button>
            <span className="text-text-secondary">{t('auth.legalDocumentSeparator')}</span>
            <a
              href={getPortalLegalUrl(i18n.language, 'terms')}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center rounded-sm font-semibold text-accent-400 underline decoration-accent-line underline-offset-4 hover:decoration-current"
            >
              {t('common.terms')}
            </a>
            <span className="text-text-secondary">{t('auth.legalDocumentSeparator')}</span>
            <a
              href={getPortalLegalUrl(i18n.language, 'privacy')}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center rounded-sm font-semibold text-accent-400 underline decoration-accent-line underline-offset-4 hover:decoration-current"
            >
              {t('common.privacy')}
            </a>
            <span className="text-text-secondary">{t('auth.noticeConsentSuffix')}</span>
          </div>
        </div>
        {showError && !checked ? (
          <p id={errorId} className="mt-2 pb-1 text-sm leading-6 text-bear" role="alert">
            {t('auth.noticeRequired')}
          </p>
        ) : null}
      </div>

      <UserNoticeModal
        open={noticeOpen}
        onClose={() => setNoticeOpen(false)}
      />
    </>
  )
}

export const UserNoticeLink: React.FC<{ className?: string }> = ({ className }) => {
  const { i18n, t } = useTranslation()
  const [noticeOpen, setNoticeOpen] = useState(false)

  return (
    <>
      <div className={cn('flex flex-wrap justify-center gap-x-4 text-xs', className)}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setNoticeOpen(true)}
          className="min-h-11 max-w-full px-0 text-xs whitespace-normal text-text-muted underline decoration-border-strong underline-offset-4 hover:bg-transparent hover:text-text-primary"
        >
          {t('auth.noticeView')}
        </Button>
        <a
          href={getPortalLegalUrl(i18n.language, 'terms')}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center rounded-sm font-medium text-text-muted underline decoration-border-strong underline-offset-4 hover:text-text-primary"
        >
          {t('common.terms')}
        </a>
        <a
          href={getPortalLegalUrl(i18n.language, 'privacy')}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center rounded-sm font-medium text-text-muted underline decoration-border-strong underline-offset-4 hover:text-text-primary"
        >
          {t('common.privacy')}
        </a>
      </div>
      <UserNoticeModal open={noticeOpen} onClose={() => setNoticeOpen(false)} />
    </>
  )
}

export default UserNoticeConsent

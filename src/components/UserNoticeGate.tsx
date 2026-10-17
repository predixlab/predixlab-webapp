import { LogOut, ShieldCheck } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, Button, Page, PageHeader, Panel } from '@/components/ui'
import UserNoticeConsent from '@/components/UserNoticeConsent'
import { USER_NOTICE_VERSION } from '@/constants/legal'
import { useAuth } from '@/contexts/AuthContext'
import { parseApiError } from '@/utils'

const UserNoticeGate: React.FC = () => {
  const { t } = useTranslation()
  const { acceptUserNotice, logout } = useAuth()
  const [accepted, setAccepted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const confirmAcceptance = async () => {
    if (!accepted) return
    setSaving(true)
    setError('')
    try {
      await acceptUserNotice(USER_NOTICE_VERSION)
    } catch (acceptanceError) {
      setError(parseApiError(acceptanceError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page width="narrow" className="max-w-3xl">
      <PageHeader
        title={t('auth.noticeUpdateTitle')}
        subtitle={t('auth.noticeUpdateDescription')}
      />
      <Panel
        title={t('auth.legalDocumentsTitle')}
        subtitle={t('auth.noticeEffectiveDate')}
        icon={<ShieldCheck className="h-4 w-4" />}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row-reverse sm:items-center sm:justify-between">
            <Button
              type="button"
              className="min-h-11 whitespace-normal"
              loading={saving}
              disabled={!accepted}
              onClick={confirmAcceptance}
            >
              {t('auth.noticeConfirm')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              disabled={saving}
              onClick={logout}
              leftIcon={<LogOut className="h-4 w-4" />}
            >
              {t('auth.logout')}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {error ? <Alert tone="error">{error}</Alert> : null}
          <p className="text-sm leading-7 text-text-secondary">{t('auth.noticeIntro')}</p>
          <UserNoticeConsent checked={accepted} onChange={setAccepted} disabled={saving} />
        </div>
      </Panel>
    </Page>
  )
}

export default UserNoticeGate

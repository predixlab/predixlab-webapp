import { Globe, Wrench, X } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui'
import { cn } from '@/utils'
import { isMockModeEnabled, toggleMockMode } from '@/utils/mockMode'

/**
 * Development affordance: shows whether the app is reading the live API or
 * fixtures, and switches between them. Sits above the mobile tab bar so it
 * never covers navigation.
 */
const MockModeIndicator: React.FC = () => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const enabled = isMockModeEnabled()

  if (!enabled && import.meta.env.PROD) return null

  return (
    <div
      className="fixed right-[calc(env(safe-area-inset-right,0px)+0.75rem)] bottom-[calc(var(--pl-tabbar-h)+env(safe-area-inset-bottom,0px)+0.75rem)] lg:bottom-3"
      style={{ zIndex: 'var(--z-drawer)' }}
    >
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          title={enabled ? t('mock.usingFixtures') : t('mock.usingLiveApi')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-2xs font-medium shadow-md transition-colors duration-150',
            'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500',
            enabled
              ? 'border-warn-line bg-warn-soft text-warn hover:brightness-105'
              : 'border-border bg-surface text-text-muted hover:text-text-primary',
          )}
        >
          {enabled ? <Wrench className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
          {enabled ? t('mock.mock') : t('mock.live')}
        </button>
      ) : (
        <div className="w-64 rounded-lg border border-border bg-surface-overlay p-3 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">{t('mock.title')}</p>
              <p className="mt-0.5 text-xs text-text-muted">
                {enabled ? t('mock.usingFixtures') : t('mock.usingLiveApi')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label={t('common.close')}
              className="-mt-1 -mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            fullWidth
            className="mt-3"
            onClick={() => {
              toggleMockMode()
              setExpanded(false)
            }}
          >
            {enabled ? t('mock.switchToLive') : t('mock.switchToMock')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default MockModeIndicator

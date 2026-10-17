import { Activity, Layers3, Waves } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { Tabs } from '@/components/ui'

type OptionsView = 'activity' | 'gamma' | 'structure'

interface OptionsViewTabsProps {
  value: OptionsView
  symbol?: string
}

export default function OptionsViewTabs({ value, symbol }: OptionsViewTabsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const state: unknown = location.state
    if (
      typeof state === 'object' && state !== null &&
      'focusOptionsTab' in state && state.focusOptionsTab === value
    ) {
      // Route changes replace the outgoing tablist; keep navigation focus in the new one.
      containerRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')
        ?.focus({ preventScroll: true })
    }
  }, [location.key, location.state, value])

  return (
    <div ref={containerRef} className="min-w-0">
      <Tabs
        variant="underline"
        value={value}
        onChange={view => {
          const next = new URLSearchParams(searchParams)
          if (symbol) next.set('symbol', symbol)
          navigate(
            { pathname: `/options/${view}`, search: next.toString() },
            { state: { focusOptionsTab: view } },
          )
        }}
        aria-label={t('gex.optionsViews')}
        items={[
          { value: 'activity', label: t('nav.unusualOptions'), icon: <Activity className="h-4 w-4" aria-hidden /> },
          { value: 'gamma', label: t('nav.gammaMap'), icon: <Waves className="h-4 w-4" aria-hidden /> },
          { value: 'structure', label: t('nav.optionsStructure'), icon: <Layers3 className="h-4 w-4" aria-hidden /> },
        ]}
      />
    </div>
  )
}

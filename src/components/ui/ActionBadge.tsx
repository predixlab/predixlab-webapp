import React from 'react'
import { useTranslation } from 'react-i18next'

import { normalizePivotAction, type PivotAction, type PivotActionInput } from '@/types/picks'
import { cn } from '@/utils'

import Badge, { type BadgeTone } from './Badge'

interface ActionBadgeProps {
  action: PivotActionInput
  size?: 'sm' | 'md'
  label?: string
  className?: string
}

const actionTone: Record<PivotAction, BadgeTone> = {
  STRONGLY_BULLISH: 'bull',
  BULLISH: 'bull',
  NEUTRAL: 'neutral',
  BEARISH: 'bear',
  STRONGLY_BEARISH: 'bear',
}

/** Emphasise STRONG_* variants with a heavier weight while keeping tone. */
const ActionBadge: React.FC<ActionBadgeProps> = ({ action, size = 'md', label, className }) => {
  const { t } = useTranslation()
  const normalizedAction = normalizePivotAction(action)
  const strong = normalizedAction === 'STRONGLY_BULLISH' || normalizedAction === 'STRONGLY_BEARISH'
  return (
    <Badge tone={actionTone[normalizedAction]} size={size} dot className={cn(strong && 'font-semibold', className)}>
      {label ?? t(`picks.actions.${normalizedAction}`)}
    </Badge>
  )
}

export default ActionBadge

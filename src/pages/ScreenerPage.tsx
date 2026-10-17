import type { TFunction } from 'i18next'
import {
  Bookmark,
  Check,
  ChevronDown,
  ListFilter,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Alert,
  Badge,
  Button,
  Change,
  DataTable,
  EmptyState,
  Field,
  Modal,
  Page,
  PageHeader,
  Panel,
} from '@/components/ui'
import type { Column } from '@/components/ui'
import { useTickerChart } from '@/contexts/TickerChartContext'
import api from '@/services/apiAdapter'
import {
  ScreenerFilters,
  ScreenerMatch,
  ScreenerPreset,
  ScreenerResponse,
  ScreenerStrategy,
  TrendDirection,
} from '@/types'
import { cn, formatDay } from '@/utils'

const PAGE_SIZE = 25

const emptyFilters: ScreenerFilters = {}

const TRENDS: TrendDirection[] = [
  'strong_uptrend',
  'uptrend',
  'neutral',
  'downtrend',
  'strong_downtrend',
]

type RangeKey = keyof ScreenerFilters

interface RangeRow {
  label: string
  min: RangeKey
  /** Omitted when the metric is a one-sided threshold rather than a band. */
  max?: RangeKey
  /** Values are stored as fractions but read better as percents. */
  percent?: boolean
  step?: number
  /** Label for the single input when there is no upper bound. */
  soloPlaceholder?: string
}

type ToggleKey = 'above_sma20' | 'above_sma50' | 'above_sma200' | 'macd_bullish' | 'golden_cross'

type GroupId = 'liquidity' | 'momentum' | 'trend' | 'risk' | 'range'

const trendTone = (trend?: string | null): 'bull' | 'bear' | 'muted' => {
  switch (trend) {
    case 'strong_uptrend':
    case 'uptrend':
      return 'bull'
    case 'downtrend':
    case 'strong_downtrend':
      return 'bear'
    default:
      return 'muted'
  }
}

const trendLabel = (trend: string | null | undefined, t: TFunction): string => {
  const key = trend ?? 'neutral'
  return t(`screener.trends.${key}`, key.replace('_', ' '))
}

/**
 * Presets are defined in the backend so it stays the authority on what a screen
 * *is*, but their copy is UI text, so the language lives here. The backend
 * string is the fallback, which means a preset added server-side still renders
 * before its translation ships.
 */
const presetText = (preset: ScreenerPreset, field: 'name' | 'description', t: TFunction): string =>
  t(`screener.presets.${preset.id}.${field}`, preset[field])

const formatPercent = (value?: number | null, digits = 2): string =>
  value === null || value === undefined ? '—' : `${(value * 100).toFixed(digits)}%`

const formatNumber = (value?: number | null, digits = 2): string =>
  value === null || value === undefined ? '—' : value.toFixed(digits)

const formatVolume = (value?: number | null): string => {
  if (value === null || value === undefined) return '—'
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`
  return String(value)
}

const countActive = (filters: ScreenerFilters): number =>
  Object.entries(filters).filter(([key, value]) => {
    if (key === 'index' || value === undefined || value === null || value === '') return false
    return Array.isArray(value) ? value.length > 0 : true
  }).length

/* ------------------------------------------------------------------ *
 * Criteria controls
 * ------------------------------------------------------------------ */

const RangeInputs: React.FC<{
  row: RangeRow
  filters: ScreenerFilters
  onChange: (key: RangeKey, value: number | undefined) => void
  t: TFunction
}> = ({ row, filters, onChange, t }) => {
  const scale = row.percent ? 100 : 1

  const read = (key: RangeKey): string => {
    const value = filters[key]
    if (typeof value !== 'number') return ''
    return String(Number((value * scale).toFixed(4)))
  }

  const write = (key: RangeKey) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    onChange(key, raw === '' ? undefined : Number(raw) / scale)
  }
  const minLabel = row.max ? t('screener.min') : (row.soloPlaceholder ?? t('screener.min'))
  const maxKey = row.max

  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs font-medium leading-5 text-text-secondary">{row.label}</legend>
      <div className={cn('grid gap-2', row.max && 'grid-cols-2')}>
        <Field label={`${row.label} ${minLabel}`} hideLabel>
          {props => (
            <input
              {...props}
              type="number"
              inputMode="decimal"
              step={row.step}
              className="input num"
              placeholder={minLabel}
              value={read(row.min)}
              onChange={write(row.min)}
            />
          )}
        </Field>
        {maxKey ? (
          <Field label={`${row.label} ${t('screener.max')}`} hideLabel>
            {props => (
              <input
                {...props}
                type="number"
                inputMode="decimal"
                step={row.step}
                className="input num"
                placeholder={t('screener.max')}
                value={read(maxKey)}
                onChange={write(maxKey)}
              />
            )}
          </Field>
        ) : null}
      </div>
    </fieldset>
  )
}

const TriState: React.FC<{
  label: string
  value: boolean | undefined
  onChange: (value: boolean | undefined) => void
  t: TFunction
}> = ({ label, value, onChange, t }) => {
  const options: { key: string; label: string; next: boolean | undefined }[] = [
    { key: 'any', label: t('common.any'), next: undefined },
    { key: 'yes', label: t('common.yes'), next: true },
    { key: 'no', label: t('common.no'), next: false },
  ]
  const active = value === undefined ? 'any' : value ? 'yes' : 'no'

  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs font-medium leading-5 text-text-secondary">{label}</legend>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-sunken p-1">
        {options.map(option => (
          <Button
            key={option.key}
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={active === option.key}
            onClick={() => onChange(option.next)}
            className={cn(
              'min-w-0 px-2',
              active === option.key
                ? 'bg-surface text-accent-400 shadow-sm hover:bg-surface hover:text-accent-400'
                : 'text-text-muted',
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}

const CriteriaGroup: React.FC<{
  title: string
  count: number
  summary: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}> = ({ title, count, summary, open, onToggle, children }) => {
  const contentId = React.useId()
  return (
    <div className="border-b border-border last:border-b-0">
      <Button
        type="button"
        variant="ghost"
        fullWidth
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={contentId}
        className="min-h-12 justify-between gap-3 rounded-none px-0 py-3 text-left hover:bg-transparent"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          {title}
          {count > 0 ? (
            <span className="num rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-400">
              {count}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-text-muted transition-transform duration-150',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </Button>
      {!open && summary ? (
        <p className="pb-4 text-xs leading-5 text-text-secondary">{summary}</p>
      ) : null}
      <div id={contentId} hidden={!open} className="space-y-4 pb-5">
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

const ScreenerPage: React.FC = () => {
  const { t } = useTranslation()
  const { openTicker } = useTickerChart()

  const [presets, setPresets] = useState<ScreenerPreset[]>([])
  const [strategies, setStrategies] = useState<ScreenerStrategy[]>([])
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [activeStrategy, setActiveStrategy] = useState<string | null>(null)

  const [filters, setFilters] = useState<ScreenerFilters>(emptyFilters)
  const [result, setResult] = useState<ScreenerResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)

  const [showFilters, setShowFilters] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<GroupId, boolean>>({
    liquidity: true,
    momentum: true,
    trend: false,
    risk: false,
    range: false,
  })

  const [saveOpen, setSaveOpen] = useState(false)
  // Deleting a saved screen throws away work that cannot be recovered from the
  // UI, so it asks first and names what is going.
  const [pendingDelete, setPendingDelete] = useState<ScreenerStrategy | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const runScreen = useCallback(
    async (nextFilters: ScreenerFilters, nextOffset: number) => {
      setLoading(true)
      setError(null)
      try {
        const response = await api.runScreen({
          filters: { ...nextFilters, index: 'all' },
          sort_by: 'change_percent',
          sort_direction: 'desc',
          limit: PAGE_SIZE,
          offset: nextOffset,
        })
        setResult(response)
        setOffset(nextOffset)
      } catch {
        setError(t('errors.loadFailed'))
      } finally {
        setLoading(false)
      }
    },
    [t],
  )

  const runSaved = useCallback(
    async (kind: 'preset' | 'strategy', id: string) => {
      setLoading(true)
      setError(null)
      try {
        const response =
          kind === 'preset'
            ? await api.runScreenerPreset(id, PAGE_SIZE, 0, 'all')
            : await api.runScreenerStrategy(id, PAGE_SIZE, 0, 'all')
        setResult(response)
        setOffset(0)
      } catch {
        setError(t('errors.loadFailed'))
      } finally {
        setLoading(false)
      }
    },
    [t],
  )

  const loadStrategies = useCallback(async () => {
    try {
      const response = await api.listScreenerStrategies()
      setStrategies(response.strategies)
    } catch {
      setStrategies([])
    }
  }, [])

  useEffect(() => {
    api
      .getScreenerPresets()
      .then(response => setPresets(response.presets))
      .catch(() => setPresets([]))
    loadStrategies()
  }, [loadStrategies])

  // First paint runs the unfiltered screen; every later run is user-driven.
  useEffect(() => {
    runScreen(emptyFilters, 0)
  }, [runScreen])

  const selectPreset = (preset: ScreenerPreset) => {
    setFilters(preset.filters)
    setActivePreset(preset.id)
    setActiveStrategy(null)
    runSaved('preset', preset.id)
  }

  const selectStrategy = (strategy: ScreenerStrategy) => {
    setFilters(strategy.filters)
    setActiveStrategy(strategy.id)
    setActivePreset(null)
    runSaved('strategy', strategy.id)
  }

  // Editing any criterion detaches from the preset it came from: the screen on
  // screen is no longer the one that was named.
  const patch = (update: Partial<ScreenerFilters>) => {
    setActivePreset(null)
    setActiveStrategy(null)
    setFilters(prev => {
      const next = { ...prev, ...update }
      for (const [key, value] of Object.entries(update)) {
        if (value === undefined) delete next[key as keyof ScreenerFilters]
      }
      return next
    })
  }

  const setRange = (key: RangeKey, value: number | undefined) =>
    patch({ [key]: value } as Partial<ScreenerFilters>)

  const toggleTrend = (trend: TrendDirection) => {
    const current = filters.trends ?? []
    const next = current.includes(trend)
      ? current.filter(item => item !== trend)
      : [...current, trend]
    patch({ trends: next.length ? next : undefined })
  }

  const resetFilters = () => {
    setFilters(emptyFilters)
    setActivePreset(null)
    setActiveStrategy(null)
    runScreen(emptyFilters, 0)
  }

  const saveStrategy = async () => {
    const name = saveName.trim()
    if (!name) return
    setSaving(true)
    setSaveError(null)
    try {
      const created = await api.createScreenerStrategy({
        name,
        filters: { ...filters, index: 'all' },
      })
      setStrategies(prev => [...prev, created])
      setActiveStrategy(created.id)
      setActivePreset(null)
      setSaveOpen(false)
      setSaveName('')
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setSaveError(detail ?? t('screener.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    const strategy = pendingDelete
    if (!strategy) return
    setDeleting(true)
    try {
      await api.deleteScreenerStrategy(strategy.id)
      setStrategies(prev => prev.filter(item => item.id !== strategy.id))
      setPendingDelete(null)
      if (activeStrategy === strategy.id) {
        setActiveStrategy(null)
        runScreen(filters, 0)
      }
    } catch {
      setError(t('errors.loadFailed'))
    } finally {
      setDeleting(false)
    }
  }

  const matches: ScreenerMatch[] = result?.matches ?? []
  const resultDate = formatDay(result?.date ?? matches.find(match => match.date)?.date, '')
  const total = result?.total_count ?? 0
  const hasNext = offset + PAGE_SIZE < total
  const activeFilterCount = countActive(filters)
  const activePresetItem = activePreset ? presets.find(item => item.id === activePreset) : undefined
  const activeScreenLabel = activePresetItem
    ? presetText(activePresetItem, 'name', t)
    : activeStrategy
      ? strategies.find(item => item.id === activeStrategy)?.name ?? t('screener.customScreen')
      : t('screener.customScreen')

  const groups: { id: GroupId; title: string; rows: RangeRow[]; toggles?: ToggleKey[] }[] = useMemo(
    () => [
      {
        id: 'liquidity',
        title: t('screener.groups.liquidity'),
        rows: [
          { label: t('screener.price'), min: 'min_price', max: 'max_price' },
          {
            label: t('screener.avgVolume'),
            min: 'min_avg_volume',
            soloPlaceholder: t('screener.atLeast'),
          },
          {
            label: t('screener.volumeRatio'),
            min: 'min_volume_ratio',
            max: 'max_volume_ratio',
            step: 0.1,
          },
        ],
      },
      {
        id: 'momentum',
        title: t('screener.groups.momentum'),
        rows: [
          { label: 'RSI', min: 'min_rsi', max: 'max_rsi' },
          {
            label: t('screener.change1d'),
            min: 'min_change_percent',
            max: 'max_change_percent',
            percent: true,
          },
          { label: t('screener.return1m'), min: 'min_return_1m', max: 'max_return_1m', percent: true },
          { label: t('screener.return3m'), min: 'min_return_3m', max: 'max_return_3m', percent: true },
          { label: t('screener.return1y'), min: 'min_return_1y', max: 'max_return_1y', percent: true },
        ],
      },
      {
        id: 'trend',
        title: t('screener.groups.trend'),
        rows: [],
        toggles: ['above_sma20', 'above_sma50', 'above_sma200', 'golden_cross', 'macd_bullish'],
      },
      {
        id: 'risk',
        title: t('screener.groups.risk'),
        rows: [
          {
            label: t('screener.volatility'),
            min: 'min_volatility',
            max: 'max_volatility',
            percent: true,
          },
          {
            label: t('screener.maxDrawdown'),
            min: 'max_drawdown_floor',
            percent: true,
            soloPlaceholder: t('screener.notWorseThan'),
          },
        ],
      },
      {
        id: 'range',
        title: t('screener.groups.range'),
        rows: [
          {
            label: t('screener.fromHigh'),
            min: 'min_distance_to_52w_high',
            max: 'max_distance_to_52w_high',
            percent: true,
          },
          {
            label: t('screener.fromLow'),
            min: 'min_distance_to_52w_low',
            max: 'max_distance_to_52w_low',
            percent: true,
          },
        ],
      },
    ],
    [t],
  )

  const groupCount = (group: (typeof groups)[number]): number => {
    const keys = new Set<string>()
    group.rows.forEach(row => {
      keys.add(row.min as string)
      if (row.max) keys.add(row.max as string)
    })
    group.toggles?.forEach(key => keys.add(key))
    if (group.id === 'trend') keys.add('trends')
    return [...keys].filter(key => {
      const value = filters[key as keyof ScreenerFilters]
      if (value === undefined || value === null) return false
      return Array.isArray(value) ? value.length > 0 : true
    }).length
  }

  const groupSummary = (group: (typeof groups)[number]): string => {
    const values: string[] = []
    group.rows.forEach(row => {
      const min = filters[row.min]
      const max = row.max ? filters[row.max] : undefined
      const bounds: string[] = []
      const display = (value: number) =>
        row.percent ? `${Number((value * 100).toFixed(4))}%` : String(value)
      if (typeof min === 'number') {
        bounds.push(`${row.soloPlaceholder ?? t('screener.min')} ${display(min)}`)
      }
      if (typeof max === 'number') bounds.push(`${t('screener.max')} ${display(max)}`)
      if (bounds.length) values.push(`${row.label}: ${bounds.join(' / ')}`)
    })
    group.toggles?.forEach(key => {
      const value = filters[key]
      if (value !== undefined) {
        values.push(`${t(`screener.${key}`)}: ${t(value ? 'common.yes' : 'common.no')}`)
      }
    })
    if (group.id === 'trend' && filters.trends?.length) {
      values.push(filters.trends.map(trend => trendLabel(trend, t)).join(', '))
    }
    return values.join(' · ')
  }

  const columns: Column<ScreenerMatch>[] = useMemo(
    () => [
      {
        key: 'symbol',
        header: t('picks.symbol', 'Ticker'),
        sortable: true,
        sortAccessor: match => match.symbol,
        render: match => (
          <span className="font-semibold text-text-primary group-hover:text-accent-400">{match.symbol}</span>
        ),
      },
      {
        key: 'close',
        header: t('picks.price', 'Close'),
        align: 'right',
        sortable: true,
        sortAccessor: match => match.close,
        render: match => <span className="num text-text-primary">{formatNumber(match.close)}</span>,
      },
      {
        key: 'change',
        header: t('screener.change1d'),
        align: 'right',
        sortable: true,
        sortAccessor: match => match.change_percent,
        render: match => <Change value={match.change_percent} />,
      },
      {
        key: 'return1m',
        header: t('screener.return1m'),
        align: 'right',
        sortable: true,
        sortAccessor: match => match.return_1m,
        render: match => <Change value={match.return_1m} />,
      },
      {
        key: 'return1y',
        header: t('screener.return1y'),
        align: 'right',
        sortable: true,
        sortAccessor: match => match.return_1y,
        render: match => <Change value={match.return_1y} />,
      },
      {
        key: 'rsi',
        header: 'RSI',
        align: 'right',
        sortable: true,
        sortAccessor: match => match.rsi_14,
        render: match => (
          <span className="num text-text-secondary">{formatNumber(match.rsi_14, 1)}</span>
        ),
      },
      {
        key: 'avgVolume',
        header: t('screener.avgVolume'),
        align: 'right',
        sortable: true,
        sortAccessor: match => match.avg_volume_20,
        render: match => (
          <span className="num text-text-secondary">{formatVolume(match.avg_volume_20)}</span>
        ),
      },
      {
        key: 'volatility',
        header: t('screener.volatility'),
        align: 'right',
        sortable: true,
        sortAccessor: match => match.volatility,
        render: match => (
          <span className="num text-text-secondary">{formatPercent(match.volatility, 1)}</span>
        ),
      },
      {
        key: 'drawdown',
        header: t('screener.maxDrawdown'),
        align: 'right',
        sortable: true,
        sortAccessor: match => match.max_drawdown,
        render: match => (
          <span className="num text-bear">{formatPercent(match.max_drawdown, 1)}</span>
        ),
      },
      {
        key: 'trend',
        header: t('screener.trend'),
        sortable: true,
        sortAccessor: match => match.trend ?? 'neutral',
        render: match => (
          <Badge tone={trendTone(match.trend)} size="sm" dot>
            {trendLabel(match.trend, t)}
          </Badge>
        ),
      },
    ],
    [t],
  )

  const criteriaControls = (
    <div>
      {groups.map(group => (
        <CriteriaGroup
          key={group.id}
          title={group.title}
          count={groupCount(group)}
          summary={groupSummary(group)}
          open={openGroups[group.id]}
          onToggle={() => setOpenGroups(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
        >
          {group.id === 'trend' ? (
            <fieldset>
              <legend className="mb-2 text-xs font-medium text-text-secondary">{t('screener.trend')}</legend>
              <div className="flex flex-wrap gap-2">
                {TRENDS.map(trend => {
                  const active = filters.trends?.includes(trend) ?? false
                  return (
                    <Button
                      key={trend}
                      type="button"
                      size="sm"
                      variant="outline"
                      aria-pressed={active}
                      onClick={() => toggleTrend(trend)}
                      className={cn(
                        'whitespace-normal text-left',
                        active && 'border-accent-line bg-accent-soft text-accent-400 hover:bg-accent-soft hover:text-accent-400',
                      )}
                      leftIcon={active ? <Check className="h-3.5 w-3.5 shrink-0" /> : undefined}
                    >
                      {trendLabel(trend, t)}
                    </Button>
                  )
                })}
              </div>
            </fieldset>
          ) : null}

          {group.rows.map(row => (
            <RangeInputs
              key={String(row.min)}
              row={row}
              filters={filters}
              onChange={setRange}
              t={t}
            />
          ))}

          {group.toggles?.map(key => (
            <TriState
              key={key}
              label={t(`screener.${key}`)}
              value={filters[key]}
              onChange={value => patch({ [key]: value } as Partial<ScreenerFilters>)}
              t={t}
            />
          ))}
        </CriteriaGroup>
      ))}
    </div>
  )

  const criteriaActions = (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
      <Button
        type="button"
        className="min-w-0"
        onClick={() => {
          runScreen(filters, 0)
          setShowFilters(false)
        }}
        disabled={loading}
        loading={loading}
        leftIcon={<Search className="h-4 w-4" />}
      >
        {t('screener.run')}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setSaveError(null)
          setShowFilters(false)
          setSaveOpen(true)
        }}
        leftIcon={<Bookmark className="h-4 w-4" />}
      >
        {t('screener.save')}
      </Button>
    </div>
  )

  const criteria = (
    <Panel
      fill
      className="max-h-[calc(var(--pl-viewport-h)-var(--pl-topbar-h)-3rem)]"
      bodyClassName="custom-scrollbar overflow-y-auto pt-1 sm:pt-1"
      title={t('screener.criteria')}
      subtitle={<span className="[overflow-wrap:anywhere]">{activeScreenLabel}</span>}
      icon={<ListFilter className="h-4 w-4" />}
      actions={
        activeFilterCount ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            {t('screener.clearFilters')}
          </Button>
        ) : null
      }
      footer={criteriaActions}
    >
      {criteriaControls}
    </Panel>
  )

  return (
    <Page>
      <PageHeader
        title={t('screener.title')}
        date={resultDate || undefined}
        subtitle={t('screener.subtitle')}
      />

      <Panel
        title={t('screener.quickScreens')}
        subtitle={t('screener.quickScreensHint')}
        icon={<Bookmark className="h-4 w-4" />}
        bodyClassName="space-y-4"
      >
        <div className="scroll-rail -mx-4 flex items-stretch gap-2 px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {presets.map(preset => (
            <Button
              key={preset.id}
              type="button"
              size="sm"
              variant="outline"
              title={presetText(preset, 'description', t)}
              aria-pressed={activePreset === preset.id}
              onClick={() => selectPreset(preset)}
              leftIcon={activePreset === preset.id ? <Check className="h-3.5 w-3.5" /> : undefined}
              className={cn(
                'min-h-10',
                activePreset === preset.id && 'border-accent-line bg-accent-soft text-accent-400 hover:bg-accent-soft hover:text-accent-400',
              )}
            >
              {presetText(preset, 'name', t)}
            </Button>
          ))}
        </div>
        {activePresetItem ? (
          <p className="text-sm leading-6 text-text-secondary">
            {presetText(activePresetItem, 'description', t)}
          </p>
        ) : null}

        {strategies.length ? (
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {strategies.map(strategy => (
              <div
                key={strategy.id}
                className={cn(
                  'flex max-w-full items-stretch rounded-md border',
                  activeStrategy === strategy.id
                    ? 'border-accent-line bg-accent-soft'
                    : 'border-border bg-surface',
                )}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-pressed={activeStrategy === strategy.id}
                  onClick={() => selectStrategy(strategy)}
                  leftIcon={<Bookmark className="h-3.5 w-3.5 shrink-0" />}
                  className={cn(
                    'min-w-0 shrink gap-2 rounded-r-none whitespace-normal text-left',
                    activeStrategy === strategy.id && 'text-accent-400',
                  )}
                >
                  <span className="[overflow-wrap:anywhere]">{strategy.name}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setPendingDelete(strategy)}
                  aria-label={t('screener.deleteStrategy', { name: strategy.name })}
                  className="h-auto rounded-l-none border-l border-l-border text-text-muted hover:bg-bear-soft hover:text-bear"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </Panel>

      {error ? <Alert tone="error" title={error} /> : null}

      <div className="sticky top-3 z-[var(--z-sticky)] flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-sm lg:hidden">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-text-primary">{t('screener.filterSummary')}</p>
          <p className="mt-1 text-xs leading-5 text-text-muted [overflow-wrap:anywhere]">
            {activeScreenLabel}
          </p>
          <p className="num mt-0.5 text-xs font-medium text-accent-400">
            {t('screener.activeFilterCount', { count: activeFilterCount })}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          aria-haspopup="dialog"
          aria-expanded={showFilters}
          onClick={() => setShowFilters(true)}
          leftIcon={<ListFilter className="h-3.5 w-3.5" />}
        >
          {t('screener.editFilters')}
        </Button>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[21rem_minmax(0,1fr)]">
        <aside className="hidden min-w-0 lg:sticky lg:top-6 lg:block">{criteria}</aside>

        <Panel
          flush
          title={t('screener.results')}
          aria-busy={loading}
          actions={
            <span className="num text-sm font-semibold text-text-primary" aria-live="polite">
              {result
                ? t('screener.matches', { count: total, total: result.universe_size })
                : loading ? t('common.loading') : '—'}
            </span>
          }
          toolbar={
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs">
              <span className="font-semibold text-text-primary [overflow-wrap:anywhere]">{activeScreenLabel}</span>
              <span className="num text-text-muted">
                {t('screener.activeFilterCount', { count: activeFilterCount })}
              </span>
            </div>
          }
          footer={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="num text-xs text-text-muted">
                {matches.length
                  ? t('screener.showing', {
                      from: offset + 1,
                      to: offset + matches.length,
                    })
                  : ''}
              </span>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={offset === 0 || loading}
                  onClick={() => runScreen(filters, Math.max(0, offset - PAGE_SIZE))}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!hasNext || loading}
                  onClick={() => runScreen(filters, offset + PAGE_SIZE)}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          }
        >
          <DataTable
            columns={columns}
            data={matches}
            rowKey={match => match.symbol}
            onRowClick={match => openTicker(match.symbol)}
            loading={loading}
            dense
            stickyFirstColumn
            renderMobileRow={match => (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-text-primary">{match.symbol}</p>
                    <Badge tone={trendTone(match.trend)} size="sm" dot className="mt-2 max-w-full whitespace-normal">
                      {trendLabel(match.trend, t)}
                    </Badge>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-text-muted">{t('picks.price')}</p>
                    <p className="num mt-0.5 text-lg font-semibold text-text-primary">
                      {formatNumber(match.close)}
                    </p>
                    <div className="mt-1 flex items-center justify-end gap-2 text-xs">
                      <span className="text-text-muted">{t('screener.change1d')}</span>
                      <Change value={match.change_percent} className="text-xs" />
                    </div>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-x-5 gap-y-3 border-t border-border pt-3 sm:grid-cols-3">
                  {[
                    { label: t('screener.return1m'), value: <Change value={match.return_1m} /> },
                    { label: t('screener.return1y'), value: <Change value={match.return_1y} /> },
                    { label: 'RSI', value: formatNumber(match.rsi_14, 1) },
                    { label: t('screener.avgVolume'), value: formatVolume(match.avg_volume_20) },
                    { label: t('screener.volatility'), value: formatPercent(match.volatility, 1) },
                    { label: t('screener.maxDrawdown'), value: <span className="text-bear">{formatPercent(match.max_drawdown, 1)}</span> },
                  ].map(({ label, value }) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-xs leading-5 text-text-muted">{label}</dt>
                      <dd className="num mt-0.5 text-sm font-medium text-text-primary">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            empty={
              <EmptyState
                icon={<Search className="h-4 w-4" />}
                title={t('screener.noResults')}
                action={
                  activeFilterCount ? (
                    <Button variant="secondary" size="sm" onClick={resetFilters}>
                      {t('screener.clearFilters')}
                    </Button>
                  ) : null
                }
              />
            }
          />
        </Panel>
      </div>

      <Modal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title={t('screener.criteria')}
        icon={<ListFilter className="h-4 w-4" />}
        size="lg"
        bodyClassName="pt-4 sm:pt-4"
        footer={
          <div className="space-y-2">
            {criteriaActions}
            {activeFilterCount ? (
              <Button type="button" variant="ghost" size="sm" fullWidth onClick={resetFilters}>
                {t('screener.clearFilters')}
              </Button>
            ) : null}
          </div>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <p className="text-sm font-semibold text-text-primary [overflow-wrap:anywhere]">{activeScreenLabel}</p>
          <Badge tone="muted" className="num">
            {t('screener.activeFilterCount', { count: activeFilterCount })}
          </Badge>
        </div>
        {criteriaControls}
      </Modal>

      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title={t('screener.saveTitle')}
        icon={<Plus className="h-4 w-4" />}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setSaveOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={saveStrategy}
              disabled={!saveName.trim() || saving}
              loading={saving}
            >
              {t('screener.save')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Field label={t('screener.strategyName')} error={saveError}>
            {props => (
              <input
                {...props}
                className="input"
                maxLength={64}
                value={saveName}
                placeholder={t('screener.strategyNamePlaceholder')}
                onChange={event => setSaveName(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') saveStrategy()
                }}
              />
            )}
          </Field>
          <p className="text-xs text-text-muted">
            {t('screener.saveHint', { count: activeFilterCount })}
          </p>
        </div>
      </Modal>

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={t('screener.deleteTitle')}
        icon={<Trash2 className="h-4 w-4 text-bear" />}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setPendingDelete(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete} loading={deleting}>
              {t('common.delete')}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-text-secondary">
          {t('screener.deleteConfirm', { name: pendingDelete?.name ?? '' })}
        </p>
      </Modal>
    </Page>
  )
}

export default ScreenerPage

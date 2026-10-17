import { ArrowDownWideNarrow, ArrowUpWideNarrow, ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/utils'

import Button from './Button'
import Skeleton from './Skeleton'

export type SortDir = 'asc' | 'desc'
export type Align = 'left' | 'right' | 'center'

export interface Column<T> {
  key: string
  header: React.ReactNode
  align?: Align
  sortable?: boolean
  sortAccessor?: (row: T) => number | string | null | undefined
  render: (row: T) => React.ReactNode
  headerClassName?: string
  cellClassName?: string
  width?: string
  /** Hide below the `md` breakpoint. Use for secondary metrics. */
  hideOnMobile?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T, index: number) => string
  onRowClick?: (row: T) => void
  loading?: boolean
  skeletonRows?: number
  empty?: React.ReactNode
  initialSort?: { key: string; dir: SortDir }
  stickyHeader?: boolean
  /** Pins the first column while the rest scrolls horizontally. Only worth
   * it for tables wide enough to overflow; otherwise it draws a stray rule. */
  stickyFirstColumn?: boolean
  /**
   * Stacked layout used below `md` instead of a horizontally scrolling table.
   * Phones read a list far better than they read a 9-column grid.
   */
  renderMobileRow?: (row: T) => React.ReactNode
  className?: string
  dense?: boolean
}

const alignClass: Record<Align, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
}

const headerText = (node: React.ReactNode): string => React.Children.toArray(node).map(child => {
  if (typeof child === 'string' || typeof child === 'number') return String(child)
  if (React.isValidElement<{ children?: React.ReactNode }>(child)) return headerText(child.props.children)
  return ''
}).join(' ')

function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  loading = false,
  skeletonRows = 8,
  empty,
  initialSort,
  stickyHeader = true,
  stickyFirstColumn = false,
  renderMobileRow,
  className,
  dense = false,
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(initialSort ?? null)
  const sortableColumns = columns.filter(column => column.sortable && column.sortAccessor)

  const sorted = useMemo(() => {
    if (!sort) return data
    const col = columns.find(c => c.key === sort.key)
    if (!col?.sortAccessor) return data
    const accessor = col.sortAccessor
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...data].sort((a, b) => {
      const av = accessor(a)
      const bv = accessor(b)
      if ((av === null || av === undefined) && (bv === null || bv === undefined)) return 0
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor
      return String(av).localeCompare(String(bv)) * factor
    })
  }, [data, sort, columns])

  const toggleSort = (key: string) => {
    setSort(prev => {
      if (prev?.key !== key) return { key, dir: 'desc' }
      if (prev.dir === 'desc') return { key, dir: 'asc' }
      return null
    })
  }

  const cellPad = dense ? 'px-3 py-2.5' : 'px-4 py-3.5'
  const isEmpty = !loading && sorted.length === 0

  const pinned = (isHeader: boolean) =>
    stickyFirstColumn &&
    cn(
      'sticky left-0 z-[1]',
      isHeader ? 'bg-surface-raised' : 'bg-surface',
      'after:absolute after:top-0 after:right-0 after:h-full after:w-px after:bg-border after:content-[""]',
    )

  const table = (
    <div
      className={cn(
        'w-full overflow-x-auto overscroll-x-contain custom-scrollbar',
        renderMobileRow && 'hidden md:block',
        className,
      )}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr className={cn('bg-surface-raised', stickyHeader && 'sticky top-0 z-[2]')}>
            {columns.map((col, colIndex) => {
              const isSorted = sort?.key === col.key
              return (
                <th
                  key={col.key}
                  scope="col"
                  style={{ width: col.width }}
                  aria-sort={
                    isSorted ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                  className={cn(
                    'border-b border-border text-2xs font-semibold tracking-[0.04em] whitespace-nowrap text-text-muted',
                    cellPad,
                    alignClass[col.align ?? 'left'],
                    col.sortable && 'cursor-pointer select-none hover:text-text-secondary',
                    col.hideOnMobile && 'hidden lg:table-cell',
                    colIndex === 0 && pinned(true),
                    col.headerClassName,
                  )}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {col.sortable ? <button
                      type="button"
                      className="pl-icon-button -my-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-surface-sunken"
                      aria-label={t('table.sortColumn', { column: headerText(col.header) || col.key })}
                      onClick={event => { event.stopPropagation(); toggleSort(col.key) }}
                    >
                      {(
                      isSorted ? (
                        sort?.dir === 'asc' ? (
                          <ChevronUp className="h-3 w-3 text-accent-400" />
                        ) : (
                          <ChevronDown className="h-3 w-3 text-accent-400" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 text-text-muted" />
                      )
                    )}
                    </button> : null}
                  </span>
                </th>
              )
            })}
            {onRowClick ? <th scope="col" className="w-10 border-b border-border"><span className="sr-only">{t('common.details')}</span></th> : null}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i}>
                {columns.map((col, colIndex) => (
                  <td
                    key={col.key}
                    className={cn(
                      'border-b border-border',
                      cellPad,
                      col.hideOnMobile && 'hidden lg:table-cell',
                      colIndex === 0 && pinned(false),
                    )}
                  >
                    <Skeleton
                      variant="text"
                      className={cn(col.align === 'right' && 'ml-auto')}
                      style={{ width: colIndex === 0 ? '55%' : '70%' }}
                    />
                  </td>
                ))}
                {onRowClick ? <td className="border-b border-border" /> : null}
              </tr>
            ))
          ) : isEmpty ? (
            <tr>
              <td colSpan={columns.length + (onRowClick ? 1 : 0)} className="p-0">
                {empty}
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'group border-b border-border transition-colors duration-150 last:border-b-0',
                  onRowClick && 'cursor-pointer',
                  'hover:bg-surface-raised [&:hover>td]:bg-surface-raised',
                )}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={col.key}
                    className={cn(
                      'text-sm whitespace-nowrap text-text-primary',
                      cellPad,
                      alignClass[col.align ?? 'left'],
                      col.hideOnMobile && 'hidden lg:table-cell',
                      colIndex === 0 && pinned(false),
                      col.cellClassName,
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
                {onRowClick ? (
                  <td className="pr-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('table.openRow', { row: i + 1 })}
                      onClick={event => { event.stopPropagation(); onRowClick(row) }}
                    >
                      <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-accent-400" />
                    </Button>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )

  if (!renderMobileRow) return table

  return (
    <>
      {table}
      <div className="md:hidden">
        {sortableColumns.length > 0 && data.length > 1 ? (
          <div className="flex items-center gap-2 border-b border-border bg-surface-raised/60 px-4 py-3">
            <label className="flex min-w-0 flex-1 items-center gap-2">
              <span className="shrink-0 text-xs text-text-muted">{t('table.sortBy')}</span>
              <select
                className="input min-w-0 flex-1"
                value={sort?.key ?? ''}
                onChange={event => setSort(event.target.value ? { key: event.target.value, dir: 'desc' } : null)}
              >
                <option value="">{t('table.defaultOrder')}</option>
                {sortableColumns.map(column => <option key={column.key} value={column.key}>{headerText(column.header) || column.key}</option>)}
              </select>
            </label>
            <Button
              size="icon"
              variant="secondary"
              disabled={!sort}
              aria-label={sort?.dir === 'asc' ? t('table.descending') : t('table.ascending')}
              onClick={() => setSort(current => current ? { ...current, dir: current.dir === 'asc' ? 'desc' : 'asc' } : null)}
            >
              {sort?.dir === 'asc' ? <ArrowUpWideNarrow className="h-4 w-4" /> : <ArrowDownWideNarrow className="h-4 w-4" />}
            </Button>
          </div>
        ) : null}
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: Math.min(skeletonRows, 5) }).map((_, i) => (
              <div key={i} className="space-y-3 px-4 py-4">
                <Skeleton variant="text" style={{ width: '40%' }} />
                <Skeleton variant="text" style={{ width: '70%' }} />
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          empty
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((row, i) => (
              <li key={rowKey(row, i)}>
                {onRowClick ? (
                  <button
                    type="button"
                    onClick={() => onRowClick(row)}
                    className="block w-full min-w-0 px-4 py-4 text-left transition-colors duration-150 hover:bg-surface-raised active:bg-accent-soft"
                  >
                    {renderMobileRow(row)}
                  </button>
                ) : (
                  <div className="px-4 py-4">{renderMobileRow(row)}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

export default DataTable

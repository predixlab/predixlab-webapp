import {
  BarChart3,
  CalendarRange,
  ChevronRight,
  ChevronsLeft,
  Flame,
  Globe,
  Gift,
  LogOut,
  PanelLeft,
  Search,
  Target,
  User,
} from 'lucide-react'
import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import MockAwareLink from '@/components/MockAwareLink'
import MockModeIndicator from '@/components/MockModeIndicator'
import { Dropdown, DropdownItem, DropdownLabel, ThemeToggle, Tooltip } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useMarketClock } from '@/hooks/useMarketClock'
import { cn } from '@/utils'

interface LayoutProps {
  children: ReactNode
}

interface NavItem {
  path: string
  label: string
  shortLabel: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const PUBLIC_PATHS = ['/login', '/register', '/auth/callback']
const SIDEBAR_KEY = 'predixlab-sidebar-collapsed'
const brandIconUrl = new URL('../../icon.svg', import.meta.url).href

const Wordmark: React.FC<{ compact?: boolean; descriptor?: string; inverse?: boolean; className?: string }> = ({
  compact,
  descriptor,
  inverse,
  className,
}) => (
  <span className={cn('flex items-center gap-3', className)}>
    <span className="flex h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-white">
      <img src={brandIconUrl} alt="" className="h-full w-full object-cover" aria-hidden />
    </span>
    {!compact ? (
      <span className="flex min-w-0 flex-col">
        <span className={cn('text-lg leading-6 font-bold tracking-[-0.035em]', inverse ? 'text-[var(--pl-nav-active)]' : 'text-text-primary')}>
          PredixLab
        </span>
        {descriptor ? (
          <span className={cn('hidden text-2xs leading-4 sm:block', inverse ? 'text-[var(--pl-nav-muted)]' : 'text-text-muted')}>{descriptor}</span>
        ) : null}
      </span>
    ) : null}
  </span>
)

const Avatar: React.FC<{ name?: string | null; email?: string | null; size?: 'sm' | 'md' }> = ({
  name,
  email,
  size = 'sm',
}) => (
  <span
    className={cn(
      'flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-400',
      size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm',
    )}
    aria-hidden
  >
    {(name || email || '?').charAt(0).toUpperCase()}
  </span>
)

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const market = useMarketClock()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 })
  }, [location.pathname])

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? i18n.language
  }, [i18n.language, i18n.resolvedLanguage])

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, String(collapsed))
    } catch {
      /* ignore persistence failures */
    }
  }, [collapsed])

  const setLanguage = useCallback(
    (lng: 'en' | 'zh') => {
      i18n.changeLanguage(lng)
    },
    [i18n],
  )

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navGroups: NavGroup[] = [
    {
      label: t('nav.signals'),
      items: [
        {
          path: '/',
          label: t('nav.dashboard'),
          shortLabel: t('nav.shortDashboard'),
          icon: CalendarRange,
        },
      ],
    },
    {
      label: t('nav.marketGroup'),
      items: [
        { path: '/market', label: t('nav.market'), shortLabel: t('nav.shortMarket'), icon: BarChart3 },
      ],
    },
    {
      label: t('nav.tools'),
      items: [
        { path: '/screener', label: t('nav.screener'), shortLabel: t('nav.shortScreener'), icon: Search },
        { path: '/backtest', label: t('nav.backtest'), shortLabel: t('nav.shortBacktest'), icon: Target },
        {
          path: '/options/activity',
          label: t('nav.optionsInsights'),
          shortLabel: t('nav.shortOptions'),
          icon: Flame,
        },
      ],
    },
  ]

  const flatNav = navGroups.flatMap(group => group.items)

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/'
    if (path === '/options/activity') {
      return location.pathname.startsWith('/options/')
    }
    return location.pathname.startsWith(path)
  }

  const isPublicPage = PUBLIC_PATHS.includes(location.pathname)
  const activeItem = flatNav.find(item => isActivePath(item.path))
  const isProfileSection =
    isActivePath('/profile') || isActivePath('/referrals')
  const activeLabel = location.pathname === '/referrals'
    ? t('nav.referrals')
    : isProfileSection ? t('nav.profile') : activeItem?.label

  const languageMenu = (
    <Dropdown
      label={t('nav.language')}
      triggerClassName="pl-button h-10 gap-1.5 px-2.5 text-xs"
      trigger={
        <>
          <Globe className="h-4 w-4" />
          <span>{i18n.language === 'zh' ? '中文' : 'EN'}</span>
        </>
      }
    >
      {close => (
        <>
          {(['en', 'zh'] as const).map(lng => (
            <DropdownItem
              key={lng}
              onClick={() => {
                setLanguage(lng)
                close()
              }}
              className={cn(i18n.language === lng && 'text-accent-400')}
            >
              {lng === 'en' ? 'English' : '中文'}
            </DropdownItem>
          ))}
        </>
      )}
    </Dropdown>
  )

  /* ---------------------------------------------------------------- *
   * Auth surfaces: no navigation to speak of, so the chrome is a rule
   * and a wordmark.
   * ---------------------------------------------------------------- */
  if (isPublicPage) {
    return (
      <div className="pl-app-shell flex min-h-[var(--pl-viewport-h)] min-w-0 flex-col overflow-x-hidden bg-app">
        <a href="#main" className="pl-skip-link">{t('nav.skipToContent')}</a>
        <header className="flex h-[calc(var(--pl-topbar-h)+env(safe-area-inset-top,0px))] min-w-0 shrink-0 items-center justify-between border-b border-border bg-app px-4 pt-[env(safe-area-inset-top,0px)] sm:px-8">
          <MockAwareLink to="/login" className="rounded-md">
            <Wordmark descriptor={t('nav.workspace')} />
          </MockAwareLink>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {languageMenu}
          </div>
        </header>
        <main id="main" tabIndex={-1} className="flex min-w-0 flex-1 flex-col overflow-x-hidden outline-none">{children}</main>
        <MockModeIndicator />
      </div>
    )
  }

  return (
    <div className="pl-app-shell flex h-[var(--pl-viewport-h)] overflow-hidden bg-app">
      <a href="#main" className="pl-skip-link">{t('nav.skipToContent')}</a>
        <aside
          className={cn(
            'hidden shrink-0 flex-col bg-sidebar pt-[env(safe-area-inset-top,0px)] transition-[width] duration-200 ease-out lg:flex',
            collapsed ? 'w-20' : 'w-60',
          )}
        >
          <div className={cn('flex h-[var(--pl-topbar-h)] shrink-0 items-center', collapsed ? 'justify-center' : 'px-5')}>
            <MockAwareLink to="/" aria-label="PredixLab" className="rounded-md">
              <Wordmark compact={collapsed} inverse />
            </MockAwareLink>
          </div>
          <nav aria-label={t('nav.primary')} className="custom-scrollbar flex-1 overflow-y-auto px-3 py-6">
            {navGroups.map((group, groupIndex) => (
              <div key={group.label} className={cn(groupIndex > 0 && 'mt-7')}>
                {!collapsed ? (
                  <p className="px-3 pb-2.5 text-2xs font-medium tracking-[0.1em] text-[var(--pl-nav-muted)] uppercase">
                    {group.label}
                  </p>
                ) : groupIndex > 0 ? (
                  <div className="mx-3 mb-3 border-t border-[var(--pl-nav-border)]" />
                ) : null}
                <div className="space-y-1">
                  {group.items.map(item => {
                    const Icon = item.icon
                    const active = isActivePath(item.path)
                    const link = (
                      <MockAwareLink
                        to={item.path}
                        aria-label={collapsed ? item.label : undefined}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'pl-nav-link group relative flex h-12 items-center gap-3 rounded-md text-sm font-medium transition-colors duration-150',
                          collapsed ? 'justify-center px-0' : 'px-3',
                        )}
                      >
                        <Icon className={cn('h-[18px] w-[18px] shrink-0', active && 'text-[var(--pl-nav-accent)]')} />
                        {!collapsed ? <span className="truncate">{item.label}</span> : null}
                        {!collapsed && active ? (
                          <ChevronRight className="ml-auto h-3.5 w-3.5 text-[var(--pl-nav-muted)]" aria-hidden />
                        ) : null}
                      </MockAwareLink>
                    )

                    return (
                      <div key={item.path}>
                        {collapsed ? (
                          <Tooltip content={item.label} side="right" className="whitespace-nowrap">
                            {link}
                          </Tooltip>
                        ) : (
                          link
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mx-3 border-t border-[var(--pl-nav-border)] py-4">
            {!collapsed ? (
              <p className="px-3 pb-3 text-2xs font-medium tracking-[0.1em] text-[var(--pl-nav-muted)] uppercase">{t('nav.account')}</p>
            ) : null}
            <MockAwareLink
              to="/profile"
              aria-label={t('nav.profile')}
              aria-current={isProfileSection ? 'page' : undefined}
              className={cn(
                'pl-nav-link relative flex min-h-14 items-center gap-3 rounded-md text-sm font-medium transition-colors',
                collapsed ? 'justify-center px-0' : 'px-3',
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--pl-nav-border)] bg-[var(--pl-nav-hover)] text-xs text-[var(--pl-nav-active)]" aria-hidden>
                {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
              </span>
              {!collapsed ? (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-[var(--pl-nav-active)]">{user?.name || user?.email}</span>
                  <span className="mt-0.5 block text-2xs text-[var(--pl-nav-muted)]">{t('nav.profile')}</span>
                </span>
              ) : null}
            </MockAwareLink>
          </div>
        </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex h-[calc(var(--pl-topbar-h)+env(safe-area-inset-top,0px))] shrink-0 items-center gap-3 border-b border-border bg-app px-3 pt-[env(safe-area-inset-top,0px)] sm:px-6 lg:px-8"
          style={{ zIndex: 'var(--z-sticky)' }}
        >
          <button
            type="button"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
            aria-expanded={!collapsed}
            className="pl-icon-button -ml-2 hidden h-10 w-10 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-sunken hover:text-text-primary lg:inline-flex"
          >
            {collapsed ? <PanelLeft className="h-[18px] w-[18px]" /> : <ChevronsLeft className="h-[18px] w-[18px]" />}
          </button>
          <MockAwareLink to="/" className="rounded-md lg:hidden">
            <Wordmark />
          </MockAwareLink>
          {activeLabel ? (
            <div className="hidden min-w-0 items-center gap-3 lg:flex">
              <span className="hidden text-xs text-text-muted xl:inline">{t('nav.workspace')}</span>
              <ChevronRight className="hidden h-3.5 w-3.5 text-border-strong xl:block" aria-hidden />
              <span className="truncate text-xs font-semibold text-text-primary">{activeLabel}</span>
            </div>
          ) : null}
          <div className="ml-auto hidden shrink-0 items-center gap-2.5 md:flex">
            <span className={cn('inline-flex items-center gap-2 text-2xs font-medium', market.isOpen ? 'text-bull' : 'text-text-muted')}>
              <span className="relative flex h-1.5 w-1.5" aria-hidden>
                {market.isOpen ? <span className="pl-pulse-ring absolute inline-flex h-full w-full rounded-full bg-bull-vivid" /> : null}
                <span className={cn('relative h-1.5 w-1.5 rounded-full', market.isOpen ? 'bg-bull-vivid' : 'bg-text-muted')} />
              </span>
              {market.isOpen ? t('nav.marketOpen') : t('nav.marketClosed')}
            </span>
            <span className="num text-2xs text-text-muted">{market.easternTime} ET</span>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-0.5 md:ml-3 md:border-l md:border-border md:pl-3">
            <ThemeToggle />
            {languageMenu}
            <Dropdown
              label={t('nav.account')}
              triggerClassName="pl-icon-button h-10 w-10 justify-center"
              trigger={<Avatar name={user?.name} email={user?.email} />}
              menuClassName="w-64"
            >
              {close => (
                <>
                  <DropdownLabel>
                    <p className="truncate text-sm font-semibold text-text-primary">{user?.name || t('nav.account')}</p>
                    <p className="mt-1 truncate text-xs text-text-muted">{user?.email}</p>
                  </DropdownLabel>
                  <MockAwareLink to="/profile" onClick={close} role="menuitem" className="flex min-h-11 items-center gap-2.5 rounded-md px-3 text-sm text-text-secondary hover:bg-surface-raised hover:text-text-primary">
                    <User className="h-4 w-4" />{t('nav.profile')}
                  </MockAwareLink>
                  <MockAwareLink to="/referrals" onClick={close} role="menuitem" className="flex min-h-11 items-center gap-2.5 rounded-md px-3 text-sm text-text-secondary hover:bg-surface-raised hover:text-text-primary">
                    <Gift className="h-4 w-4" />{t('nav.referrals')}
                  </MockAwareLink>
                  <DropdownItem tone="danger" onClick={() => { close(); handleLogout() }}>
                    <LogOut className="h-4 w-4" />{t('nav.logout')}
                  </DropdownItem>
                </>
              )}
            </Dropdown>
          </div>
        </header>

        <main
          id="main"
          ref={mainRef}
          tabIndex={-1}
          className="custom-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain outline-none"
        >
          {children}
        </main>

      <nav
        aria-label={t('nav.primary')}
        className="shrink-0 border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
        style={{ zIndex: 'var(--z-sticky)' }}
      >
        <ul className="grid grid-cols-5 gap-1">
          {flatNav.map(item => {
            const Icon = item.icon
            const active = isActivePath(item.path)
            return (
              <li key={item.path}>
                <MockAwareLink
                  to={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex h-[var(--pl-tabbar-h)] flex-col items-center justify-center gap-1 text-2xs font-semibold transition-colors duration-150',
                    active
                      ? 'text-accent-400'
                      : 'text-text-muted active:text-text-primary',
                  )}
                >
                  <span className={cn('flex h-7 w-12 items-center justify-center rounded-full transition-colors', active && 'bg-accent-soft')}>
                    <Icon className="h-[19px] w-[19px]" />
                  </span>
                  <span className="max-w-full truncate px-1">{item.shortLabel}</span>
                </MockAwareLink>
              </li>
            )
          })}
        </ul>
      </nav>
      </div>
      <MockModeIndicator />
    </div>
  )
}

export default Layout

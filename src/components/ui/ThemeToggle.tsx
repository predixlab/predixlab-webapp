import { Moon, Sun } from 'lucide-react'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/utils'

interface ThemeToggleProps {
  className?: string
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? t('theme.switchToLight') : t('theme.switchToDark')

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        'pl-icon-button inline-flex h-10 w-10 items-center justify-center rounded-md text-text-secondary',
        'transition-colors duration-150 hover:bg-surface-raised hover:text-text-primary',
        'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500',
        className,
      )}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}

export default ThemeToggle

// Mock mode utilities for development

/**
 * Check if mock mode is currently enabled
 */
export const isMockModeEnabled = (): boolean => {
  if (typeof window === 'undefined') return false
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('mock') === 'true'
}

/**
 * Enable mock mode by adding the query parameter
 */
export const enableMockMode = (): void => {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  url.searchParams.set('mock', 'true')
  window.history.pushState({}, '', url.toString())
  window.location.reload()
}

/**
 * Disable mock mode by removing the query parameter
 */
export const disableMockMode = (): void => {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  url.searchParams.delete('mock')
  window.history.pushState({}, '', url.toString())
  window.location.reload()
}

/**
 * Toggle mock mode on/off
 */
export const toggleMockMode = (): void => {
  if (isMockModeEnabled()) {
    disableMockMode()
  } else {
    enableMockMode()
  }
}

/**
 * Get a URL with mock mode enabled
 */
export const getMockModeUrl = (path = ''): string => {
  if (typeof window === 'undefined') return path

  const baseUrl = window.location.origin
  const url = new URL(path, baseUrl)
  url.searchParams.set('mock', 'true')
  return url.toString()
}

/**
 * Get current mock mode status for debugging
 */
export const getMockModeStatus = () => {
  const enabled = isMockModeEnabled()
  return {
    enabled,
    message: enabled ? 'Mock mode is ENABLED - using fake data' : 'Mock mode is DISABLED - using real API',
    indicator: enabled ? '🔧 MOCK' : '🌐 LIVE'
  }
}

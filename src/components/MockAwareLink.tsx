import React from 'react'
import { Link as RouterLink, LinkProps } from 'react-router-dom'

import { isMockModeEnabled } from '@/utils/mockMode'

interface MockAwareLinkProps extends LinkProps {
  preserveMockMode?: boolean
}

/**
 * A Link component that preserves the mock mode query parameter
 * when navigating between routes
 */
const MockAwareLink: React.FC<MockAwareLinkProps> = ({
  to,
  preserveMockMode = true,
  ...props
}) => {
  // If mock mode should be preserved and is currently enabled, add it to the URL
  const enhancedTo = React.useMemo(() => {
    if (!preserveMockMode || !isMockModeEnabled()) {
      return to
    }

    // Handle string URLs
    if (typeof to === 'string') {
      const url = new URL(to, window.location.origin)
      url.searchParams.set('mock', 'true')
      return `${url.pathname}${url.search}${url.hash}`
    }

    // Handle Location objects
    if (typeof to === 'object') {
      const search = new URLSearchParams(to.search || '')
      search.set('mock', 'true')
      return {
        ...to,
        search: search.toString()
      }
    }

    return to
  }, [to, preserveMockMode])

  return <RouterLink to={enhancedTo} {...props} />
}

export default MockAwareLink

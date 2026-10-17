import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router-dom'

import UserNoticeGate from '@/components/UserNoticeGate'
import { USER_NOTICE_VERSION } from '@/constants/legal'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { t } = useTranslation()
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center" role="status">
        <span className="spinner text-accent-400" aria-hidden />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    )
  }

  if (!isAuthenticated()) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user?.user_notice_version !== USER_NOTICE_VERSION) {
    return <UserNoticeGate />
  }

  return <>{children}</>
}

export default ProtectedRoute

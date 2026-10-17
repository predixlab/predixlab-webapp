import { Routes, Route, Navigate, useLocation } from 'react-router-dom'

import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { AuthProvider } from '@/contexts/AuthContext'
import { TickerChartProvider } from '@/contexts/TickerChartContext'
// Auth pages
import AuthCallbackPage from '@/pages/AuthCallbackPage'
// Protected pages (all pages now require authentication)
import BacktestPage from '@/pages/BacktestPage'
import DashboardPage from '@/pages/DashboardPage'
import GammaExposurePage from '@/pages/GammaExposurePage'
import LoginPage from '@/pages/LoginPage'
import MarketOverviewPage from '@/pages/MarketOverviewPage'
import OptionsStructurePage from '@/pages/OptionsStructurePage'
import ProfilePage from '@/pages/ProfilePage'
import ReferralPage from '@/pages/ReferralPage'
import RegisterPage from '@/pages/RegisterPage'
import ScreenerPage from '@/pages/ScreenerPage'
import UnusualOptionsPage from '@/pages/UnusualOptionsPage'

const LegacyDashboardRedirect = () => {
  const location = useLocation()
  return <Navigate to={{ pathname: '/', search: location.search }} replace />
}

const OptionsActivityRedirect = () => {
  const location = useLocation()
  return <Navigate to={{ pathname: '/options/activity', search: location.search }} replace />
}

function App() {
  return (
    <AuthProvider>
      <TickerChartProvider>
        <Layout>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            {/* All other routes now require authentication */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/options/activity" element={
              <ProtectedRoute>
                <UnusualOptionsPage />
              </ProtectedRoute>
            } />
            <Route path="/options/gamma" element={
              <ProtectedRoute>
                <GammaExposurePage />
              </ProtectedRoute>
            } />
            <Route path="/options/structure" element={
              <ProtectedRoute>
                <OptionsStructurePage />
              </ProtectedRoute>
            } />
            <Route path="/options" element={<OptionsActivityRedirect />} />
            <Route path="/market" element={
              <ProtectedRoute>
                <MarketOverviewPage />
              </ProtectedRoute>
            } />
            <Route path="/screener" element={
              <ProtectedRoute>
                <ScreenerPage />
              </ProtectedRoute>
            } />
            <Route path="/predictions" element={
              <ProtectedRoute>
                <LegacyDashboardRedirect />
              </ProtectedRoute>
            } />
            <Route path="/daily-picks" element={
              <ProtectedRoute>
                <LegacyDashboardRedirect />
              </ProtectedRoute>
            } />
            <Route path="/daily_picks" element={
              <ProtectedRoute>
                <LegacyDashboardRedirect />
              </ProtectedRoute>
            } />
            <Route path="/backtest" element={
              <ProtectedRoute>
                <BacktestPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/referrals" element={
              <ProtectedRoute>
                <ReferralPage />
              </ProtectedRoute>
            } />

            {/* Redirect unknown routes to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Layout>
      </TickerChartProvider>
    </AuthProvider>
  )
}

export default App

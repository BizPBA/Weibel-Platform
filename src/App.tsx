import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/components/AuthProvider'
import { DashboardLayout } from '@/components/DashboardLayout'
import { LoginForm } from '@/components/LoginForm'
import { useAuth } from '@/components/AuthProvider'
import Dashboard from '@/pages/Dashboard'
import Customers from '@/pages/Customers'
import Locations from '@/pages/Locations'
import Colleagues from '@/pages/Colleagues'
import LocationDetail from '@/pages/LocationDetail'
import Settings from '@/pages/Settings'
import DatabaseTest from '@/pages/DatabaseTest'
import EmailVerification from '@/pages/EmailVerification'
import CompanyOnboarding from '@/pages/CompanyOnboarding'
import MigrationWizard from '@/pages/MigrationWizard'
import AcceptInvitation from '@/pages/AcceptInvitation'
import CheckYourEmail from '@/pages/CheckYourEmail'
import CompanyConsentCallback from '@/pages/CompanyConsentCallback'
import MicrosoftCallback from '@/pages/MicrosoftCallback'
import NotFound from '@/pages/NotFound'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, needsOnboarding, profile } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Indlæser...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  if (user.email_confirmed_at === null) {
    return <Navigate to="/check-email" replace />
  }

  if (profile && profile.company_id) {
    console.log('ProtectedRoute: User has company, allowing access to protected route')
    return <DashboardLayout>{children}</DashboardLayout>
  }

  if (needsOnboarding) {
    console.log('ProtectedRoute: User needs onboarding, redirecting to wizard')
    return <Navigate to="/onboarding/migrate" replace />
  }

  return <DashboardLayout>{children}</DashboardLayout>
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Indlæser...</p>
          <p className="text-xs text-gray-400 mt-2">Hvis dette tager for lang tid, kontakt venligst serviceteamet</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginForm /> : user.email_confirmed_at === null ? <Navigate to="/check-email" /> : <Navigate to="/dashboard" />} />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />

      <Route path="/check-email" element={<CheckYourEmail />} />
      <Route path="/email-verification" element={<EmailVerification />} />

      <Route path="/onboarding/new" element={user ? <CompanyOnboarding /> : <Navigate to="/login" />} />
      <Route path="/onboarding/migrate" element={user ? <MigrationWizard /> : <Navigate to="/login" />} />
      <Route path="/invitation/accept" element={<AcceptInvitation />} />
      <Route path="/auth/microsoft/company-consent" element={<CompanyConsentCallback />} />
      <Route path="/auth/microsoft/callback" element={<MicrosoftCallback />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/customers" element={
        <ProtectedRoute>
          <Customers />
        </ProtectedRoute>
      } />
      <Route path="/locations" element={
        <ProtectedRoute>
          <Locations />
        </ProtectedRoute>
      } />
      <Route path="/colleagues" element={
        <ProtectedRoute>
          <Colleagues />
        </ProtectedRoute>
      } />
      <Route path="/locations/:id" element={
        <ProtectedRoute>
          <LocationDetail />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/database-test" element={
        <ProtectedRoute>
          <DatabaseTest />
        </ProtectedRoute>
      } />
      <Route path="*" element={
        user ? (
          <ProtectedRoute>
            <NotFound />
          </ProtectedRoute>
        ) : (
          <Navigate to="/login" />
        )
      } />
    </Routes>
  )
}

function App() {
  console.log('App component rendering')
  
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
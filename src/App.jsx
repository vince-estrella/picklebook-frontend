import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

const HomePage = lazy(() => import('./pages/HomePage'))
const FindCourtsPage = lazy(() => import('./pages/FindCourtsPage'))
const CourtDetailPage = lazy(() => import('./pages/CourtDetailPage'))
const BookingPage = lazy(() => import('./pages/BookingPage'))
const BookingConfirmedPage = lazy(() => import('./pages/BookingConfirmedPage'))
const SlotUnavailablePage = lazy(() => import('./pages/SlotUnavailablePage'))
const OwnerLoginPage = lazy(() => import('./pages/OwnerLoginPage'))
const OwnerDashboardPage = lazy(() => import('./pages/OwnerDashboardPage'))
const AddCourtPage = lazy(() => import('./pages/AddCourtPage'))
const OwnerBookingsPage = lazy(() => import('./pages/OwnerBookingsPage'))
const OwnerRegisterPage = lazy(() => import('./pages/OwnerRegisterPage'))
const EditCourtPage = lazy(() => import('./pages/EditCourtPage'))
const BookingsListPage = lazy(() => import('./pages/BookingsListPage'))
const OwnerUsersPage = lazy(() => import('./pages/OwnerUsersPage'))
const OwnerSupportPage = lazy(() => import('./pages/OwnerSupportPage'))
const OwnerCourtsPage = lazy(() => import('./pages/OwnerCourtsPage'))
const OwnerMessagesPage = lazy(() => import('./pages/OwnerMessagesPage'))
const QueueManager = lazy(() => import('./pages/QueueManager'))
const JoinQueuePage = lazy(() => import('./pages/JoinQueuePage'))
const QueueScannerPage = lazy(() => import('./pages/QueueScannerPage'))
const ContactSupportPage = lazy(() => import('./pages/ContactSupportPage'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'))
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'))
const OwnerReportsPage = lazy(() => import('./pages/OwnerReportsPage'))
const OwnerSettingsPage = lazy(() => import('./pages/OwnerSettingsPage'))
const OwnerOpenPlayPage = lazy(() => import('./pages/OwnerOpenPlayPage'))
const PlayerLoginPage = lazy(() => import('./pages/PlayerLoginPage'))
const PlayerRegisterPage = lazy(() => import('./pages/PlayerRegisterPage'))
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage'))
const PlayerSettingsPage = lazy(() => import('./pages/PlayerSettingsPage'))
const PlayerMessagesPage = lazy(() => import('./pages/PlayerMessagesPage'))
const ReportListingPage = lazy(() => import('./pages/ReportListingPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const OpenPlaySessionPage = lazy(() => import('./pages/OpenPlaySessionPage'))

function RouteLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 text-center text-sm font-semibold text-slate-500">
      Loading PickleBook...
    </div>
  )
}

function player(element) {
  return <ProtectedRoute role="player">{element}</ProtectedRoute>
}

function owner(element) {
  return <ProtectedRoute role="owner">{element}</ProtectedRoute>
}

function App() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/my-bookings" element={player(<MyBookingsPage />)} />
        <Route path="/messages" element={player(<PlayerMessagesPage />)} />
        <Route path="/settings" element={player(<PlayerSettingsPage />)} />
        <Route path="/login" element={<PlayerLoginPage />} />
        <Route path="/register" element={<PlayerRegisterPage />} />

        <Route path="/owner/register" element={<OwnerRegisterPage />} />
        <Route path="/owner/login" element={<OwnerLoginPage />} />
        <Route path="/owner/dashboard" element={owner(<OwnerDashboardPage />)} />
        <Route path="/owner/courts" element={owner(<OwnerCourtsPage />)} />
        <Route path="/owner/courts/add" element={owner(<AddCourtPage />)} />
        <Route path="/owner/courts/:id/edit" element={owner(<EditCourtPage />)} />
        <Route path="/owner/courts/:id/bookings" element={owner(<OwnerBookingsPage />)} />
        <Route path="/owner/users" element={owner(<OwnerUsersPage />)} />
        <Route path="/owner/bookings" element={owner(<BookingsListPage />)} />
        <Route path="/owner/open-play" element={owner(<OwnerOpenPlayPage />)} />
        <Route path="/owner/support" element={owner(<OwnerSupportPage />)} />
        <Route path="/owner/messages" element={owner(<OwnerMessagesPage />)} />
        <Route path="/owner/reports" element={owner(<OwnerReportsPage />)} />
        <Route path="/owner/settings" element={owner(<OwnerSettingsPage />)} />

        <Route path="/booking/confirmed" element={<BookingConfirmedPage />} />
        <Route path="/booking/unavailable" element={<SlotUnavailablePage />} />
        <Route path="/booking/:id" element={<BookingPage />} />

        <Route path="/" element={<HomePage />} />
        <Route path="/courts" element={<FindCourtsPage />} />
        <Route path="/courts/:id" element={<CourtDetailPage />} />
        <Route path="/queue" element={<QueueManager />} />
        <Route path="/join" element={<JoinQueuePage />} />
        <Route path="/scan-queue" element={player(<QueueScannerPage />)} />
        <Route path="/open-play/:code" element={player(<OpenPlaySessionPage />)} />
        <Route path="/contact" element={<ContactSupportPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/report-listing/:id" element={<ReportListingPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default App

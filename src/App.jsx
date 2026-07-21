import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import FindCourtsPage from './pages/FindCourtsPage'
import CourtDetailPage from './pages/CourtDetailPage'
import BookingPage from './pages/BookingPage'
import BookingConfirmedPage from './pages/BookingConfirmedPage'
import SlotUnavailablePage from './pages/SlotUnavailablePage'
import OwnerLoginPage from './pages/OwnerLoginPage'
import OwnerDashboardPage from './pages/OwnerDashboardPage'
import AddCourtPage from './pages/AddCourtPage'
import OwnerBookingsPage from './pages/OwnerBookingsPage'
import OwnerRegisterPage from './pages/OwnerRegisterPage'
import EditCourtPage from './pages/EditCourtPage'
import BookingsListPage from './pages/BookingsListPage'
import OwnerUsersPage from './pages/OwnerUsersPage'
import OwnerSupportPage from './pages/OwnerSupportPage'
import OwnerCourtsPage from './pages/OwnerCourtsPage'
import OwnerMessagesPage from './pages/OwnerMessagesPage'
import QueueManager from './pages/QueueManager'
import ContactSupportPage from './pages/ContactSupportPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import OwnerReportsPage from './pages/OwnerReportsPage'
import OwnerSettingsPage from './pages/OwnerSettingsPage'
import PlayerLoginPage from './pages/PlayerLoginPage'
import PlayerRegisterPage from './pages/PlayerRegisterPage'
import MyBookingsPage from './pages/MyBookingsPage'
function App() {
  return (
    <Routes>
      <Route path="/my-bookings" element={<MyBookingsPage />} />
      <Route path="/login" element={<PlayerLoginPage />} />
      <Route path="/register" element={<PlayerRegisterPage />} />
      <Route path="/owner/courts/:id/edit" element={<EditCourtPage />} />
      <Route path="/owner/register" element={<OwnerRegisterPage />} />
      <Route path="/owner/courts/add" element={<AddCourtPage />} />
      <Route path="/owner/courts/:id/bookings" element={<OwnerBookingsPage />} />
      <Route path="/owner/courts" element={<OwnerCourtsPage />} />
      <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
      <Route path="/owner/login" element={<OwnerLoginPage />} />
      <Route path="/booking/confirmed" element={<BookingConfirmedPage />} />
      <Route path="/booking/unavailable" element={<SlotUnavailablePage />} /> 
      <Route path="/booking/:id" element={<BookingPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/courts" element={<FindCourtsPage />} />
      <Route path="/courts/:id" element={<CourtDetailPage />} />
      <Route path="/owner/users" element={<OwnerUsersPage />} />
      <Route path="/owner/bookings" element={<BookingsListPage />} />
      <Route path="/owner/support" element={<OwnerSupportPage />} />
      <Route path="/owner/messages" element={<OwnerMessagesPage />} />
      <Route path="/owner/reports" element={<OwnerReportsPage />} />
      <Route path="/owner/settings" element={<OwnerSettingsPage />} />
      <Route path="/queue" element={<QueueManager />} />
      <Route path="/contact" element={<ContactSupportPage />} />
       <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
    </Routes>
  )
}

export default App

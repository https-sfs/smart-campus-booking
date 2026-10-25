import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import DashboardLayout from './components/layout/DashboardLayout.jsx'
import PublicLayout from './components/layout/PublicLayout.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import AdminBookingsPage from './pages/admin/AdminBookingsPage.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import AdminFeedbackPage from './pages/admin/AdminFeedbackPage.jsx'
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage.jsx'
import AdminServicesPage from './pages/admin/AdminServicesPage.jsx'
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx'
import BookingDetailPage from './pages/bookings/BookingDetailPage.jsx'
import BookingFormPage from './pages/bookings/BookingFormPage.jsx'
import BookingListPage from './pages/bookings/BookingListPage.jsx'
import PaymentHistoryPage from './pages/bookings/PaymentHistoryPage.jsx'
import PaymentPage from './pages/bookings/PaymentPage.jsx'
import StudentDashboardPage from './pages/dashboard/StudentDashboardPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ServiceDetailPage from './pages/ServiceDetailPage.jsx'
import ServicesPage from './pages/ServicesPage.jsx'

export default function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/:serviceId" element={<ServiceDetailPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
        <Route path="app" element={<DashboardLayout area="student" />}>
          <Route index element={<StudentDashboardPage />} />
          <Route path="bookings" element={<BookingListPage />} />
          <Route path="bookings/new" element={<BookingFormPage />} />
          <Route path="bookings/:bookingId" element={<BookingDetailPage />} />
          <Route path="bookings/:bookingId/pay" element={<PaymentPage />} />
          <Route path="payments" element={<PaymentHistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="admin" element={<DashboardLayout area="admin" />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="services" element={<AdminServicesPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="feedback" element={<AdminFeedbackPage />} />
        </Route>
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  )
}

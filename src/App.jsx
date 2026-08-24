import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import GuestRoute from './components/layout/GuestRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import ScrollToTop from './components/layout/ScrollToTop';
import PageLoader from './components/ui/PageLoader';

// Lazy-loaded Pages
const Home = lazy(() => import('./pages/Home'));

// Customer Workspace Suite Pages
const CustomerWorkspacesPage = lazy(() => import('./pages/customer/CustomerWorkspacesPage'));
const CustomerWorkspaceProfilePage = lazy(() => import('./pages/customer/CustomerWorkspaceProfilePage'));
const CustomerBookAppointmentPage = lazy(() => import('./pages/customer/CustomerBookAppointmentPage'));

// Customer Suite Auth & Dashboard Pages
const CustomerLoginPage = lazy(() => import('./pages/customer/auth/CustomerLoginPage'));
const CustomerRegisterPage = lazy(() => import('./pages/customer/auth/CustomerRegisterPage'));
const CustomerForgotPasswordPage = lazy(() => import('./pages/customer/auth/CustomerForgotPasswordPage'));
const CustomerVerifyAccountPage = lazy(() => import('./pages/customer/auth/CustomerVerifyAccountPage'));
const CustomerProfilePage = lazy(() => import('./pages/customer/dashboard/CustomerProfilePage'));
const CustomerSecurityPage = lazy(() => import('./pages/customer/dashboard/CustomerSecurityPage'));
const CustomerChangePasswordPage = lazy(() => import('./pages/customer/dashboard/CustomerChangePasswordPage'));

// Workspace Member Suite Auth & Dashboard Pages
const MemberLoginPage = lazy(() => import('./pages/member/auth/MemberLoginPage'));
const MemberRegisterPage = lazy(() => import('./pages/member/auth/MemberRegisterPage'));
const MemberForgotPasswordPage = lazy(() => import('./pages/member/auth/MemberForgotPasswordPage'));
const MemberVerifyAccountPage = lazy(() => import('./pages/member/auth/MemberVerifyAccountPage'));
const MemberProfilePage = lazy(() => import('./pages/member/dashboard/MemberProfilePage'));
const MemberSecurityPage = lazy(() => import('./pages/member/dashboard/MemberSecurityPage'));
const MemberChangePasswordPage = lazy(() => import('./pages/member/dashboard/MemberChangePasswordPage'));

// Workspace Suite Pages & Layout
const WorkspaceLayout = lazy(() => import('./pages/member/dashboard/WorkspaceLayout'));
const WorkspaceSettingsPage = lazy(() => import('./pages/member/dashboard/WorkspaceSettingsPage'));
const WorkspaceSubscriptionsPage = lazy(() => import('./pages/member/dashboard/WorkspaceSubscriptionsPage'));
const WorkspaceMembersPage = lazy(() => import('./pages/member/dashboard/WorkspaceMembersPage'));
const WorkspaceRolesPage = lazy(() => import('./pages/member/dashboard/WorkspaceRolesPage'));
const WorkspaceServicesPage = lazy(() => import('./pages/member/dashboard/WorkspaceServicesPage'));
const WorkspaceBookingsPage = lazy(() => import('./pages/member/dashboard/WorkspaceBookingsPage'));
const WorkspaceSchedulesPage = lazy(() => import('./pages/member/dashboard/WorkspaceSchedulesPage'));
const WorkspacePaymentsPage = lazy(() => import('./pages/member/dashboard/WorkspacePaymentsPage'));

// Frontend Error Pages
const NotFoundPage = lazy(() => import('./pages/error/NotFoundPage'));
const ForbiddenPage = lazy(() => import('./pages/error/ForbiddenPage'));
const ServerErrorPage = lazy(() => import('./pages/error/ServerErrorPage'));
const ServiceUnavailablePage = lazy(() => import('./pages/error/ServiceUnavailablePage'));

import ErrorBoundary from './components/common/ErrorBoundary';

// Auth pages layout
function AuthLayout({ children }) {
  return (
    <>
      <a href="#main-content" className="skip-link">
        الانتقال إلى المحتوى الرئيسي / Skip to main content
      </a>
      <main id="main-content" tabIndex="-1">
        {children}
      </main>
    </>
  );
}

import IconSprite from './components/common/IconSprite';

// Main layout with Navbar and Footer
function MainLayout({ children }) {
  return (
    <div className="app-layout">
      <a href="#main-content" className="skip-link">
        الانتقال إلى المحتوى الرئيسي / Skip to main content
      </a>
      <Navbar />
      <main id="main-content" tabIndex="-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <IconSprite />
      <ScrollToTop />
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public pages — with Navbar/Footer */}
                  <Route path="/" element={<MainLayout><Home /></MainLayout>} />
                  <Route path="/about" element={<Navigate to="/#about" replace />} />
                  <Route path="/workspaces" element={<MainLayout><CustomerWorkspacesPage /></MainLayout>} />
                  <Route path="/workspaces/:idOrSlug" element={<MainLayout><CustomerWorkspaceProfilePage /></MainLayout>} />
                  <Route path="/workspaces/:idOrSlug/book" element={<MainLayout><CustomerBookAppointmentPage /></MainLayout>} />

                  {/* Customer Suite Routes */}
                  <Route path="/customer/login" element={<GuestRoute><AuthLayout><CustomerLoginPage /></AuthLayout></GuestRoute>} />
                  <Route path="/customer/register" element={<GuestRoute><AuthLayout><CustomerRegisterPage /></AuthLayout></GuestRoute>} />
                  <Route path="/customer/forgot-password" element={<GuestRoute><AuthLayout><CustomerForgotPasswordPage /></AuthLayout></GuestRoute>} />
                  <Route path="/customer/reset-password" element={<GuestRoute><AuthLayout><CustomerForgotPasswordPage /></AuthLayout></GuestRoute>} />
                  <Route path="/customer/verify-account" element={<GuestRoute><AuthLayout><CustomerVerifyAccountPage /></AuthLayout></GuestRoute>} />

                  <Route path="/customer" element={<MainLayout><ProtectedRoute><DashboardLayout /></ProtectedRoute></MainLayout>}>
                    <Route index element={<Navigate to="profile" replace />} />
                    <Route path="profile" element={<CustomerProfilePage />} />
                    <Route path="security" element={<CustomerSecurityPage />} />
                    <Route path="change-password" element={<CustomerChangePasswordPage />} />
                  </Route>

                  {/* Workspace Member Suite Routes */}
                  <Route path="/member/login" element={<GuestRoute><AuthLayout><MemberLoginPage /></AuthLayout></GuestRoute>} />
                  <Route path="/member/register" element={<GuestRoute><AuthLayout><MemberRegisterPage /></AuthLayout></GuestRoute>} />
                  <Route path="/member/forgot-password" element={<GuestRoute><AuthLayout><MemberForgotPasswordPage /></AuthLayout></GuestRoute>} />
                  <Route path="/member/reset-password" element={<GuestRoute><AuthLayout><MemberForgotPasswordPage /></AuthLayout></GuestRoute>} />
                  <Route path="/member/verify-account" element={<GuestRoute><AuthLayout><MemberVerifyAccountPage /></AuthLayout></GuestRoute>} />

                  <Route path="/member" element={<MainLayout><ProtectedRoute><DashboardLayout /></ProtectedRoute></MainLayout>}>
                    <Route index element={<Navigate to="profile" replace />} />
                    <Route path="profile" element={<MemberProfilePage />} />
                    <Route path="security" element={<MemberSecurityPage />} />
                    <Route path="change-password" element={<MemberChangePasswordPage />} />
                  </Route>

                  {/* Workspace Suite Routes */}
                  <Route path="/member/workspace" element={<MainLayout><ProtectedRoute><WorkspaceLayout /></ProtectedRoute></MainLayout>}>
                    <Route index element={<Navigate to="settings" replace />} />
                    <Route path="settings" element={<WorkspaceSettingsPage />} />
                    <Route path="subscriptions" element={<WorkspaceSubscriptionsPage />} />
                    <Route path="members" element={<WorkspaceMembersPage />} />
                    <Route path="roles" element={<WorkspaceRolesPage />} />
                    <Route path="services" element={<WorkspaceServicesPage />} />
                    <Route path="bookings" element={<WorkspaceBookingsPage />} />
                    <Route path="schedules" element={<WorkspaceSchedulesPage />} />
                    <Route path="payments" element={<WorkspacePaymentsPage />} />
                  </Route>

                  {/* Explicit Error Pages */}
                  <Route path="/404" element={<MainLayout><NotFoundPage /></MainLayout>} />
                  <Route path="/403" element={<MainLayout><ForbiddenPage /></MainLayout>} />
                  <Route path="/500" element={<MainLayout><ServerErrorPage /></MainLayout>} />
                  <Route path="/503" element={<MainLayout><ServiceUnavailablePage /></MainLayout>} />

                  {/* General Route Aliases */}
                  <Route path="/login" element={<GuestRoute><Navigate to="/customer/login" replace /></GuestRoute>} />
                  <Route path="/register" element={<GuestRoute><Navigate to="/customer/register" replace /></GuestRoute>} />
                  <Route path="/forgot-password" element={<GuestRoute><Navigate to="/customer/forgot-password" replace /></GuestRoute>} />
                  <Route path="/reset-password" element={<GuestRoute><Navigate to="/customer/forgot-password" replace /></GuestRoute>} />
                  <Route path="/verify-account" element={<GuestRoute><Navigate to="/customer/verify-account" replace /></GuestRoute>} />
                  <Route path="/profile" element={<Navigate to="/customer/profile" replace />} />
                  <Route path="/customer/appointments" element={<Navigate to="/customer/profile?tab=appointments" replace />} />
                  <Route path="/my-appointments" element={<Navigate to="/customer/profile?tab=appointments" replace />} />
                  <Route path="/security" element={<Navigate to="/customer/security" replace />} />
                  <Route path="/change-password" element={<Navigate to="/customer/change-password" replace />} />
                  <Route path="/workspace/settings" element={<Navigate to="/member/workspace/settings" replace />} />
                  <Route path="/workspace/subscriptions" element={<Navigate to="/member/workspace/subscriptions" replace />} />
                  <Route path="/workspace/members" element={<Navigate to="/member/workspace/members" replace />} />
                  <Route path="/workspace/roles" element={<Navigate to="/member/workspace/roles" replace />} />
                  <Route path="/workspace/services" element={<Navigate to="/member/workspace/services" replace />} />
                  <Route path="/workspace/bookings" element={<Navigate to="/member/workspace/bookings" replace />} />
                  <Route path="/workspace/schedules" element={<Navigate to="/member/workspace/schedules" replace />} />

                  {/* Catch-all Route for 404 Not Found */}
                  <Route path="*" element={<MainLayout><NotFoundPage /></MainLayout>} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

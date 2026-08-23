import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
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
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <IconSprite />
      <ScrollToTop />
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public pages — with Navbar/Footer */}
                <Route path="/" element={<MainLayout><Home /></MainLayout>} />
                <Route path="/about" element={<Navigate to="/#about" replace />} />
                <Route path="/workspaces" element={<MainLayout><CustomerWorkspacesPage /></MainLayout>} />
                <Route path="/workspaces/:idOrSlug" element={<MainLayout><CustomerWorkspaceProfilePage /></MainLayout>} />
                <Route path="/workspaces/:idOrSlug/book" element={<MainLayout><CustomerBookAppointmentPage /></MainLayout>} />

                {/* Customer Suite Routes */}
                <Route path="/customer/login" element={<AuthLayout><CustomerLoginPage /></AuthLayout>} />
                <Route path="/customer/register" element={<AuthLayout><CustomerRegisterPage /></AuthLayout>} />
                <Route path="/customer/forgot-password" element={<AuthLayout><CustomerForgotPasswordPage /></AuthLayout>} />
                <Route path="/customer/reset-password" element={<AuthLayout><CustomerForgotPasswordPage /></AuthLayout>} />
                <Route path="/customer/verify-account" element={<AuthLayout><CustomerVerifyAccountPage /></AuthLayout>} />

                <Route path="/customer" element={<MainLayout><ProtectedRoute><DashboardLayout /></ProtectedRoute></MainLayout>}>
                  <Route index element={<Navigate to="profile" replace />} />
                  <Route path="profile" element={<CustomerProfilePage />} />
                  <Route path="security" element={<CustomerSecurityPage />} />
                  <Route path="change-password" element={<CustomerChangePasswordPage />} />
                </Route>

                {/* Workspace Member Suite Routes */}
                <Route path="/member/login" element={<AuthLayout><MemberLoginPage /></AuthLayout>} />
                <Route path="/member/register" element={<AuthLayout><MemberRegisterPage /></AuthLayout>} />
                <Route path="/member/forgot-password" element={<AuthLayout><MemberForgotPasswordPage /></AuthLayout>} />
                <Route path="/member/reset-password" element={<AuthLayout><MemberForgotPasswordPage /></AuthLayout>} />
                <Route path="/member/verify-account" element={<AuthLayout><MemberVerifyAccountPage /></AuthLayout>} />

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

                {/* General Route Aliases */}
                <Route path="/login" element={<Navigate to="/customer/login" replace />} />
                <Route path="/register" element={<Navigate to="/customer/register" replace />} />
                <Route path="/forgot-password" element={<Navigate to="/customer/forgot-password" replace />} />
                <Route path="/reset-password" element={<Navigate to="/customer/forgot-password" replace />} />
                <Route path="/verify-account" element={<Navigate to="/customer/verify-account" replace />} />
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
              </Routes>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

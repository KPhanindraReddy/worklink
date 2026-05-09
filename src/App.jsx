import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Skeleton } from './components/common/Skeleton';

const HomePage = lazy(() => import('./pages/HomePage'));
const AuthPage = lazy(() => import('./pages/auth/AuthPage'));
const CompleteProfilePage = lazy(() => import('./pages/auth/CompleteProfilePage'));
const LabourDashboardPage = lazy(() => import('./pages/labour/LabourDashboardPage'));
const ClientDashboardPage = lazy(() => import('./pages/client/ClientDashboardPage'));
const SearchPage = lazy(() => import('./pages/shared/SearchPage'));
const LabourProfilePage = lazy(() => import('./pages/shared/LabourProfilePage'));
const ChatPage = lazy(() => import('./pages/shared/ChatPage'));
const NotificationsPage = lazy(() => import('./pages/shared/NotificationsPage'));
const SettingsPage = lazy(() => import('./pages/shared/SettingsPage'));
const AboutContactPage = lazy(() => import('./pages/shared/AboutContactPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const RouteFallback = () => (
  <div className="page-shell py-16">
    <Skeleton className="h-12 w-64" />
    <Skeleton className="mt-4 h-[480px] w-full" />
  </div>
);

const App = () => (
  <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute allowIncompleteProfile>
            <CompleteProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/labour/:labourId" element={<LabourProfilePage />} />
      <Route
        path="/booking"
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <Navigate to="/search" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute allowedRoles={['labour', 'client', 'admin']}>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute allowedRoles={['labour', 'client', 'admin']}>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={['labour', 'client', 'admin']}>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/about" element={<AboutContactPage />} />
      <Route
        path="/labour/dashboard"
        element={
          <ProtectedRoute allowedRoles={['labour']}>
            <LabourDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/dashboard"
        element={
          <ProtectedRoute allowedRoles={['client']}>
            <ClientDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);

export default App;

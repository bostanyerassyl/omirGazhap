import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/features/auth/ui/ProtectedRoute'

const AdminPage = lazy(() => import('../../pages/Admin/Admin'))
const AkimatPage = lazy(() => import('../../pages/Akimat/Akimat'))
const DashboardPage = lazy(() => import('../../pages/Dashboard/Dashboard'))
const DeveloperPage = lazy(() => import('../../pages/Developer/Developer'))
const IndustrialistPage = lazy(() => import('../../pages/Industrialist/Industrialist'))
const LoginPage = lazy(() => import('../../pages/Login/Login'))
const RegisterPage = lazy(() => import('../../pages/Register/Register'))
const UtilitiesPage = lazy(() => import('../../pages/Utilities/Utilities'))

function AppRouter() {
  return (
    <Suspense fallback={<div />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/developer"
          element={
            <ProtectedRoute allowedRoles={['developer']}>
              <DeveloperPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/akimat"
          element={
            <ProtectedRoute allowedRoles={['akimat']}>
              <AkimatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/industrialist"
          element={
            <ProtectedRoute allowedRoles={['industrialist']}>
              <IndustrialistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/utilities"
          element={
            <ProtectedRoute allowedRoles={['utilities']}>
              <UtilitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}

export default AppRouter


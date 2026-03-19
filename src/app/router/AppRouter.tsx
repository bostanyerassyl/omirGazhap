import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

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
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/developer" element={<DeveloperPage />} />
        <Route path="/akimat" element={<AkimatPage />} />
        <Route path="/industrialist" element={<IndustrialistPage />} />
        <Route path="/utilities" element={<UtilitiesPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  )
}

export default AppRouter


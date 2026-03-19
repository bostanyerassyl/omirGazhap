import { Navigate, Route, Routes } from 'react-router-dom'
import AdminPage from '../../pages/Admin/Admin'
import AkimatPage from '../../pages/Akimat/Akimat'
import DashboardPage from '../../pages/Dashboard/Dashboard'
import DeveloperPage from '../../pages/Developer/Developer'
import IndustrialistPage from '../../pages/Industrialist/Industrialist'
import LoginPage from '../../pages/Login/Login'
import RegisterPage from '../../pages/Register/Register'
import UtilitiesPage from '../../pages/Utilities/Utilities'

function AppRouter() {
  return (
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
  )
}

export default AppRouter


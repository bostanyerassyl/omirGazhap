import { Route, Routes } from 'react-router-dom'
import LoginPage from '../../pages/Login/Login'
import RegisterPage from '../../pages/Register/Register'

function AppRouter() {
  return (
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<div></div>} />
    </Routes>
  )
}

export default AppRouter

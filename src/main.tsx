import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AppDataProvider } from './features/app/model/AppDataProvider.tsx'
import { AuthProvider } from './features/auth/model/AuthProvider.tsx'
import { I18nProvider } from './features/i18n/model/I18nProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <AppDataProvider>
            <App />
          </AppDataProvider>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>,
)

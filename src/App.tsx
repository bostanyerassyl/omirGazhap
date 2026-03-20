import AppRouter from './app/router/AppRouter'
import { LanguageSwitcher } from './components/ui/language-switcher'

function App() {
  return (
    <>
      <AppRouter />
      <LanguageSwitcher />
    </>
  )
}

export default App

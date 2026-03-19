import Register from './pages/Register/Register'

function App() {
  if (window.location.pathname === '/register') {
    return <Register />
  }

  return <div></div>
}

export default App

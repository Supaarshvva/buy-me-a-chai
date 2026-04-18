import { useEffect } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { useAuth } from './context/AuthContext.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import Landing from './pages/Landing.jsx'
import Signup from './pages/Signup.jsx'

function App() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (loading || !user) {
      return
    }

    const redirectPath = sessionStorage.getItem('postAuthRedirect')

    if (redirectPath && location.pathname !== redirectPath) {
      sessionStorage.removeItem('postAuthRedirect')
      navigate(redirectPath, { replace: true })
    }
  }, [loading, location.pathname, navigate, user])

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App

import { useEffect } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { useAuth } from './context/AuthContext.jsx'
import {
  POST_AUTH_REDIRECT_KEY,
  getPostAuthRedirectPath,
} from './services/postAuthRedirect.js'
import CreateProfile from './pages/CreateProfile.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import Landing from './pages/Landing.jsx'
import Signup from './pages/Signup.jsx'

function App() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    const restorePostAuthRedirect = async () => {
      if (loading || !user) {
        return
      }

      const shouldRedirect = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)

      if (!shouldRedirect) {
        return
      }

      const nextPath = await getPostAuthRedirectPath()

      if (!isMounted || !nextPath) {
        return
      }

      sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY)
      navigate(nextPath, { replace: true })
    }

    restorePostAuthRedirect()

    return () => {
      isMounted = false
    }
  }, [loading, navigate, user])

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/create-profile"
        element={
          <ProtectedRoute requireNoProfile>
            <CreateProfile />
          </ProtectedRoute>
        }
      />
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

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import {
  POST_AUTH_REDIRECT_KEY,
  getPostAuthRedirectPath,
} from './services/postAuthRedirect.js'
import AppRoutes from './routes/AppRoutes.jsx'

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
    <AppRoutes />
  )
}

export default App

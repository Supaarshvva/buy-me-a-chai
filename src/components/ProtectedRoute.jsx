import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function ProtectedRoute({ children, requireProfile = false, requireNoProfile = false }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-100 px-6 text-lg font-medium text-stone-700">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireProfile && !profile) {
    return <Navigate to="/create-profile" replace />
  }

  if (requireNoProfile && profile) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute

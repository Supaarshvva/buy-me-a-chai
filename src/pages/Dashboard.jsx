import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import supabase from '../services/supabase.js'

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    sessionStorage.removeItem('postAuthRedirect')
    navigate('/', { replace: true })
    await supabase.auth.signOut()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-100 px-6 py-10">
      <div className="w-full max-w-xl rounded-[32px] border border-stone-200/70 bg-white p-8 shadow-2xl shadow-stone-900/10 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
          Dashboard
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
          Welcome, {user?.email}
        </h1>
        <p className="mt-4 text-base leading-7 text-stone-600">
          Your account is active and ready to use.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="mt-8 rounded-2xl bg-stone-900 px-5 py-3 text-base font-medium text-white shadow-lg shadow-stone-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  )
}

export default Dashboard

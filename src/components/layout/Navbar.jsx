import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { POST_AUTH_REDIRECT_KEY } from '../../services/postAuthRedirect.js'
import supabase from '../../services/supabase.js'

function Navbar() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const fullName = profile?.full_name?.trim() || 'Creator'
  const username = profile?.username?.trim() || ''

  const handleLogout = async () => {
    setIsLoggingOut(true)
    sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY)
    navigate('/', { replace: true })
    await supabase.auth.signOut()
  }

  return (
    <header className="border-b border-stone-200/80 bg-white/90 px-6 py-4 backdrop-blur sm:px-8 lg:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
            Dashboard
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
            {fullName}
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            {username ? `@${username}` : 'Creator workspace'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-stone-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </header>
  )
}

export default Navbar

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { POST_AUTH_REDIRECT_KEY } from '../services/postAuthRedirect.js'
import supabase from '../services/supabase.js'

function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [copyStatus, setCopyStatus] = useState('Copy link')

  const fullName = profile?.full_name?.trim() || 'Creator Profile'
  const username = profile?.username?.trim() || ''
  const avatarUrl = profile?.avatar_url?.trim() || ''
  const publicProfileLink = username
    ? `${window.location.origin}/${username}`
    : ''

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    || 'CP'

  const handleLogout = async () => {
    setIsLoggingOut(true)
    sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY)
    navigate('/', { replace: true })
    await supabase.auth.signOut()
  }

  const handleCopyLink = async () => {
    if (!publicProfileLink) {
      return
    }

    try {
      await navigator.clipboard.writeText(publicProfileLink)
      setCopyStatus('Copied!')
      window.setTimeout(() => setCopyStatus('Copy link'), 2000)
    } catch {
      setCopyStatus('Copy failed')
      window.setTimeout(() => setCopyStatus('Copy link'), 2000)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-100 px-6 py-10">
      <div className="w-full max-w-3xl rounded-[32px] border border-stone-200/70 bg-white p-8 shadow-2xl shadow-stone-900/10 sm:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="h-24 w-24 rounded-full border border-stone-200 object-cover shadow-md shadow-stone-900/10"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-stone-900 text-2xl font-semibold text-white shadow-md shadow-stone-900/10">
                {initials}
              </div>
            )}

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
                Creator Dashboard
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                {fullName}
              </h1>
              <p className="mt-2 text-lg text-stone-600">
                {username ? `@${username}` : '@username'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-2xl bg-stone-900 px-5 py-3 text-base font-medium text-white shadow-lg shadow-stone-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>

        <div className="mt-10 rounded-[28px] border border-stone-200/70 bg-gradient-to-br from-stone-50 via-white to-amber-50 p-6 shadow-sm shadow-stone-200/60">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
            Public Page
          </p>
          <p className="mt-4 text-base text-stone-600">
            Share your creator page so supporters can find you faster.
          </p>

          <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="truncate text-base font-medium text-stone-900">
              {publicProfileLink || 'Add a username to generate your public page link.'}
            </p>

            <button
              type="button"
              onClick={handleCopyLink}
              disabled={!publicProfileLink}
              className="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-900 focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {copyStatus}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

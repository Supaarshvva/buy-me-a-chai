import { useState } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../services/supabase.js'

function AuthForm({ title, buttonLabel, footerText, footerLinkLabel, footerHref }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [oauthError, setOauthError] = useState('')

  const handleGoogleSignIn = async () => {
    setOauthError('')
    setIsGoogleLoading(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      setOauthError('Unable to continue with Google right now. Please try again.')
      setIsGoogleLoading(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextErrors = {}

    if (!email.trim()) {
      nextErrors.email = 'Email is required.'
    }

    if (!password.trim()) {
      nextErrors.password = 'Password is required.'
    }

    setErrors(nextErrors)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-100 px-6 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-stone-200/70 bg-white p-8 shadow-2xl shadow-stone-900/10 sm:p-10">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
            {title}
          </h1>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-stone-800 transition duration-200 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M24 9.5c3.54 0 6.68 1.22 9.18 3.61l6.85-6.85C35.94 2.68 30.4 0 24 0 14.64 0 6.54 5.38 2.56 13.22l7.98 6.19C12.43 13.34 17.73 9.5 24 9.5z"
              />
              <path
                fill="#34A853"
                d="M46.1 24.5c0-1.63-.14-3.2-.4-4.72H24v9h12.45c-.54 2.9-2.2 5.36-4.7 7.04l7.23 5.62C43.98 36.98 46.1 31.2 46.1 24.5z"
              />
              <path
                fill="#FBBC05"
                d="M10.54 28.41c-.5-1.46-.79-3-.79-4.41s.29-2.95.79-4.41l-7.98-6.19C.92 17.46 0 20.62 0 24s.92 6.54 2.56 9.6l7.98-6.19z"
              />
              <path
                fill="#EA4335"
                d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.23-5.62c-2.01 1.35-4.6 2.17-8.67 2.17-6.27 0-11.57-3.84-13.46-9.91l-7.98 6.19C6.54 42.62 14.64 48 24 48z"
              />
            </svg>
            {isGoogleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          {oauthError ? (
            <p className="text-sm text-red-500">{oauthError}</p>
          ) : null}

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
              Or continue with email
            </span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-stone-700"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`w-full rounded-2xl border bg-white px-4 py-3 text-stone-900 outline-none transition duration-200 placeholder:text-stone-400 focus:ring-4 ${
                errors.email
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-stone-200 focus:border-amber-400 focus:ring-amber-100'
              }`}
              placeholder="you@example.com"
            />
            {errors.email ? (
              <p className="mt-2 text-sm text-red-500">{errors.email}</p>
            ) : null}
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-stone-700"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`w-full rounded-2xl border bg-white px-4 py-3 text-stone-900 outline-none transition duration-200 placeholder:text-stone-400 focus:ring-4 ${
                errors.password
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-stone-200 focus:border-amber-400 focus:ring-amber-100'
              }`}
              placeholder="Enter your password"
            />
            {errors.password ? (
              <p className="mt-2 text-sm text-red-500">{errors.password}</p>
            ) : null}
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-base font-medium text-white shadow-lg shadow-stone-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-100"
          >
            {buttonLabel}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          {footerText}{' '}
          <Link
            to={footerHref}
            className="font-medium text-amber-700 underline decoration-amber-300 underline-offset-4 transition hover:text-amber-800 hover:decoration-amber-500"
          >
            {footerLinkLabel}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default AuthForm

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { POST_AUTH_REDIRECT_KEY } from '../services/postAuthRedirect.js'
import supabase from '../services/supabase.js'

function formatPermanentNameSeed(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  return value
    .trim()
    .split(/[._-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getPermanentName(user) {
  if (!user) {
    return ''
  }

  return (
    user.user_metadata?.full_name?.trim()
    || user.user_metadata?.name?.trim()
    || formatPermanentNameSeed(user.email?.split('@')[0] || '')
  )
}

function CreateProfile() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [username, setUsername] = useState('')
  const [accountType, setAccountType] = useState('supporter')
  const [bio, setBio] = useState('')
  const [upiId, setUpiId] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const permanentName = useMemo(() => getPermanentName(user), [user])

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY)
    navigate('/', { replace: true })
    await supabase.auth.signOut()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const nextErrors = {}

    if (!username.trim()) {
      nextErrors.username = 'Username is required.'
    }

    if (!permanentName.trim()) {
      nextErrors.fullName = 'Permanent name is unavailable for this account.'
    }

    if (accountType === 'creator' && !upiId.trim()) {
      nextErrors.upiId = 'UPI ID is required for creator accounts.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0 || !user) {
      if (!user) {
        setFormError('You need to be logged in to create a profile.')
      }
      return
    }

    setIsSaving(true)

    const trimmedUsername = username.trim()
    const trimmedBio = bio.trim()
    const trimmedUpiId = upiId.trim()
    let publicUrl

    if (avatarFile) {
      const filePath = `${user.id}/${avatarFile.name}`

      console.log('Uploading file:', avatarFile)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Avatars')
        .upload(filePath, avatarFile, {
          upsert: true,
        })

      console.log('Upload result:', uploadData, uploadError)

      if (uploadError) {
        console.error('UPLOAD FAILED', uploadError)
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('Avatars')
          .getPublicUrl(filePath)

        console.log('Public URL:', publicUrlData)
        publicUrl = publicUrlData?.publicUrl
      }
    }

    const profilePayload = {
      id: user.id,
      username: trimmedUsername,
      full_name: permanentName.trim(),
      bio: trimmedBio,
      account_type: accountType,
      upi_id: trimmedUpiId || null,
      ...(publicUrl ? { avatar_url: publicUrl } : {}),
    }

    const { data: profileData, error } = await supabase
      .from('profiles')
      .upsert(profilePayload)
      .select()
      .maybeSingle()

    console.log('DB save:', profileData, error)

    if (error) {
      console.error('Profile upsert failed:', error)
      setFormError(error.message)
      setIsSaving(false)
      return
    }

    await refreshProfile(user)
    sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-100 px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-2xl rounded-[32px] border border-stone-200/70 bg-white p-6 shadow-2xl shadow-stone-900/10 sm:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
              Create Profile
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
              Finish setting up your profile
            </h1>
            <p className="mt-4 text-base leading-7 text-stone-600">
              Set up your account details so your profile is ready on every device.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut || isSaving}
            className="w-full rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition duration-200 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-900 focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>

        <form className="mt-10 space-y-6" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-stone-700"
              htmlFor="profileImage"
            >
              Profile image (optional)
            </label>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-dashed border-stone-300 bg-amber-50 text-sm font-medium text-stone-500">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  'Preview'
                )}
              </div>
              <input
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null

                  if (imagePreview) {
                    URL.revokeObjectURL(imagePreview)
                  }

                  setAvatarFile(file)
                  setImagePreview(file ? URL.createObjectURL(file) : '')
                }}
                className="block w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 file:mr-4 file:rounded-full file:border-0 file:bg-stone-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                className="mb-2 block text-sm font-medium text-stone-700"
                htmlFor="accountType"
              >
                Account type
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: 'creator', label: 'Creator', description: 'UPI ID required' },
                  { value: 'supporter', label: 'Supporter', description: 'UPI ID optional' },
                ].map((option) => {
                  const isActive = accountType === option.value

                  return (
                    <button
                      key={option.value}
                      id={option.value === 'creator' ? 'accountType' : undefined}
                      type="button"
                      onClick={() => setAccountType(option.value)}
                      className={`rounded-2xl border px-4 py-3 text-left transition duration-200 focus:outline-none focus:ring-4 ${
                        isActive
                          ? 'border-stone-900 bg-stone-900 text-white focus:ring-amber-100'
                          : 'border-stone-200 bg-white text-stone-700 focus:ring-amber-100'
                      }`}
                    >
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className={`mt-1 text-xs ${isActive ? 'text-stone-200' : 'text-stone-500'}`}>
                        {option.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium text-stone-700"
                htmlFor="upiId"
              >
                UPI ID {accountType === 'creator' ? '(required)' : '(optional)'}
              </label>
              <input
                id="upiId"
                type="text"
                value={upiId}
                onChange={(event) => setUpiId(event.target.value)}
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-stone-900 outline-none transition duration-200 placeholder:text-stone-400 focus:ring-4 ${
                  errors.upiId
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-stone-200 focus:border-amber-400 focus:ring-amber-100'
                }`}
                placeholder="yourname@bank"
              />
              {errors.upiId ? (
                <p className="mt-2 text-sm text-red-500">{errors.upiId}</p>
              ) : (
                <p className="mt-2 text-sm text-stone-500">
                  {accountType === 'creator'
                    ? 'Creators need a UPI ID so payments can be connected later.'
                    : 'Supporters can add a UPI ID now or skip it for later.'}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                className="mb-2 block text-sm font-medium text-stone-700"
                htmlFor="username"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-stone-900 outline-none transition duration-200 placeholder:text-stone-400 focus:ring-4 ${
                  errors.username
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-stone-200 focus:border-amber-400 focus:ring-amber-100'
                }`}
                placeholder="yourname"
              />
              {errors.username ? (
                <p className="mt-2 text-sm text-red-500">{errors.username}</p>
              ) : null}
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium text-stone-700"
                htmlFor="fullName"
              >
                Permanent name
              </label>
              <input
                id="fullName"
                type="text"
                value={permanentName}
                readOnly
                className={`w-full rounded-2xl border bg-stone-50 px-4 py-3 text-stone-600 outline-none transition duration-200 placeholder:text-stone-400 focus:ring-4 ${
                  errors.fullName
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-stone-200 focus:border-stone-200 focus:ring-stone-100'
                }`}
                placeholder="Your permanent name"
              />
              {errors.fullName ? (
                <p className="mt-2 text-sm text-red-500">{errors.fullName}</p>
              ) : (
                <p className="mt-2 text-sm text-stone-500">
                  This name is fixed for your account and cannot be edited later.
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-medium text-stone-700"
              htmlFor="bio"
            >
              Bio
            </label>
            <textarea
              id="bio"
              rows="5"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition duration-200 placeholder:text-stone-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
              placeholder={accountType === 'creator'
                ? 'Tell supporters what you create and why they should follow your work.'
                : 'Tell people a little about yourself and what you enjoy supporting.'}
            />
          </div>

          {formError ? <p className="text-sm text-red-500">{formError}</p> : null}

          <button
            type="submit"
            disabled={isSaving || isLoggingOut}
            className="w-full rounded-2xl bg-stone-900 px-5 py-3 text-base font-medium text-white shadow-lg shadow-stone-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateProfile

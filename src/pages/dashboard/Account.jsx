import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import supabase from '../../services/supabase.js'

/* Field label + error helper */
function Field({ id, label, hint, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <label
          htmlFor={id}
          style={{ fontSize: '13px', fontWeight: 600, color: '#1c1917' }}
        >
          {label}
        </label>
        {hint ? (
          <span style={{ fontSize: '11px', color: '#a8a29e' }}>{hint}</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p style={{ fontSize: '12px', color: '#e11d48', margin: 0 }}>{error}</p>
      ) : null}
    </div>
  )
}

/* Shared input styles */
const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  fontSize: '14px',
  color: '#1c1917',
  background: '#ffffff',
  border: '1px solid #d6d3d1',
  borderRadius: '12px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const disabledInputStyle = {
  ...inputStyle,
  background: '#fafaf9',
  color: '#78716c',
  cursor: 'not-allowed',
}

/* Avatar preview */
function AvatarPicker({ currentUrl, preview, onFileChange }) {
  const inputRef = useRef(null)
  const display = preview || currentUrl

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      {/* Circle preview */}
      <div
        style={{
          width: '72px', height: '72px', borderRadius: '50%',
          overflow: 'hidden', flexShrink: 0,
          border: '2px solid #e7e5e4',
          background: '#f5f5f4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {display ? (
          <img
            src={display}
            alt="Profile"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ width: '28px', height: '28px' }}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', fontSize: '13px', fontWeight: 500,
            color: '#44403c', background: '#ffffff',
            border: '1px solid #d6d3d1', borderRadius: '10px',
            cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f4'; e.currentTarget.style.borderColor = '#a8a29e' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#d6d3d1' }}
        >
          Change photo
        </button>
        {preview ? (
          <span style={{ fontSize: '11px', color: '#78716c' }}>New photo selected - save to apply</span>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />
      </div>
    </div>
  )
}

/* Account page */
function Account() {
  const { user, profile, refreshProfile } = useAuth()

  /* Form fields - populated from profile on mount */
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [accountType, setAccountType] = useState('supporter')
  const [upiId, setUpiId] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  /* UI state */
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)  // null | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  /* Seed form with current profile values */
  useEffect(() => {
    if (profile) {
      setUsername(profile.username?.trim() ?? '')
      setBio(profile.bio?.trim() ?? '')
      setAccountType(profile.account_type?.trim() === 'creator' ? 'creator' : 'supporter')
      setUpiId(profile.upi_id?.trim() ?? '')
    }
  }, [profile])

  /* Revoke object URL on unmount */
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const handleFileChange = (event) => {
    const [file] = event.target.files ?? []
    if (!file) return
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaveStatus(null)
    setErrorMsg('')

    /* Validate */
    const errs = {}
    if (!username.trim()) errs.username = 'Username is required.'
    if (accountType === 'creator' && !upiId.trim()) errs.upiId = 'UPI ID is required for creator accounts.'
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0 || !user) return

    setIsSaving(true)

    /* Upload new avatar if selected */
    let avatarUrl = profile?.avatar_url ?? null
    if (avatarFile) {
      const filePath = `${user.id}/${avatarFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('Avatars')
        .upload(filePath, avatarFile, { upsert: true })

      if (uploadError) {
        setErrorMsg(`Photo upload failed: ${uploadError.message}`)
        setIsSaving(false)
        setSaveStatus('error')
        return
      }

      const { data: urlData } = supabase.storage.from('Avatars').getPublicUrl(filePath)
      avatarUrl = urlData?.publicUrl ?? avatarUrl
    }

    /* Upsert profile (full_name is NOT included - it's read-only) */
    const payload = {
      id: user.id,
      full_name: profile?.full_name?.trim() ?? '',
      username: username.trim(),
      bio: bio.trim(),
      account_type: accountType,
      upi_id: upiId.trim() || null,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    }

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(payload)
      .select()
      .maybeSingle()

    if (upsertError) {
      setErrorMsg(upsertError.message)
      setIsSaving(false)
      setSaveStatus('error')
      return
    }

    await refreshProfile(user)
    setAvatarFile(null)
    setAvatarPreview('')
    setIsSaving(false)
    setSaveStatus('success')

    /* Auto-clear success message */
    setTimeout(() => setSaveStatus(null), 3500)
  }

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: '#b45309', margin: 0,
        }}>
          Account Settings
        </p>
        <h1 style={{
          fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em',
          color: '#0c0a09', margin: '8px 0 0',
        }}>
          My account
        </h1>
      </div>

      {/* Form card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e7e5e4',
        borderRadius: '20px',
        padding: '28px',
        boxShadow: '0 1px 4px rgba(28,25,23,0.06)',
      }}>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Avatar */}
            <Field id="avatar" label="Profile photo">
              <AvatarPicker
                currentUrl={profile?.avatar_url ?? ''}
                preview={avatarPreview}
                onFileChange={handleFileChange}
              />
            </Field>

            {/* Full name (read-only) */}
            <Field id="full-name" label="Full name" hint="Cannot be changed">
              <input
                id="full-name"
                type="text"
                value={profile?.full_name?.trim() ?? ''}
                readOnly
                style={disabledInputStyle}
              />
            </Field>

            <Field id="account-type" label="Account type">
              <select
                id="account-type"
                value={accountType}
                onChange={(event) => setAccountType(event.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.15)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#d6d3d1'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <option value="creator">Creator</option>
                <option value="supporter">Supporter</option>
              </select>
            </Field>

            {/* Username */}
            <Field id="username" label="Username" error={fieldErrors.username}>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your-handle"
                autoComplete="username"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.15)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#d6d3d1'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </Field>

            <Field
              id="upi-id"
              label={`UPI ID ${accountType === 'creator' ? '(required)' : '(optional)'}`}
              error={fieldErrors.upiId}
            >
              <input
                id="upi-id"
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@bank"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.15)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#d6d3d1'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </Field>

            {/* Bio */}
            <Field id="bio" label="Bio" hint="Optional">
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell supporters a little about yourself..."
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  lineHeight: '1.6',
                  minHeight: '80px',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.15)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#d6d3d1'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </Field>

            {/* Error message */}
            {saveStatus === 'error' && errorMsg ? (
              <p style={{
                fontSize: '13px', color: '#e11d48',
                background: '#fff1f2', border: '1px solid #fecdd3',
                borderRadius: '10px', padding: '10px 14px', margin: 0,
              }}>
                {errorMsg}
              </p>
            ) : null}

            {/* Success message */}
            {saveStatus === 'success' ? (
              <p style={{
                fontSize: '13px', color: '#15803d',
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: '10px', padding: '10px 14px', margin: 0,
              }}>
                Success: Changes saved successfully
              </p>
            ) : null}

            {/* Save button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  padding: '10px 24px',
                  fontSize: '14px', fontWeight: 600,
                  color: '#ffffff',
                  background: isSaving ? '#78716c' : '#1c1917',
                  border: 'none', borderRadius: '12px', cursor: isSaving ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s, transform 0.1s',
                  boxShadow: '0 2px 8px rgba(28,25,23,0.2)',
                }}
                onMouseEnter={(e) => { if (!isSaving) e.currentTarget.style.background = '#b45309' }}
                onMouseLeave={(e) => { if (!isSaving) e.currentTarget.style.background = '#1c1917' }}
              >
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}

export default Account

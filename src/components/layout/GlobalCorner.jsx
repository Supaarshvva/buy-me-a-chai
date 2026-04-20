import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import useNotifications from '../../hooks/useNotifications.js'
import { POST_AUTH_REDIRECT_KEY } from '../../services/postAuthRedirect.js'
import { formatNotifTimestamp } from '../../services/notificationService.js'
import supabase from '../../services/supabase.js'

/* SVG icon set */


function BellIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"
      style={{ width: '18px', height: '18px', display: 'block' }}
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2.5A5.5 5.5 0 0 0 4.5 8c0 2.4-.6 4-1.5 5h14c-.9-1-1.5-2.6-1.5-5A5.5 5.5 0 0 0 10 2.5Z" />
      <path d="M8.5 15.5a1.5 1.5 0 0 0 3 0" />
      <path d="M10 2.5V1.5" />
    </svg>
  )
}
function IconUser() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"
      style={{ width: '14px', height: '14px', display: 'block', flexShrink: 0 }}
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M2.5 13.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    </svg>
  )
}
function IconDashboard() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"
      style={{ width: '14px', height: '14px', display: 'block', flexShrink: 0 }}
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  )
}
function IconSettings() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"
      style={{ width: '14px', height: '14px', display: 'block', flexShrink: 0 }}
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" />
    </svg>
  )
}
function IconLogout() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"
      style={{ width: '14px', height: '14px', display: 'block', flexShrink: 0 }}
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3" />
      <path d="M6.5 10.5L9 8 6.5 5.5" />
      <path d="M9 8H2" />
    </svg>
  )
}

/* Notification type icons (16x16) */
function IconHeart() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"
      style={{ width: '14px', height: '14px', display: 'block', flexShrink: 0 }}
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13.5S1.5 9.5 1.5 5.5a3.5 3.5 0 0 1 6.5-1.8A3.5 3.5 0 0 1 14.5 5.5c0 4-6.5 8-6.5 8Z" />
    </svg>
  )
}
function IconFollow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"
      style={{ width: '14px', height: '14px', display: 'block', flexShrink: 0 }}
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1 13c0-2.8 2.2-5 5-5" />
      <path d="M11 9v5M8.5 11.5h5" />
    </svg>
  )
}
function IconPost() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"
      style={{ width: '14px', height: '14px', display: 'block', flexShrink: 0 }}
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <path d="M5 6h6M5 9h4" />
    </svg>
  )
}
function IconInfo() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"
      style={{ width: '14px', height: '14px', display: 'block', flexShrink: 0 }}
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 7v4M8 5h.01" />
    </svg>
  )
}


function notifIcon(type) {
  if (type === 'support') return <IconHeart />
  if (type === 'follow')  return <IconFollow />
  if (type === 'like')    return <IconPost />
  return <IconInfo />
}

function notifIconBg(type) {
  if (type === 'support') return { background: '#fff1f2', color: '#e11d48' }
  if (type === 'follow')  return { background: '#f0fdf4', color: '#16a34a' }
  if (type === 'like')    return { background: '#fefce8', color: '#ca8a04' }
  return { background: '#f1f5f9', color: '#475569' }
}

/* NotificationPanel */


function NotificationPanel({ open, notifications }) {
  return (
    <div
      role="dialog"
      aria-label="Notifications"
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: 0,
        width: '320px',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e7e5e4',
        boxShadow: '0 12px 32px rgba(28,25,23,0.12), 0 2px 8px rgba(28,25,23,0.06)',
        zIndex: 50,
        overflow: 'hidden',
        /* animate */
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.98)',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px 12px',
        borderBottom: '1px solid #f5f5f4',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.01em' }}>
          Notifications
        </span>
        {notifications.some(n => !n.is_read) ? (
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            background: '#f97316',
            color: '#fff',
            borderRadius: '99px',
            padding: '1px 7px',
            letterSpacing: '0.03em',
          }}>
            {notifications.filter(n => !n.is_read).length} new
          </span>
        ) : null}
      </div>

      {/* List */}
      <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '6px' }}>
        {notifications.length === 0 ? (
          <div style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: '#a8a29e',
            fontSize: '13px',
          }}>
            No notifications yet
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 10px',
                borderRadius: '10px',
                background: notif.is_read ? 'transparent' : '#fffbf5',
                marginBottom: '2px',
                cursor: 'default',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f4' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = notif.is_read ? 'transparent' : '#fffbf5' }}
            >
              {/* Type icon badge */}
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                flexShrink: 0,
                marginTop: '1px',
                ...notifIconBg(notif.type),
              }}>
                {notifIcon(notif.type)}
              </span>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '12.5px',
                  fontWeight: notif.is_read ? 400 : 600,
                  color: '#1c1917',
                  margin: 0,
                  lineHeight: '1.45',
                }}>
                  {notif.message}
                </p>
                {notif.created_at ? (
                  <p style={{
                    fontSize: '11px',
                    color: '#a8a29e',
                    margin: '2px 0 0',
                  }}>
                    {formatNotifTimestamp(notif.created_at)}
                  </p>
                ) : null}
              </div>

              {/* Unread pip */}
              {!notif.is_read ? (
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#f97316',
                  flexShrink: 0,
                  marginTop: '5px',
                }} />
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* Avatar + account dropdown */


const AVATAR_PX = 34
const avatarBase = {
  width: `${AVATAR_PX}px`,  height: `${AVATAR_PX}px`,
  minWidth: `${AVATAR_PX}px`, minHeight: `${AVATAR_PX}px`,
  maxWidth: `${AVATAR_PX}px`, maxHeight: `${AVATAR_PX}px`,
  borderRadius: '50%', overflow: 'hidden',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, flexGrow: 0, cursor: 'pointer', border: 'none', padding: 0,
}

function AvatarButton({ profile, open, onClick }) {
  const fullName = profile?.full_name?.trim() || profile?.username?.trim() || 'U'
  const avatarUrl = profile?.avatar_url?.trim() || ''
  const initials = fullName.split(' ').filter(Boolean).slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '').join('') || 'U'
  const ring = open ? { outline: '2px solid #f59e0b', outlineOffset: '2px' } : {}

  if (avatarUrl) {
    return (
      <button type="button" aria-label="Open account menu" aria-expanded={open} onClick={onClick}
        style={{ ...avatarBase, ...ring, border: '2px solid rgba(231,229,228,0.8)', transition: 'outline 0.1s' }}>
        <img src={avatarUrl} alt={fullName}
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
      </button>
    )
  }
  return (
    <button type="button" aria-label="Open account menu" aria-expanded={open} onClick={onClick}
      style={{ ...avatarBase, ...ring, background: '#1c1917', color: '#fff',
        fontSize: '12px', fontWeight: 600, letterSpacing: '0.02em', transition: 'outline 0.1s' }}>
      {initials}
    </button>
  )
}

function DropdownMenu({ profile, open, onClose, onLogout }) {
  const username = profile?.username?.trim() || ''
  const fullName = profile?.full_name?.trim() || username || 'My account'
  const publicProfilePath = username ? `/${username}` : null

  const itemBase = {
    display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
    padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
    color: '#44403c', textDecoration: 'none', background: 'transparent',
    border: 'none', cursor: 'pointer', textAlign: 'left',
    transition: 'background 0.1s, color 0.1s', boxSizing: 'border-box',
  }
  const hi = (e) => { e.currentTarget.style.background = '#f5f5f4'; e.currentTarget.style.color = '#1c1917' }
  const lo = (e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#44403c' }
  const hiRed = (e) => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#e11d48' }
  const loRed = (e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#78716c' }

  return (
    <div role="menu" aria-label="Account menu" style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '196px',
      background: '#ffffff', borderRadius: '14px', border: '1px solid #e7e5e4',
      boxShadow: '0 8px 24px rgba(28,25,23,0.10), 0 2px 6px rgba(28,25,23,0.06)',
      padding: '6px', zIndex: 50,
      opacity: open ? 1 : 0,
      transform: open ? 'translateY(0)' : 'translateY(-6px)',
      pointerEvents: open ? 'auto' : 'none',
      transition: 'opacity 0.15s ease, transform 0.15s ease',
    }}>
      <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid #f5f5f4', marginBottom: '4px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#1c1917', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fullName}
        </p>
        {username ? (
          <p style={{ fontSize: '11px', color: '#a8a29e', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            @{username}
          </p>
        ) : null}
      </div>
      {publicProfilePath ? (
        <Link to={publicProfilePath} role="menuitem" onClick={onClose}
          style={itemBase} onMouseEnter={hi} onMouseLeave={lo}>
          <IconUser />View my profile
        </Link>
      ) : null}
      <Link to="/dashboard" role="menuitem" onClick={onClose}
        style={itemBase} onMouseEnter={hi} onMouseLeave={lo}>
        <IconDashboard />Dashboard
      </Link>
      <Link to="/account" role="menuitem" onClick={onClose}
        style={itemBase} onMouseEnter={hi} onMouseLeave={lo}>
        <IconSettings />My account
      </Link>
      <div style={{ height: '1px', background: '#f5f5f4', margin: '4px 0' }} />
      <button type="button" role="menuitem" onClick={onLogout}
        style={{ ...itemBase, color: '#78716c' }} onMouseEnter={hiRed} onMouseLeave={loRed}>
        <IconLogout />Logout
      </button>
    </div>
  )
}

/* GlobalCorner */


function GlobalCorner() {
  const { profile } = useAuth()
  const {
    error,
    markAllAsRead,
    notifications,
    unreadCount,
  } = useNotifications()
  const navigate = useNavigate()

  const [notifOpen, setNotifOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const outerRef = useRef(null)

  /* Mark all read when panel opens */
  const openNotifPanel = async () => {
    setDropdownOpen(false)
    const nextOpen = !notifOpen
    setNotifOpen(nextOpen)

    if (nextOpen) {
      void markAllAsRead()
    }
  }

  /* Close all on outside click */
  useEffect(() => {
    if (!notifOpen && !dropdownOpen) return

    const handleOutside = (event) => {
      if (outerRef.current && !outerRef.current.contains(event.target)) {
        setNotifOpen(false)
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [notifOpen, dropdownOpen])

  /* Escape key closes whichever is open */
  useEffect(() => {
    if (!notifOpen && !dropdownOpen) return

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setNotifOpen(false)
        setDropdownOpen(false)
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [notifOpen, dropdownOpen])

  const handleLogout = async () => {
    setDropdownOpen(false)
    sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY)
    navigate('/', { replace: true })
    await supabase.auth.signOut()
  }

  return (
    <div
      ref={outerRef}
      aria-label="Corner controls"
      style={{
        position: 'absolute',
        top: '20px',
        right: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        zIndex: 10,
      }}
    >
      {/* Bell + notification panel */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          aria-label={unreadCount > 0 ? 'Notifications (unread)' : 'Notifications'}
          aria-expanded={notifOpen}
          onClick={openNotifPanel}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '34px', height: '34px', borderRadius: '50%',
            border: 'none', background: 'transparent',
            color: notifOpen ? '#1c1917' : '#78716c',
            cursor: 'pointer', padding: 0,
            transition: 'color 0.15s', flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#1c1917' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = notifOpen ? '#1c1917' : '#78716c' }}
        >
          <BellIcon />
        </button>

        {/* Unread dot */}
        {unreadCount > 0 ? (
          <span aria-hidden="true" style={{
            position: 'absolute', top: '4px', right: '4px',
            width: '7px', height: '7px', borderRadius: '50%',
            background: '#f97316',
            border: '1.5px solid #fffbf5',
            pointerEvents: 'none',
          }} />
        ) : null}

        {/* Notification panel */}
        <NotificationPanel
          open={notifOpen}
          notifications={error ? [{
            created_at: '',
            id: 'notification-error',
            is_read: true,
            message: error,
            type: 'system',
          }] : notifications}
        />
      </div>

      {/* Avatar + account dropdown */}
      <div style={{ position: 'relative' }}>
        <AvatarButton
          profile={profile}
          open={dropdownOpen}
          onClick={() => {
            setNotifOpen(false)
            setDropdownOpen((prev) => !prev)
          }}
        />
        <DropdownMenu
          profile={profile}
          open={dropdownOpen}
          onClose={() => setDropdownOpen(false)}
          onLogout={handleLogout}
        />
      </div>
    </div>
  )
}

export default GlobalCorner

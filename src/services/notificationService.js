import { normalizeNotification, sortNotificationsLatestFirst } from '../models/notification.js'
import supabase from './supabase.js'

function normalizeNotificationRow(row) {
  return normalizeNotification({
    id: row?.id,
    receiverId: row?.receiver_id,
    senderId: row?.sender_id,
    type: row?.type,
    message: row?.message,
    isRead: row?.is_read,
    createdAt: row?.created_at,
  })
}

async function createNotification({
  receiverId,
  senderId = null,
  type,
  message,
}) {
  const normalizedReceiverId = typeof receiverId === 'string' ? receiverId.trim() : ''
  const normalizedMessage = typeof message === 'string' ? message.trim() : ''

  if (!normalizedReceiverId || !normalizedMessage) {
    return null
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      receiver_id: normalizedReceiverId,
      sender_id: typeof senderId === 'string' && senderId.trim() ? senderId.trim() : null,
      type,
      message: normalizedMessage,
    })
    .select('id, receiver_id, sender_id, type, message, is_read, created_at')
    .single()

  if (error) {
    console.error('[notificationService] createNotification error:', error.message)
    throw error
  }

  return normalizeNotificationRow(data)
}

async function fetchNotificationsForUser(userId) {
  const normalizedUserId = typeof userId === 'string' ? userId.trim() : ''

  if (!normalizedUserId) {
    return []
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('id, receiver_id, sender_id, type, message, is_read, created_at')
    .eq('receiver_id', normalizedUserId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[notificationService] fetchNotificationsForUser error:', error.message)
    throw error
  }

  return sortNotificationsLatestFirst((data ?? []).map(normalizeNotificationRow))
}

async function markNotificationAsRead(notificationId) {
  const normalizedNotificationId = typeof notificationId === 'string' ? notificationId.trim() : ''

  if (!normalizedNotificationId) {
    return null
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', normalizedNotificationId)
    .select('id, receiver_id, sender_id, type, message, is_read, created_at')
    .single()

  if (error) {
    console.error('[notificationService] markNotificationAsRead error:', error.message)
    throw error
  }

  return normalizeNotificationRow(data)
}

async function markAllNotificationsAsRead(userId) {
  const normalizedUserId = typeof userId === 'string' ? userId.trim() : ''

  if (!normalizedUserId) {
    return
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('receiver_id', normalizedUserId)
    .eq('is_read', false)

  if (error) {
    console.error('[notificationService] markAllNotificationsAsRead error:', error.message)
    throw error
  }
}

async function getUnreadNotificationCount(userId) {
  const normalizedUserId = typeof userId === 'string' ? userId.trim() : ''

  if (!normalizedUserId) {
    return 0
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', normalizedUserId)
    .eq('is_read', false)

  if (error) {
    console.error('[notificationService] getUnreadNotificationCount error:', error.message)
    throw error
  }

  return count ?? 0
}

/* Relative timestamp helper (used by the UI) */
function formatNotifTimestamp(isoString) {
  if (!isoString) return ''

  const diff = Date.now() - new Date(isoString).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)

  if (mins  <  1) return 'just now'
  if (mins  < 60) return `${mins} min ago`
  if (hours < 24) return `${hours} hr ago`
  if (days  <  7) return `${days}d ago`
  return new Date(isoString).toLocaleDateString()
}

export {
  createNotification,
  fetchNotificationsForUser,
  formatNotifTimestamp,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  normalizeNotificationRow,
}

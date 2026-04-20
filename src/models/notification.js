const NOTIFICATION_TYPES = ['support', 'follow', 'like', 'system']

/**
 * @typedef {'support'|'follow'|'like'|'system'} NotificationType
 * @typedef {{
 *   id: string,
 *   receiverId: string,
 *   senderId: string | null,
 *   type: NotificationType,
 *   message: string,
 *   isRead: boolean,
 *   createdAt: string,
 * }} Notification
 */

function isNotificationType(value) {
  return NOTIFICATION_TYPES.includes(value)
}

function normalizeNotification(rawNotification = {}) {
  const normalizedCreatedAt = typeof rawNotification.createdAt === 'string'
    && !Number.isNaN(Date.parse(rawNotification.createdAt))
    ? rawNotification.createdAt
    : new Date().toISOString()

  return {
    id: typeof rawNotification.id === 'string' && rawNotification.id.trim()
      ? rawNotification.id
      : '',
    receiverId: typeof rawNotification.receiverId === 'string'
      ? rawNotification.receiverId.trim()
      : '',
    senderId: typeof rawNotification.senderId === 'string' && rawNotification.senderId.trim()
      ? rawNotification.senderId.trim()
      : null,
    type: isNotificationType(rawNotification.type) ? rawNotification.type : 'system',
    message: typeof rawNotification.message === 'string' ? rawNotification.message.trim() : '',
    isRead: Boolean(rawNotification.isRead),
    createdAt: normalizedCreatedAt,
  }
}

function sortNotificationsLatestFirst(notifications) {
  return [...notifications].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )
}

export {
  NOTIFICATION_TYPES,
  normalizeNotification,
  sortNotificationsLatestFirst,
}

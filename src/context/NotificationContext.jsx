import { createContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import supabase from '../services/supabase.js'

const defaultNotificationContextValue = {
  error: null,
  loading: false,
  markAllAsRead: async () => false,
  notifications: [],
  refreshNotifications: async () => [],
  unreadCount: 0,
}

const NotificationContext = createContext(defaultNotificationContextValue)

function NotificationProvider({ children }) {
  const { user, loading } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState(null)

  const userId = user?.id ?? ''
  const unreadCount = notifications.filter((notification) => !notification.is_read).length

  useEffect(() => {
    let isMounted = true

    if (loading) {
      return () => {
        isMounted = false
      }
    }

    if (!userId) {
      setNotifications([])
      setError(null)
      return () => {
        isMounted = false
      }
    }

    const loadNotifications = async () => {
      setIsFetching(true)

      try {
        const { data, error: fetchError } = await supabase
          .from('notifications')
          .select('*')
          .eq('receiver_id', userId)
          .order('created_at', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        if (!isMounted) {
          return
        }

        setNotifications(Array.isArray(data) ? data : [])
        setError(null)
      } catch (nextError) {
        console.error('[NotificationProvider] initial load failed:', nextError)

        if (!isMounted) {
          return
        }

        setNotifications([])
        setError('Unable to load notifications')
      } finally {
        if (isMounted) {
          setIsFetching(false)
        }
      }
    }

    void loadNotifications()

    return () => {
      isMounted = false
    }
  }, [loading, userId])

  useEffect(() => {
    if (!userId) {
      return undefined
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((currentNotifications) => {
            const insertedNotification = payload.new

            return [
              insertedNotification,
              ...currentNotifications.filter(
                (notification) => notification.id !== insertedNotification.id
              ),
            ]
          })
          setError(null)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  const refreshNotifications = async () => {
    if (!userId) {
      setNotifications([])
      return []
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      const nextNotifications = Array.isArray(data) ? data : []
      setNotifications(nextNotifications)
      setError(null)
      return nextNotifications
    } catch (nextError) {
      console.error('[NotificationProvider] refresh failed:', nextError)
      setError('Unable to load notifications')
      return []
    }
  }

  const markNotificationsAsRead = async () => {
    if (!userId || unreadCount === 0) {
      return true
    }

    const previousNotifications = notifications
    setNotifications((currentNotifications) => currentNotifications.map((notification) => ({
      ...notification,
      is_read: true,
    })))

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('receiver_id', userId)
        .eq('is_read', false)

      if (updateError) {
        throw updateError
      }

      setError(null)
      return true
    } catch (nextError) {
      console.error('[NotificationProvider] markAllAsRead failed:', nextError)
      setNotifications(previousNotifications)
      setError('Unable to load notifications')
      return false
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        error,
        loading: loading || isFetching,
        markAllAsRead: markNotificationsAsRead,
        notifications,
        refreshNotifications,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export { NotificationContext, NotificationProvider }

import { useContext } from 'react'
import { NotificationContext } from '../context/NotificationContext.jsx'

function useNotifications() {
  return useContext(NotificationContext)
}

export default useNotifications

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getCreatorSupportScope,
  getCreatorSupportSummary,
  subscribeToCreatorSupportUpdates,
} from '../services/supportService.js'

function useCreatorSupporters(username) {
  const scope = getCreatorSupportScope(username)
  const [supporters, setSupporters] = useState([])

  const reloadSupporters = useCallback(() => {
    if (!scope) {
      setSupporters([])
      return
    }

    setSupporters(getCreatorSupportSummary(scope).supporters)
  }, [scope])

  useEffect(() => {
    reloadSupporters()
  }, [reloadSupporters])

  useEffect(() => {
    if (!scope) {
      return undefined
    }

    return subscribeToCreatorSupportUpdates(scope, reloadSupporters)
  }, [scope, reloadSupporters])

  const totalSupporters = supporters.length
  const totalAmount = useMemo(
    () => supporters.reduce((sum, supporter) => sum + (supporter.amount || 0), 0),
    [supporters]
  )

  return {
    recentSupporters: supporters.slice(0, 5),
    reloadSupporters,
    supporters,
    totalAmount,
    totalSupporters,
  }
}

export default useCreatorSupporters

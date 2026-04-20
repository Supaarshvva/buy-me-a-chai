import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  computeSupportSummary,
  fetchCreatorSupportsPublic,
} from '../services/supportService.js'

/**
 * Hook to fetch and manage supporter data for a creator from Supabase.
 * Uses the RPC function (bypasses RLS) so it works on public pages
 * where the viewer is NOT the creator. Falls back to direct query
 * on the dashboard where the viewer IS the creator.
 */
function useCreatorSupporters(creatorId) {
  const [supporters, setSupporters] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const reloadSupporters = useCallback(async () => {
    if (!creatorId) {
      setSupporters([])
      return
    }

    setIsLoading(true)

    try {
      const data = await fetchCreatorSupportsPublic(creatorId)
      setSupporters(data)
    } catch (error) {
      console.error('[useCreatorSupporters] fetch error:', error)
      setSupporters([])
    } finally {
      setIsLoading(false)
    }
  }, [creatorId])

  useEffect(() => {
    reloadSupporters()
  }, [reloadSupporters])

  const { totalSupporters, totalAmount } = useMemo(
    () => computeSupportSummary(supporters),
    [supporters]
  )

  return {
    isLoading,
    recentSupporters: supporters.slice(0, 5),
    reloadSupporters,
    supporters,
    totalAmount,
    totalSupporters,
  }
}

export default useCreatorSupporters

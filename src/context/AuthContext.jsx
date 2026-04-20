import { createContext, useContext, useEffect, useState } from 'react'
import supabase from '../services/supabase.js'

const AuthContext = createContext(undefined)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  const refreshProfile = async (targetUser = user) => {
    if (!targetUser) {
      setProfile(null)
      setProfileLoading(false)
      return null
    }

    setProfileLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, bio, avatar_url, account_type, upi_id')
      .eq('id', targetUser.id)
      .maybeSingle()

    console.log('AuthContext profile check user:', targetUser)
    console.log('AuthContext profile check profile:', data ?? null)
    console.log('AuthContext profile check error:', error ?? null)

    setProfile(data ?? null)
    setProfileLoading(false)

    return data ?? null
  }

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      console.log('AuthContext session user:', session?.user ?? null)

      if (isMounted) {
        setProfileLoading(Boolean(session?.user))
        setUser(session?.user ?? null)
        setAuthLoading(false)
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('AuthContext auth change user:', session?.user ?? null)

      if (isMounted) {
        setProfileLoading(Boolean(session?.user))
        setUser(session?.user ?? null)
        setAuthLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      if (!user) {
        if (isMounted) {
          setProfile(null)
          setProfileLoading(false)
        }
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, bio, avatar_url, account_type, upi_id')
        .eq('id', user.id)
        .maybeSingle()

      console.log('AuthContext profile check user:', user)
      console.log('AuthContext profile check profile:', data ?? null)
      console.log('AuthContext profile check error:', error ?? null)

      if (isMounted) {
        setProfile(data ?? null)
        setProfileLoading(false)
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [user])

  const loading = authLoading || profileLoading

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

export { AuthProvider, useAuth }

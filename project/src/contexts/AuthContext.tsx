'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, getDisplayRank } from '@/lib/supabase'

interface Profile {
  id: string
  name: string
  rating_points: number
  last_rank_reached: string
  games_at_last_rank_change: number
  total_games_played: number
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  getDisplayRank: () => string
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  console.log('AuthProvider render - user:', !!user, 'profile:', !!profile, 'loading:', loading)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes - IMPORTANT: No async Supabase calls in this callback!
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, !!session?.user)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Use setTimeout to avoid deadlock as per Supabase docs
          setTimeout(() => {
            fetchProfile(session.user.id)
          }, 0)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const signOut = async () => {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] === SIGNOUT FUNCTION CALLED ===`)
    console.log(`[${timestamp}] Current user:`, !!user, user?.id)
    
    try {
      console.log(`[${timestamp}] Calling supabase.auth.signOut()...`)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error(`[${timestamp}] Error signing out:`, error)
      } else {
        console.log(`[${timestamp}] Sign out successful`)
      }
    } catch (error) {
      console.error(`[${timestamp}] Unexpected error during sign out:`, error)
    }
    
    console.log(`[${timestamp}] === SIGNOUT FUNCTION COMPLETED ===`)
  }

  const getDisplayRankForProfile = () => {
    if (!profile) return '15k'
    return getDisplayRank(profile)
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signOut,
    getDisplayRank: getDisplayRankForProfile,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 
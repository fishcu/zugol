'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, getDisplayRank } from '@/lib/supabase'

interface Profile {
  id: string
  name: string
  rating_points: number
  last_rank_reached: string
  games_since_last_rank_change: number
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
  const currentUserIdRef = useRef<string | null>(null)

  // Update ref whenever user changes
  useEffect(() => {
    currentUserIdRef.current = user?.id ?? null
  }, [user])

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
        // Only update if the user actually changed
        const newUserId = session?.user?.id ?? null
        const currentUserId = currentUserIdRef.current
        
        if (newUserId !== currentUserId) {
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
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Unexpected error during sign out:', error)
    }
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
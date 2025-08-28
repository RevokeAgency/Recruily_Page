"use client"

import { useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseClient } from "../lib/supabase-client"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = getSupabaseClient()

  useEffect(() => {
    // Get the current session
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          setError(error)
        }

        setSession(session)
        setUser(session?.user ?? null)
      } catch (err) {
        console.error("Unexpected error in getSession:", err)
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })

      return () => {
        subscription.unsubscribe()
      }
    } catch (err) {
      console.error("Error setting up auth listener:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
      setLoading(false)
      return () => {}
    }
  }, [supabase])

  const signIn = async (email: string) => {
    try {
      setError(null)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      return { success: true }
    } catch (err) {
      console.error("Sign in error:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
      throw err
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      return { success: true }
    } catch (err) {
      console.error("Sign out error:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
      throw err
    }
  }

  return {
    user,
    session,
    loading,
    error,
    signIn,
    signOut,
  }
}

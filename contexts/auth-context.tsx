"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import { isSupabaseConfigured } from "@/lib/env"
import { sendConfirmationEmail } from "@/lib/email-service"

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ success?: boolean; error?: string }>
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ success?: boolean; error?: string; requiresConfirmation?: boolean }>
  signOut: () => Promise<void>
  isPreviewMode: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ─── localStorage helpers (used only in demo/fallback mode) ───────────────────

const getStoredUsers = (): any[] => {
  try {
    const users = localStorage.getItem("recruitify-users")
    return users ? JSON.parse(users) : []
  } catch {
    return []
  }
}

const storeUser = (user: any) => {
  try {
    const users = getStoredUsers()
    const existingIndex = users.findIndex((u) => u.email === user.email)
    if (existingIndex >= 0) {
      users[existingIndex] = user
    } else {
      users.push(user)
    }
    localStorage.setItem("recruitify-users", JSON.stringify(users))
  } catch {
    // ignore
  }
}

const findUserByEmail = (email: string): any | null => {
  const users = getStoredUsers()
  return users.find((u) => u.email === email) || null
}

const validateCredentials = (email: string): { valid: boolean; user?: any; error?: string } => {
  const user = findUserByEmail(email)
  if (!user) return { valid: false, error: "Invalid email or password" }
  if (!user.emailConfirmed) {
    return {
      valid: false,
      error: "Please confirm your email address before logging in. Check your inbox for a confirmation email.",
    }
  }
  return { valid: true, user }
}

const createDefaultOfficeAccount = () => {
  try {
    const users = getStoredUsers()
    const officeUser = users.find((u: any) => u.email === "office@example.com")
    if (!officeUser) {
      users.push({
        id: "office-user-confirmed",
        email: "office@example.com",
        name: "Office User",
        emailConfirmed: true,
        createdAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
      })
      localStorage.setItem("recruitify-users", JSON.stringify(users))
    } else if (!officeUser.emailConfirmed) {
      officeUser.emailConfirmed = true
      officeUser.confirmedAt = new Date().toISOString()
      localStorage.setItem("recruitify-users", JSON.stringify(users))
    }
  } catch {
    // ignore
  }
}

// ─── AuthProvider ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const isPreviewMode =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("v0.dev") || window.location.hostname.includes("vercel-v0-preview"))

  // Fetch the user's organisation and attach org_id to app_metadata locally
  const fetchOrgAndAugmentUser = async (supabaseUser: User): Promise<User> => {
    try {
      const { data: org } = await (supabase as any)
        .from("organisations")
        .select("id")
        .eq("owner_id", supabaseUser.id)
        .single()

      if (org?.id) {
        return {
          ...supabaseUser,
          app_metadata: {
            ...supabaseUser.app_metadata,
            org_id: org.id,
          },
        }
      }
    } catch (err) {
      console.warn("⚠️ Could not fetch organisation for user:", err)
    }
    return supabaseUser
  }

  // ─── Session initialisation ───────────────────────────────────────────────

  useEffect(() => {
    // Preview mode: fully mocked session
    if (isPreviewMode) {
      const mockUser = {
        id: "preview-user-id",
        email: "preview@example.com",
        user_metadata: { name: "Preview User" },
        app_metadata: { org_id: "preview-org-id" },
      } as unknown as User

      setUser(mockUser)
      setSession({
        access_token: "mock-token",
        refresh_token: "mock-refresh-token",
        expires_at: Date.now() + 3600,
        user: mockUser,
      } as Session)
      setLoading(false)

      try {
        document.cookie = `auth-session=preview-${mockUser.id}; path=/; max-age=3600; samesite=strict`
      } catch {
        // ignore
      }
      return
    }

    // Real Supabase mode
    if (isSupabaseConfigured()) {
      // Subscribe to auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          if (newSession?.user) {
            const augmented = await fetchOrgAndAugmentUser(newSession.user)
            setUser(augmented)
            setSession(newSession)
            try {
              document.cookie = `auth-session=sb-${augmented.id}; path=/; max-age=3600; samesite=strict`
            } catch {
              // ignore
            }
          } else {
            setUser(null)
            setSession(null)
            try {
              document.cookie = "auth-session=; path=/; max-age=0; samesite=strict"
            } catch {
              // ignore
            }
          }
          setLoading(false)
        }
      )

      // Load existing session on mount
      supabase.auth.getSession().then(async ({ data: { session: existing } }) => {
        if (existing?.user) {
          const augmented = await fetchOrgAndAugmentUser(existing.user)
          setUser(augmented)
          setSession(existing)
          try {
            document.cookie = `auth-session=sb-${augmented.id}; path=/; max-age=3600; samesite=strict`
          } catch {
            // ignore
          }
        }
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    }

    // Demo/fallback mode: localStorage-based auth
    createDefaultOfficeAccount()
    const initDemoAuth = async () => {
      try {
        const raw = localStorage.getItem("recruitify-current-user")
        if (raw) {
          const parsed = JSON.parse(raw)
          const stored = findUserByEmail(parsed.email)
          if (stored?.emailConfirmed) {
            setUser(parsed)
            setSession({
              access_token: "local-token",
              refresh_token: "local-refresh",
              expires_at: Date.now() + 3600,
              user: parsed,
            } as Session)
            try {
              document.cookie = `auth-session=demo-${parsed.id}; path=/; max-age=3600; samesite=strict`
            } catch {
              // ignore
            }
          } else {
            localStorage.removeItem("recruitify-current-user")
          }
        }
      } catch (err) {
        console.error("Error initializing demo auth:", err)
      } finally {
        setLoading(false)
      }
    }
    initDemoAuth()
  }, [isPreviewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── signUp ───────────────────────────────────────────────────────────────

  const signUp = async (email: string, password: string, name: string) => {
    setError(null)
    setLoading(true)

    try {
      // Preview mode
      if (isPreviewMode) {
        const mockUser = {
          id: "preview-user-id",
          email,
          user_metadata: { name },
          app_metadata: { org_id: "preview-org-id" },
        } as unknown as User

        setUser(mockUser)
        setSession({
          access_token: "mock-token",
          refresh_token: "mock-refresh-token",
          expires_at: Date.now() + 3600,
          user: mockUser,
        } as Session)
        await new Promise((r) => setTimeout(r, 500))
        return { success: true }
      }

      // Real Supabase signup
      if (isSupabaseConfigured()) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              company_name: name,
              full_name: name,
            },
          },
        })

        if (signUpError) {
          return { error: signUpError.message }
        }

        if (!data.user) {
          return { error: "Signup failed — no user returned" }
        }

        console.log("✅ Supabase auth.signUp succeeded:", data.user.id)

        // Create organisation record
        const { data: org, error: orgError } = await (supabase as any)
          .from("organisations")
          .insert({ name, owner_id: data.user.id })
          .select()
          .single()

        if (orgError) {
          // Non-fatal: org creation failed but user account exists
          console.warn("⚠️ Could not create organisation:", orgError.message)
        } else {
          console.log("✅ Organisation created:", org.id)
        }

        // Supabase will send its own confirmation email (if configured)
        // Return confirmation required so UI shows the right screen
        return { success: true, requiresConfirmation: true }
      }

      // Demo/fallback: localStorage signup
      const existingUser = findUserByEmail(email)
      if (existingUser) {
        return { error: "An account with this email already exists" }
      }

      const newUser = {
        id: `user-${Date.now()}`,
        email,
        name,
        emailConfirmed: false,
        createdAt: new Date().toISOString(),
      }
      storeUser(newUser)

      const emailResult = await sendConfirmationEmail(email, name)
      if (!emailResult.success) {
        return { error: emailResult.error || "Failed to send confirmation email" }
      }

      return { success: true, requiresConfirmation: true }
    } catch (err: any) {
      console.error("Sign up error:", err)
      setError(err.message || "Failed to sign up")
      return { error: err.message || "Failed to sign up" }
    } finally {
      setLoading(false)
    }
  }

  // ─── signIn ───────────────────────────────────────────────────────────────

  const signIn = async (email: string, password: string) => {
    setError(null)
    setLoading(true)

    try {
      // Preview mode
      if (isPreviewMode) {
        const mockUser = {
          id: "preview-user-id",
          email,
          user_metadata: { name: "Preview User" },
          app_metadata: { org_id: "preview-org-id" },
        } as unknown as User

        setUser(mockUser)
        setSession({
          access_token: "mock-token",
          refresh_token: "mock-refresh-token",
          expires_at: Date.now() + 3600,
          user: mockUser,
        } as Session)

        try {
          localStorage.setItem("recruitify-current-user", JSON.stringify(mockUser))
          document.cookie = `auth-session=preview-${mockUser.id}; path=/; max-age=3600; samesite=strict`
        } catch {
          // ignore
        }

        await new Promise((r) => setTimeout(r, 500))
        return { success: true }
      }

      // Real Supabase login
      if (isSupabaseConfigured()) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          return { error: signInError.message }
        }

        if (!data.user) {
          return { error: "Sign in failed" }
        }

        // onAuthStateChange will fire and set user + session automatically
        console.log("✅ Supabase signIn succeeded")
        return { success: true }
      }

      // Demo/fallback: localStorage login
      createDefaultOfficeAccount()
      const validation = validateCredentials(email)
      if (!validation.valid) {
        return { error: validation.error }
      }

      const registeredUser = validation.user
      const authenticatedUser = {
        id: registeredUser.id,
        email: registeredUser.email,
        user_metadata: { name: registeredUser.name },
        app_metadata: { org_id: `demo-org-${registeredUser.id}` },
      } as unknown as User

      setUser(authenticatedUser)
      setSession({
        access_token: "demo-token",
        refresh_token: "demo-refresh",
        expires_at: Date.now() + 3600,
        user: authenticatedUser,
      } as Session)

      try {
        localStorage.setItem("recruitify-current-user", JSON.stringify(authenticatedUser))
        document.cookie = `auth-session=demo-${authenticatedUser.id}; path=/; max-age=3600; samesite=strict`
      } catch {
        // ignore
      }

      return { success: true }
    } catch (err: any) {
      console.error("Sign in error:", err)
      setError(err.message || "Failed to sign in")
      return { error: err.message || "Failed to sign in" }
    } finally {
      setLoading(false)
    }
  }

  // ─── signOut ──────────────────────────────────────────────────────────────

  const signOut = async () => {
    setError(null)

    try {
      if (isSupabaseConfigured() && !isPreviewMode) {
        await supabase.auth.signOut()
        // onAuthStateChange handles clearing user/session
      } else {
        setUser(null)
        setSession(null)
        try {
          localStorage.removeItem("recruitify-current-user")
          document.cookie = "auth-session=; path=/; max-age=0; samesite=strict"
        } catch {
          // ignore
        }
      }

      router.push("/")
    } catch (err: any) {
      console.error("Sign out error:", err)
      setError(err.message || "Failed to sign out")
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, session, loading, error, signIn, signUp, signOut, isPreviewMode }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User, Session } from "@supabase/supabase-js"
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

// Helper functions for user management
const getStoredUsers = (): any[] => {
  try {
    const users = localStorage.getItem("recruitify-users")
    return users ? JSON.parse(users) : []
  } catch (err) {
    console.error("Error getting stored users:", err)
    return []
  }
}

const storeUser = (user: any) => {
  try {
    const users = getStoredUsers()
    const existingUserIndex = users.findIndex((u) => u.email === user.email)

    if (existingUserIndex >= 0) {
      users[existingUserIndex] = user
    } else {
      users.push(user)
    }

    localStorage.setItem("recruitify-users", JSON.stringify(users))
  } catch (err) {
    console.error("Error storing user:", err)
  }
}

const findUserByEmail = (email: string): any | null => {
  const users = getStoredUsers()
  return users.find((user) => user.email === email) || null
}

const validateCredentials = (email: string, password: string): { valid: boolean; user?: any; error?: string } => {
  const user = findUserByEmail(email)

  if (!user) {
    return { valid: false, error: "Invalid email or password" }
  }

  if (user.password !== password) {
    return { valid: false, error: "Invalid email or password" }
  }

  if (!user.emailConfirmed) {
    return {
      valid: false,
      error: "Please confirm your email address before logging in. Check your inbox for a confirmation email.",
    }
  }

  return { valid: true, user }
}

// Create the default office@example.com account
const createDefaultOfficeAccount = () => {
  try {
    const users = getStoredUsers()
    const officeUser = users.find((u) => u.email === "office@example.com")

    if (!officeUser) {
      const defaultUser = {
        id: "office-user-confirmed",
        email: "office@example.com",
        password: "password123",
        name: "Office User",
        emailConfirmed: true,
        createdAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
      }

      users.push(defaultUser)
      localStorage.setItem("recruitify-users", JSON.stringify(users))
      console.log("✅ Created default office@example.com account")
      return defaultUser
    } else if (!officeUser.emailConfirmed) {
      // Ensure it's confirmed
      officeUser.emailConfirmed = true
      officeUser.confirmedAt = new Date().toISOString()
      localStorage.setItem("recruitify-users", JSON.stringify(users))
      console.log("✅ Confirmed existing office@example.com account")
    }

    return officeUser
  } catch (error) {
    console.error("Error creating default office account:", error)
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check if we're in preview mode (v0.dev or vercel preview)
  const isPreviewMode =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("v0.dev") || window.location.hostname.includes("vercel-v0-preview"))

  useEffect(() => {
    // Create default office account on initialization
    createDefaultOfficeAccount()

    // Skip auth checks in preview mode
    if (isPreviewMode) {
      setLoading(false)
      // Set a mock user for preview
      const mockUser = {
        id: "preview-user-id",
        email: "preview@example.com",
        user_metadata: {
          name: "Preview User",
        },
      } as User

      const mockSession = {
        access_token: "mock-token",
        refresh_token: "mock-refresh-token",
        expires_at: Date.now() + 3600,
        user: mockUser,
      } as Session

      setUser(mockUser)
      setSession(mockSession)
      return
    }

    // For non-preview mode, attempt to initialize auth
    const initAuth = async () => {
      try {
        // Try to get current user from localStorage
        const currentUser = localStorage.getItem("recruitify-current-user")
        if (currentUser) {
          const parsedUser = JSON.parse(currentUser)

          // Verify the user still exists in our user store and is confirmed
          const storedUser = findUserByEmail(parsedUser.email)
          if (storedUser && storedUser.emailConfirmed) {
            setUser(parsedUser)

            // Create a simple session object
            setSession({
              access_token: "local-token",
              refresh_token: "local-refresh",
              expires_at: Date.now() + 3600,
              user: parsedUser,
            } as Session)
          } else {
            // User no longer exists or not confirmed, clear current user
            localStorage.removeItem("recruitify-current-user")
          }
        }
      } catch (err) {
        console.error("Error initializing auth:", err)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [isPreviewMode])

  const signIn = async (email: string, password: string) => {
    setError(null)
    setLoading(true)

    try {
      console.log("🔐 Attempting to sign in:", { email })

      if (isPreviewMode) {
        // Mock sign in for preview
        const mockUser = {
          id: "preview-user-id",
          email: email,
          user_metadata: {
            name: "Preview User",
          },
        } as User

        setUser(mockUser)
        setSession({
          access_token: "mock-token",
          refresh_token: "mock-refresh-token",
          expires_at: Date.now() + 3600,
          user: mockUser,
        } as Session)

        // Store in localStorage for persistence
        try {
          localStorage.setItem("recruitify-current-user", JSON.stringify(mockUser))
        } catch (err) {
          console.error("Error storing user in localStorage:", err)
        }

        // Simulate a delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        return { success: true }
      }

      // Ensure office account exists before validation
      createDefaultOfficeAccount()

      // Debug: Log all users
      const allUsers = getStoredUsers()
      console.log("📋 All stored users:", allUsers)

      // Validate credentials against stored users
      const validation = validateCredentials(email, password)
      console.log("🔍 Validation result:", validation)

      if (!validation.valid) {
        console.log("❌ Validation failed:", validation.error)
        return { error: validation.error }
      }

      // Get the registered user data
      const registeredUser = validation.user
      console.log("✅ User found:", registeredUser)

      const authenticatedUser = {
        id: registeredUser.id,
        email: registeredUser.email,
        user_metadata: {
          name: registeredUser.name,
        },
      } as User

      setUser(authenticatedUser)
      setSession({
        access_token: "demo-token",
        refresh_token: "demo-refresh",
        expires_at: Date.now() + 3600,
        user: authenticatedUser,
      } as Session)

      // Store current user in localStorage
      try {
        localStorage.setItem("recruitify-current-user", JSON.stringify(authenticatedUser))
      } catch (storageErr) {
        console.error("Error storing current user:", storageErr)
      }

      console.log("🎉 Sign in successful!")
      return { success: true }
    } catch (err: any) {
      console.error("Sign in error:", err)
      setError(err.message || "Failed to sign in")
      return { error: err.message || "Failed to sign in" }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    setError(null)
    setLoading(true)

    try {
      // Check if user already exists
      const existingUser = findUserByEmail(email)
      if (existingUser) {
        return { error: "An account with this email already exists" }
      }

      if (isPreviewMode) {
        // Mock sign up for preview
        const mockUser = {
          id: "preview-user-id",
          email: email,
          user_metadata: {
            name: name,
          },
        } as User

        setUser(mockUser)
        setSession({
          access_token: "mock-token",
          refresh_token: "mock-refresh-token",
          expires_at: Date.now() + 3600,
          user: mockUser,
        } as Session)

        // Store in localStorage for persistence
        try {
          localStorage.setItem("recruitify-current-user", JSON.stringify(mockUser))
        } catch (err) {
          console.error("Error storing user in localStorage:", err)
        }

        // Simulate a delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        return { success: true }
      }

      // Create new user (unconfirmed)
      const newUser = {
        id: `user-${Date.now()}`,
        email: email,
        password: password, // In production, this should be hashed
        name: name,
        emailConfirmed: false,
        createdAt: new Date().toISOString(),
      }

      // Store the user in our user database
      storeUser(newUser)

      // Send confirmation email
      const emailResult = await sendConfirmationEmail(email, name)

      if (!emailResult.success) {
        return { error: emailResult.error || "Failed to send confirmation email" }
      }

      // Don't log the user in automatically - they need to confirm email first
      return {
        success: true,
        requiresConfirmation: true,
      }
    } catch (err: any) {
      console.error("Sign up error:", err)
      setError(err.message || "Failed to sign up")
      return { error: err.message || "Failed to sign up" }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setError(null)

    try {
      setUser(null)
      setSession(null)

      // Remove current user from localStorage (but keep the user database)
      try {
        localStorage.removeItem("recruitify-current-user")
      } catch (err) {
        console.error("Error removing current user from localStorage:", err)
      }

      // Redirect to home page
      router.push("/")
    } catch (err: any) {
      console.error("Sign out error:", err)
      setError(err.message || "Failed to sign out")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        isPreviewMode,
      }}
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

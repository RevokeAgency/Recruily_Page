"use client"

// This file provides mock authentication for preview environments
// without using React hooks

// Store the mock user in memory
let mockUser: any = null

export function getMockUser() {
  // Try to get from localStorage first if available
  if (typeof window !== "undefined") {
    try {
      const storedUser = localStorage.getItem("recruitify-mock-user")
      if (storedUser) {
        mockUser = JSON.parse(storedUser)
      }
    } catch (e) {
      console.error("Error reading from localStorage:", e)
    }
  }
  return mockUser
}

export function setMockUser(user: any) {
  mockUser = user
  // Also store in localStorage if available
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("recruitify-mock-user", JSON.stringify(user))
    } catch (e) {
      console.error("Error writing to localStorage:", e)
    }
  }
}

export function clearMockUser() {
  mockUser = null
  // Also clear from localStorage if available
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("recruitify-mock-user")
    } catch (e) {
      console.error("Error clearing localStorage:", e)
    }
  }
}

export function mockSignIn(email: string, password: string) {
  // Create a mock user
  const user = {
    id: "mock-user-id",
    email,
    name: email.split("@")[0],
    role: "user",
  }

  // Store the mock user
  setMockUser(user)

  return { success: true, user }
}

export function mockSignOut() {
  clearMockUser()
  return { success: true }
}

export function isPreviewEnvironment() {
  if (typeof window === "undefined") return false

  return (
    window.location.hostname.includes("v0.dev") ||
    window.location.hostname.includes("vercel-v0-preview") ||
    process.env.NODE_ENV === "development"
  )
}

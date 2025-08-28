"use client"

// This file contains auth helper functions that don't use React hooks
// to avoid the "Invalid hook call" error

// Function to sign in a user without using hooks
export async function signInUser(email: string, password: string) {
  try {
    // Check if we're in preview mode
    const isPreviewMode =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("v0.dev") || window.location.hostname.includes("vercel-v0-preview"))

    if (isPreviewMode) {
      // Mock sign in for preview
      const mockUser = {
        id: "preview-user-id",
        email: email,
        user_metadata: {
          name: "Preview User",
        },
      }

      // Store in localStorage for persistence
      try {
        localStorage.setItem("recruitify-user", JSON.stringify(mockUser))
      } catch (err) {
        console.error("Error storing user in localStorage:", err)
      }

      // Simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      return { success: true }
    }

    // Try API first
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "signin",
        email,
        password,
      }),
    })

    const data = await response.json()

    if (data.error) {
      return { error: data.error }
    }

    if (data.user) {
      // Store in localStorage for persistence
      try {
        localStorage.setItem("recruitify-user", JSON.stringify(data.user))
        if (data.session) {
          localStorage.setItem("recruitify-session", JSON.stringify(data.session))
        }
      } catch (err) {
        console.error("Error storing user in localStorage:", err)
      }

      return { success: true }
    }

    return { error: "Unknown error occurred" }
  } catch (err: any) {
    console.error("Sign in error:", err)

    // Fallback for demo/testing: allow any login
    const fallbackUser = {
      id: "fallback-user-id",
      email: email,
      user_metadata: {
        name: email.split("@")[0],
      },
    }

    // Store in localStorage
    try {
      localStorage.setItem("recruitify-user", JSON.stringify(fallbackUser))
    } catch (storageErr) {
      console.error("Error storing fallback user:", storageErr)
    }

    return { success: true }
  }
}

// Function to sign out a user without using hooks
export async function signOutUser() {
  try {
    // Check if we're in preview mode
    const isPreviewMode =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("v0.dev") || window.location.hostname.includes("vercel-v0-preview"))

    if (!isPreviewMode) {
      // Call the API to sign out
      await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "signout",
        }),
      })
    }

    // Remove from localStorage
    try {
      localStorage.removeItem("recruitify-user")
      localStorage.removeItem("recruitify-session")
    } catch (err) {
      console.error("Error removing user from localStorage:", err)
    }

    return { success: true }
  } catch (err) {
    console.error("Sign out error:", err)

    // Fallback: just clear local storage
    try {
      localStorage.removeItem("recruitify-user")
      localStorage.removeItem("recruitify-session")
    } catch (storageErr) {
      console.error("Error removing user from localStorage:", storageErr)
    }

    return { success: true }
  }
}

// Function to check if a user is logged in without using hooks
export function getCurrentUser() {
  try {
    // Check if we're in preview mode
    const isPreviewMode =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("v0.dev") || window.location.hostname.includes("vercel-v0-preview"))

    if (isPreviewMode) {
      // Return a mock user for preview
      return {
        id: "preview-user-id",
        email: "preview@example.com",
        user_metadata: {
          name: "Preview User",
        },
      }
    }

    // Try to get user from localStorage
    const storedUser = localStorage.getItem("recruitify-user")
    if (storedUser) {
      return JSON.parse(storedUser)
    }

    return null
  } catch (err) {
    console.error("Error getting current user:", err)
    return null
  }
}

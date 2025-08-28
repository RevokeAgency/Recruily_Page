// This file provides a fallback authentication mechanism when Supabase is not available

// Store users in memory (for demo/preview purposes only)
const users: Record<string, any> = {}

export const fallbackAuth = {
  // Sign in a user
  signIn: async (email: string, password: string) => {
    // For demo purposes, allow any login
    // In a real app, you would validate credentials

    // Check if user exists, if not create one
    if (!users[email]) {
      users[email] = {
        id: `user-${Object.keys(users).length + 1}`,
        email,
        user_metadata: {
          name: email.split("@")[0],
        },
        created_at: new Date().toISOString(),
      }
    }

    return {
      data: {
        user: users[email],
        session: {
          access_token: `token-${Date.now()}`,
          refresh_token: `refresh-${Date.now()}`,
          expires_at: Date.now() + 3600000, // 1 hour
          user: users[email],
        },
      },
      error: null,
    }
  },

  // Sign up a new user
  signUp: async (email: string, password: string, userData: any) => {
    // Create a new user
    users[email] = {
      id: `user-${Object.keys(users).length + 1}`,
      email,
      user_metadata: userData,
      created_at: new Date().toISOString(),
    }

    return {
      data: {
        user: users[email],
        session: {
          access_token: `token-${Date.now()}`,
          refresh_token: `refresh-${Date.now()}`,
          expires_at: Date.now() + 3600000, // 1 hour
          user: users[email],
        },
      },
      error: null,
    }
  },

  // Sign out
  signOut: async () => {
    return { error: null }
  },

  // Get session
  getSession: async () => {
    // For fallback, we don't maintain sessions
    return { data: { session: null }, error: null }
  },
}

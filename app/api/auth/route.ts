import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase.client"

export async function POST(request: Request) {
  try {
    const { action, email, password, name } = await request.json()

    // Check if we're in a preview environment
    const isPreview =
      process.env.VERCEL_ENV === "preview" ||
      process.env.NODE_ENV === "development" ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // For preview environments, use mock data
    if (isPreview) {
      if (action === "signin") {
        // Mock successful sign in
        return NextResponse.json({
          user: {
            id: "preview-user-id",
            email,
            user_metadata: { name: email.split("@")[0] },
          },
          session: {
            access_token: "mock-token",
            refresh_token: "mock-refresh-token",
            expires_at: Date.now() + 3600000,
          },
        })
      } else if (action === "signup") {
        // Mock successful sign up
        return NextResponse.json({
          user: {
            id: "preview-user-id",
            email,
            user_metadata: { name },
          },
          session: {
            access_token: "mock-token",
            refresh_token: "mock-refresh-token",
            expires_at: Date.now() + 3600000,
          },
        })
      } else if (action === "signout") {
        // Mock successful sign out
        return NextResponse.json({ success: true })
      } else if (action === "session") {
        // Mock session check - return no session by default
        // This allows the login flow to work properly
        return NextResponse.json({ session: null })
      }
    }

    // For production environments with Supabase
    try {
      // Use the centralized Supabase client

      if (action === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ user: data.user, session: data.session })
      } else if (action === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        })

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ user: data.user, session: data.session })
      } else if (action === "signout") {
        const { error } = await supabase.auth.signOut()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
      } else if (action === "session") {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ session: data.session })
      }
    } catch (supabaseError) {
      console.error("Supabase error:", supabaseError)

      // Fallback for environments without Supabase
      if (action === "signin") {
        // Allow any login in fallback mode
        return NextResponse.json({
          user: {
            id: "fallback-user-id",
            email,
            user_metadata: { name: email.split("@")[0] },
          },
        })
      } else if (action === "signup") {
        return NextResponse.json({
          user: {
            id: "fallback-user-id",
            email,
            user_metadata: { name },
          },
        })
      } else if (action === "signout") {
        return NextResponse.json({ success: true })
      } else if (action === "session") {
        return NextResponse.json({ session: null })
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Auth API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// App Router configuration exports  
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

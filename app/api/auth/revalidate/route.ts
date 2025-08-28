import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// This endpoint can be called to revalidate the session
export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the current session
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (!data.session) {
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: data.session.user,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Session revalidation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

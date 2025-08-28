import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  // Create a response object
  const res = NextResponse.next()

  // Check if we're in preview mode
  const isPreviewMode =
    request.headers.get("host")?.includes("v0.dev") ||
    request.headers.get("host")?.includes("vercel-v0-preview") ||
    process.env.NODE_ENV === "development"

  // Skip auth check in preview mode
  if (isPreviewMode) {
    return res
  }

  try {
    // Create a Supabase client for this specific request
    const supabase = createMiddlewareClient({ req: request, res })

    // Refresh the session if it exists
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If accessing a protected route without a session
    if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
      // Store the original URL to redirect back after login
      const redirectUrl = new URL("/login", request.url)
      redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // For all other cases, continue with the request
    return res
  } catch (error) {
    console.error("Middleware auth error:", error)

    // If there's an error with auth but we're in preview mode or accessing public routes,
    // let them through
    if (isPreviewMode || !request.nextUrl.pathname.startsWith("/dashboard")) {
      return res
    }

    // For protected routes with auth errors, redirect to login
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("error", "Session error. Please log in again.")
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  matcher: [
    // Match all dashboard routes
    "/dashboard/:path*",
    // Exclude static files and api routes
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
}

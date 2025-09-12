import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  // Create a response object
  const res = NextResponse.next()

  // Check if we're in preview mode or demo mode
  const isPreviewMode =
    request.headers.get("host")?.includes("v0.dev") ||
    request.headers.get("host")?.includes("vercel-v0-preview") ||
    process.env.NODE_ENV === "development"

  // Check if we're in Netlify deployment (where fallback auth is used)
  const isNetlifyDeployment = 
    request.headers.get("host")?.includes("netlify.app") ||
    process.env.NETLIFY === "true"

  // Skip Supabase auth check in preview mode or Netlify (use fallback auth)
  if (isPreviewMode || isNetlifyDeployment) {
    // For dashboard routes, check if user is logged in via fallback auth
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      // Check for our fallback auth cookie or header
      const authCookie = request.cookies.get("auth-session")
      const hasAuthSession = authCookie && authCookie.value

      if (!hasAuthSession) {
        // Store the original URL to redirect back after login
        const redirectUrl = new URL("/login", request.url)
        redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }
    return res
  }

  try {
    // Create a Supabase client for this specific request (only for real Supabase environments)
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

    // If there's an error with auth, fall back to cookie-based check for dashboard routes
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      const authCookie = request.cookies.get("auth-session")
      const hasAuthSession = authCookie && authCookie.value

      if (!hasAuthSession) {
        const redirectUrl = new URL("/login", request.url)
        redirectUrl.searchParams.set("error", "Session error. Please log in again.")
        return NextResponse.redirect(redirectUrl)
      }
    }

    return res
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

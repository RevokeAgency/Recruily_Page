"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Mail, Clock, RefreshCw } from "lucide-react"
import { verifyConfirmationToken, resendConfirmationEmail } from "@/lib/email-service"

type ConfirmationState = "loading" | "success" | "error" | "expired"

export default function ConfirmEmailPage() {
  const [state, setState] = useState<ConfirmationState>("loading")
  const [error, setError] = useState<string>("")
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get("token")
  const email = searchParams.get("email")

  useEffect(() => {
    const confirmEmail = async () => {
      if (!token || !email) {
        setState("error")
        setError("Invalid confirmation link. Please check your email for the correct link.")
        return
      }

      try {
        // Verify the token
        const verification = verifyConfirmationToken(token, email)

        if (!verification.valid) {
          if (verification.error?.includes("expired")) {
            setState("expired")
          } else {
            setState("error")
          }
          setError(verification.error || "Invalid confirmation token")
          return
        }

        // Update user's email confirmation status
        const users = JSON.parse(localStorage.getItem("recruitify-users") || "[]")
        const userIndex = users.findIndex((u: any) => u.email === email)

        if (userIndex === -1) {
          setState("error")
          setError("User account not found. Please sign up again.")
          return
        }

        // Mark email as confirmed
        users[userIndex].emailConfirmed = true
        users[userIndex].confirmedAt = new Date().toISOString()
        localStorage.setItem("recruitify-users", JSON.stringify(users))

        setState("success")

        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login?confirmed=true")
        }, 3000)
      } catch (err: any) {
        console.error("Error confirming email:", err)
        setState("error")
        setError(err.message || "Failed to confirm email. Please try again.")
      }
    }

    confirmEmail()
  }, [token, email, router])

  const handleResendEmail = async () => {
    if (!email) return

    setIsResending(true)
    setResendSuccess(false)

    try {
      const result = await resendConfirmationEmail(email)

      if (result.success) {
        setResendSuccess(true)
        setState("loading") // Reset to loading state for new confirmation
      } else {
        setError(result.error || "Failed to resend confirmation email")
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend confirmation email")
    } finally {
      setIsResending(false)
    }
  }

  const handleContinueToLogin = () => {
    router.push("/login?confirmed=true")
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
            <CardTitle>Confirming Your Email</CardTitle>
            <CardDescription>Please wait while we verify your email address...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (state === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <CardTitle className="text-green-700">Email Confirmed!</CardTitle>
            <CardDescription>
              Your email address has been successfully verified. You can now log in to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleContinueToLogin} className="w-full bg-teal-600 hover:bg-teal-700">
              Continue to Login
            </Button>
            <p className="text-center text-sm text-gray-500">Redirecting automatically in 3 seconds...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Clock className="mx-auto mb-4 h-16 w-16 text-orange-500" />
            <CardTitle className="text-orange-700">Link Expired</CardTitle>
            <CardDescription>
              This confirmation link has expired. Please request a new confirmation email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resendSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">✅ New confirmation email sent! Check your inbox.</p>
              </div>
            )}

            <Button onClick={handleResendEmail} disabled={isResending} className="w-full bg-teal-600 hover:bg-teal-700">
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Confirmation Email
                </>
              )}
            </Button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <CardTitle className="text-red-700">Confirmation Failed</CardTitle>
          <CardDescription>{error || "There was an error confirming your email address."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <>
              {resendSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">✅ New confirmation email sent! Check your inbox.</p>
                </div>
              )}

              <Button
                onClick={handleResendEmail}
                disabled={isResending}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Confirmation Email
                  </>
                )}
              </Button>
            </>
          )}

          <Button variant="outline" onClick={() => router.push("/signup")} className="w-full">
            Back to Sign Up
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Eye, EyeOff, Mail } from "lucide-react"
import { resendConfirmationEmail } from "@/lib/email-service"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showResendOption, setShowResendOption] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleResendConfirmation = async () => {
    if (!formData.email) {
      setError("Please enter your email address first")
      return
    }

    setIsLoading(true)
    try {
      const result = await resendConfirmationEmail(formData.email)
      if (result.success) {
        setSuccess("Confirmation email sent! Please check your inbox.")
        setShowResendOption(false)
      } else {
        setError(result.error || "Failed to resend confirmation email")
      }
    } catch (err: any) {
      setError("Failed to resend confirmation email")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setShowResendOption(false)

    if (!formData.email.trim()) {
      setError("Email is required")
      return
    }

    if (!formData.password.trim()) {
      setError("Password is required")
      return
    }

    setIsLoading(true)

    try {
      console.log("Starting login process...", { email: formData.email })

      const result = await signIn(formData.email, formData.password)

      console.log("Login result:", result)

      if (result.success) {
        setSuccess("Login successful! Redirecting to dashboard...")
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      } else {
        setError(result.error || "Failed to log in")

        // Show resend option if error is about email confirmation
        if (result.error?.includes("confirm your email")) {
          setShowResendOption(true)
        }
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Failed to log in")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500">
              <span className="text-xl font-bold text-white">R</span>
            </div>
            <span className="ml-2 text-2xl font-bold">Recruitify</span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">Welcome back! Please sign in to continue.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Hybrid Mode - Demo + Real Backend Setup */}
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="space-y-2">
                <p className="font-semibold">🚀 Backend Setup in Progress</p>
                <p className="text-sm">Use demo credentials while we configure your Supabase backend:</p>
                <div className="bg-white/50 p-3 rounded border border-blue-200">
                  <p className="font-mono text-sm"><strong>Email:</strong> office@example.com</p>
                  <p className="font-mono text-sm"><strong>Password:</strong> password123</p>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setFormData({ email: "office@example.com", password: "password123" })
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Fill Demo Credentials
                </Button>
                <p className="text-xs text-blue-600">Real backend will be ready after Supabase configuration.</p>
              </div>
            </AlertDescription>
          </Alert>

          {showResendOption && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <Mail className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-2">
                  <p>Your email address hasn't been confirmed yet.</p>
                  <Button
                    onClick={handleResendConfirmation}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                  >
                    Resend Confirmation Email
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="block w-full appearance-none rounded-md border border-gray-300 bg-blue-50 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="mt-1 relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="block w-full appearance-none rounded-md border border-gray-300 bg-blue-50 px-3 py-2 pr-10 placeholder-gray-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-teal-600 hover:text-teal-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md border border-transparent bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Don't have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/signup"
                className="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

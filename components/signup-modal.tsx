"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Building2, Mail, Lock, User, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface SignupModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [requiresConfirmation, setRequiresConfirmation] = useState(false)

  const { signUp } = useAuth()
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("") // Clear error when user types
  }

  const validateForm = () => {
    if (!formData.companyName.trim()) {
      setError("Company name is required")
      return false
    }
    if (!formData.email.trim()) {
      setError("Email is required")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    if (!acceptTerms) {
      setError("Please accept the terms and conditions")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setError("")

    try {
      const result = await signUp(formData.email, formData.password, formData.companyName)

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        if (result.requiresConfirmation) {
          setRequiresConfirmation(true)
          setSuccess(true)
        } else {
          // Direct success (preview mode)
          setSuccess(true)
          setTimeout(() => {
            onClose()
            router.push("/dashboard")
          }, 2000)
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
    })
    setShowPassword(false)
    setShowConfirmPassword(false)
    setAcceptTerms(false)
    setLoading(false)
    setError("")
    setSuccess(false)
    setRequiresConfirmation(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (success && requiresConfirmation) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <Mail className="mx-auto mb-4 h-16 w-16 text-teal-600" />
            <DialogTitle className="text-teal-700">Check Your Email</DialogTitle>
            <DialogDescription>
              We've sent a confirmation email to <strong>{formData.email}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-md">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5" />
                <div className="text-sm text-teal-700">
                  <p className="font-medium mb-1">Account created successfully!</p>
                  <p>Please check your email inbox and click the confirmation link to activate your account.</p>
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">Didn't receive the email? Check your spam folder.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSuccess(false)
                  setRequiresConfirmation(false)
                }}
              >
                Try Again
              </Button>
            </div>

            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (success && !requiresConfirmation) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <DialogTitle className="text-green-700">Account Created!</DialogTitle>
            <DialogDescription>Welcome to Recruitify! Redirecting to dashboard...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your Account</DialogTitle>
          <DialogDescription>Join thousands of companies using Recruitify to find the best talent</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="modal-companyName">Company Name</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="modal-companyName"
                name="companyName"
                type="text"
                required
                className="pl-10"
                placeholder="Enter your company name"
                value={formData.companyName}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-email">Work Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="modal-email"
                name="email"
                type="email"
                required
                className="pl-10"
                placeholder="Enter your work email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="modal-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="pl-10 pr-10"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleInputChange}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">Must be at least 8 characters long</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="modal-confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                className="pl-10 pr-10"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="modal-terms" checked={acceptTerms} onCheckedChange={setAcceptTerms} />
            <Label htmlFor="modal-terms" className="text-sm text-gray-600">
              I agree to the Terms of Service and Privacy Policy
            </Label>
          </div>

          <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Account...
              </>
            ) : (
              <>
                <User className="mr-2 h-4 w-4" />
                Create Account
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

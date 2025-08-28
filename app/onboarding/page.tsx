"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createOrganisation } from "@/app/actions/organisation-actions"

export default function OnboardingPage() {
  const [orgName, setOrgName] = useState("")
  const [plan, setPlan] = useState("starter")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  if (!user) {
    router.push("/login")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("name", orgName)
      formData.append("plan", plan)

      const result = await createOrganisation(formData)

      if (result.error) {
        setError(result.error)
      } else {
        router.push("/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="container flex flex-1 items-center justify-center py-12">
        <div className="mx-auto w-full max-w-lg">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-teal-500"></div>
              <span className="text-xl font-bold text-gray-900">Recruitify</span>
            </Link>
            <h1 className="mt-6 text-2xl font-bold text-gray-900">Set up your organization</h1>
            <p className="mt-2 text-sm text-gray-600">Just a few more details to get you started.</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization name</Label>
                <Input
                  id="orgName"
                  placeholder="Your organization name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Select a plan</Label>
                <RadioGroup value={plan} onValueChange={setPlan} className="space-y-3">
                  <div className="flex items-start space-x-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
                    <RadioGroupItem value="starter" id="starter" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="starter" className="text-base font-medium">
                        Starter
                      </Label>
                      <p className="text-sm text-gray-500">Perfect for small teams. Up to 5 users and 50 candidates.</p>
                      <p className="mt-1 font-medium">Free</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
                    <RadioGroupItem value="professional" id="professional" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="professional" className="text-base font-medium">
                        Professional
                      </Label>
                      <p className="text-sm text-gray-500">For growing teams. Up to 20 users and 500 candidates.</p>
                      <p className="mt-1 font-medium">$49/month</p>
                    </div>
                    <div className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-800">Popular</div>
                  </div>
                  <div className="flex items-start space-x-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
                    <RadioGroupItem value="enterprise" id="enterprise" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="enterprise" className="text-base font-medium">
                        Enterprise
                      </Label>
                      <p className="text-sm text-gray-500">For large organizations. Unlimited users and candidates.</p>
                      <p className="mt-1 font-medium">$199/month</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                {isLoading ? "Setting up..." : "Complete Setup"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

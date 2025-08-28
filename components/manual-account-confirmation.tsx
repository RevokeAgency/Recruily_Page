"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, User, AlertCircle } from "lucide-react"

export default function ManualAccountConfirmation() {
  const [email, setEmail] = useState("office@example.com")
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const confirmAccount = () => {
    try {
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem("recruitify-users") || "[]")
      const userIndex = users.findIndex((u: any) => u.email === email)

      if (userIndex >= 0) {
        // Manually confirm the account
        users[userIndex].emailConfirmed = true
        users[userIndex].confirmedAt = new Date().toISOString()
        localStorage.setItem("recruitify-users", JSON.stringify(users))

        // Also remove any pending confirmations
        const confirmations = JSON.parse(localStorage.getItem("recruitify-pending-confirmations") || "[]")
        const filteredConfirmations = confirmations.filter((c: any) => c.email !== email)
        localStorage.setItem("recruitify-pending-confirmations", JSON.stringify(filteredConfirmations))

        setStatus("success")
        setMessage(`✅ Account ${email} has been manually confirmed and can now log in.`)
      } else {
        // Create the account if it doesn't exist (for office@example.com)
        if (email === "office@example.com") {
          const newUser = {
            id: "office-user-confirmed",
            email: "office@example.com",
            password: "password123",
            name: "Office User",
            emailConfirmed: true,
            createdAt: new Date().toISOString(),
            confirmedAt: new Date().toISOString(),
          }
          users.push(newUser)
          localStorage.setItem("recruitify-users", JSON.stringify(users))
          setStatus("success")
          setMessage(`✅ Created and confirmed account ${email}. Password: password123`)
        } else {
          setStatus("error")
          setMessage(`❌ No account found with email: ${email}`)
        }
      }
    } catch (error) {
      console.error("Error confirming account:", error)
      setStatus("error")
      setMessage("❌ Failed to confirm account. Please try again.")
    }
  }

  const checkAccountStatus = () => {
    try {
      const users = JSON.parse(localStorage.getItem("recruitify-users") || "[]")
      const user = users.find((u: any) => u.email === email)

      if (user) {
        const statusText = user.emailConfirmed ? "✅ Confirmed" : "⏳ Pending Confirmation"
        setMessage(`📋 Account found: ${user.name} (${user.email}) - Status: ${statusText}`)
        setStatus(user.emailConfirmed ? "success" : "idle")
      } else {
        setMessage(`❌ No account found with email: ${email}`)
        setStatus("error")
      }
    } catch (error) {
      setMessage("❌ Error checking account status")
      setStatus("error")
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Manual Account Confirmation
        </CardTitle>
        <CardDescription>Manually confirm accounts for testing purposes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email to confirm"
            className="bg-blue-50"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={checkAccountStatus} variant="outline" className="flex-1 bg-transparent">
            Check Status
          </Button>
          <Button onClick={confirmAccount} className="flex-1 bg-teal-600 hover:bg-teal-700">
            Confirm Account
          </Button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-md text-sm border ${
              status === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : status === "error"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            <div className="flex items-start gap-2">
              {status === "success" && <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
              {status === "error" && <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
              <div>{message}</div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Quick Test Account:</h4>
          <div className="text-sm space-y-1 text-gray-600">
            <p>
              <strong>Email:</strong> office@example.com
            </p>
            <p>
              <strong>Password:</strong> password123
            </p>
            <p>
              <strong>Status:</strong> Pre-confirmed and ready to use
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <strong>Instructions:</strong>
          </p>
          <p>1. Enter the email address you want to confirm</p>
          <p>2. Click "Check Status" to see current confirmation status</p>
          <p>3. Click "Confirm Account" to manually activate the account</p>
          <p>4. The account can then log in normally</p>
        </div>
      </CardContent>
    </Card>
  )
}

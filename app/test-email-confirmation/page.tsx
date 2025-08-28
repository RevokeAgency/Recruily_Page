"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Clock, Mail, RefreshCw, ExternalLink, Copy } from "lucide-react"
import ManualAccountConfirmation from "@/components/manual-account-confirmation"

interface UserAccount {
  id: string
  email: string
  name: string
  emailConfirmed: boolean
  createdAt: string
  confirmedAt?: string
}

interface SentEmail {
  to: string
  subject: string
  html: string
  text: string
  token: string
  sentAt: string
}

export default function TestEmailConfirmationPage() {
  const [users, setUsers] = useState<UserAccount[]>([])
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([])
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null)

  const loadData = () => {
    try {
      // Load users
      const storedUsers = localStorage.getItem("recruitify-users")
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers))
      }

      // Load sent emails
      const storedEmails = localStorage.getItem("recruitify-sent-emails")
      if (storedEmails) {
        setSentEmails(JSON.parse(storedEmails))
      }

      // Ensure office@example.com is confirmed
      ensureOfficeAccountConfirmed()
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const ensureOfficeAccountConfirmed = () => {
    try {
      const users = JSON.parse(localStorage.getItem("recruitify-users") || "[]")
      let officeUser = users.find((u: any) => u.email === "office@example.com")

      if (!officeUser) {
        // Create the office@example.com account
        officeUser = {
          id: "office-user-confirmed",
          email: "office@example.com",
          password: "password123", // Simple password for testing
          name: "Office User",
          emailConfirmed: true,
          createdAt: new Date().toISOString(),
          confirmedAt: new Date().toISOString(),
        }
        users.push(officeUser)
        localStorage.setItem("recruitify-users", JSON.stringify(users))
        console.log("✅ Created and confirmed office@example.com account")
      } else if (!officeUser.emailConfirmed) {
        // Confirm existing office account
        officeUser.emailConfirmed = true
        officeUser.confirmedAt = new Date().toISOString()
        localStorage.setItem("recruitify-users", JSON.stringify(users))
        console.log("✅ Confirmed existing office@example.com account")
      }
    } catch (error) {
      console.error("Error ensuring office account:", error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getConfirmationUrl = (email: string, token: string) => {
    return `${window.location.origin}/confirm-email?token=${token}&email=${encodeURIComponent(email)}`
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Email Confirmation Testing Dashboard</h1>
        <p className="text-gray-600">Test and manage the email confirmation system</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Manual Confirmation Tool */}
        <div className="lg:col-span-2">
          <ManualAccountConfirmation />
        </div>

        {/* Testing Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Testing Instructions
            </CardTitle>
            <CardDescription>Step-by-step guide to test email confirmation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>office@example.com</strong> is pre-confirmed and ready to use!
                <br />
                Password: <code className="bg-green-100 px-1 rounded">password123</code>
              </AlertDescription>
            </Alert>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <div>
                  <strong>Test Pre-Confirmed Account:</strong>
                  <p className="text-gray-600">
                    Go to <code>/login</code> and use <strong>office@example.com</strong> with password{" "}
                    <strong>password123</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <div>
                  <strong>Create New Account:</strong>
                  <p className="text-gray-600">
                    Go to <code>/signup</code> and create a new account to test the full flow
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <div>
                  <strong>Check Console:</strong>
                  <p className="text-gray-600">Open browser console (F12) to see mock email details</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <div>
                  <strong>Use Confirmation Link:</strong>
                  <p className="text-gray-600">Copy the confirmation URL from console or emails below</p>
                </div>
              </div>
            </div>

            <Button onClick={loadData} variant="outline" className="w-full bg-transparent">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </CardContent>
        </Card>

        {/* Registered Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Registered Users ({users.length})
            </CardTitle>
            <CardDescription>All users and their confirmation status</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No users registered yet</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={user.emailConfirmed ? "default" : "secondary"}>
                        {user.emailConfirmed ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirmed
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </>
                        )}
                      </Badge>
                      {user.confirmedAt && (
                        <p className="text-xs text-gray-500 mt-1">{new Date(user.confirmedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sent Emails */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Sent Confirmation Emails ({sentEmails.length})
            </CardTitle>
            <CardDescription>All confirmation emails sent by the system</CardDescription>
          </CardHeader>
          <CardContent>
            {sentEmails.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No emails sent yet</p>
            ) : (
              <div className="space-y-4">
                {sentEmails.map((email, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">{email.subject}</p>
                        <p className="text-sm text-gray-600">To: {email.to}</p>
                        <p className="text-xs text-gray-500">Sent: {new Date(email.sentAt).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedEmail(selectedEmail?.token === email.token ? null : email)}
                        >
                          {selectedEmail?.token === email.token ? "Hide" : "View"} Email
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(getConfirmationUrl(email.to, email.token))}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Link
                        </Button>
                        <Button size="sm" asChild>
                          <a href={getConfirmationUrl(email.to, email.token)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open Link
                          </a>
                        </Button>
                      </div>
                    </div>

                    {selectedEmail?.token === email.token && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Email Preview:</h4>
                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: email.html }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

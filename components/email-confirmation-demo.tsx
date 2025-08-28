"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Mail, User, CheckCircle, XCircle, Clock, Eye, Copy, ExternalLink } from "lucide-react"

export default function EmailConfirmationDemo() {
  const [sentEmails, setSentEmails] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [showEmailContent, setShowEmailContent] = useState<string | null>(null)

  // Load data from localStorage
  const loadData = () => {
    try {
      const emails = JSON.parse(localStorage.getItem("recruitify-sent-emails") || "[]")
      const storedUsers = JSON.parse(localStorage.getItem("recruitify-users") || "[]")
      setSentEmails(emails)
      setUsers(storedUsers)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  const openConfirmationLink = (email: any) => {
    const url = `${window.location.origin}/confirm-email?token=${email.token}&email=${encodeURIComponent(email.to)}`
    window.open(url, "_blank")
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Confirmation System Demo</h1>
        <p className="text-gray-600">Test the complete email confirmation process</p>
        <Button onClick={loadData} className="mt-4">
          Refresh Data
        </Button>
      </div>

      {/* Step-by-step guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            How to Test Email Confirmation
          </CardTitle>
          <CardDescription>Follow these steps to test the complete flow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium">Create a New Account</h4>
                <p className="text-sm text-gray-600">
                  Go to the signup page and create a new account with any email address
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium">Check Console & Demo Below</h4>
                <p className="text-sm text-gray-600">
                  Open browser console to see the "sent" email, or check the demo section below
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium">Click Confirmation Link</h4>
                <p className="text-sm text-gray-600">Use the confirmation URL to activate your account</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div>
                <h4 className="font-medium">Test Login</h4>
                <p className="text-sm text-gray-600">
                  Try logging in before and after confirmation to see the difference
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registered Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Registered Users ({users.length})
          </CardTitle>
          <CardDescription>All users in the system and their confirmation status</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No users registered yet. Create an account to see users here.
            </p>
          ) : (
            <div className="space-y-3">
              {users.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="text-xs text-gray-500">Created: {new Date(user.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.emailConfirmed ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Confirmed
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sent Emails */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Sent Confirmation Emails ({sentEmails.length})
          </CardTitle>
          <CardDescription>Mock emails that would be sent in production</CardDescription>
        </CardHeader>
        <CardContent>
          {sentEmails.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No emails sent yet. Create an account to see emails here.</p>
          ) : (
            <div className="space-y-4">
              {sentEmails.map((email, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium">📧 {email.subject}</div>
                      <div className="text-sm text-gray-600">To: {email.to}</div>
                      <div className="text-xs text-gray-500">Sent: {new Date(email.sentAt).toLocaleString()}</div>
                    </div>
                    <Badge variant="outline">RECRUITIFY</Badge>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowEmailContent(showEmailContent === email.token ? null : email.token)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {showEmailContent === email.token ? "Hide" : "View"} Email
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const url = `${window.location.origin}/confirm-email?token=${email.token}&email=${encodeURIComponent(email.to)}`
                        copyToClipboard(url)
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Link
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => openConfirmationLink(email)}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open Confirmation Link
                    </Button>
                  </div>

                  {showEmailContent === email.token && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Email Preview:</h4>
                      <div
                        className="text-sm bg-white p-4 rounded border max-h-96 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: email.html }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <strong>Console Logging:</strong> All "sent" emails are logged to the browser console. Open Developer
              Tools → Console to see the email details and confirmation URLs.
            </AlertDescription>
          </Alert>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Test Login Blocking:</strong> Try logging in with an unconfirmed account to see the "Please
              confirm your email" error message with resend option.
            </AlertDescription>
          </Alert>

          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Test Token Expiration:</strong> Confirmation tokens expire after 24 hours. You can manually test
              this by modifying the expiration date in localStorage.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

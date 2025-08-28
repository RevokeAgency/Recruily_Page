"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function CookieConsent() {
  const [accepted, setAccepted] = useState(true) // Default to true to avoid flashing

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem("cookieConsent") === "accepted"
    setAccepted(hasAccepted)
  }, [])

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "accepted")
    setAccepted(true)
  }

  if (accepted) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg md:flex md:items-center md:justify-between">
      <div className="mb-4 md:mb-0 md:mr-4">
        <p className="text-sm text-gray-700">
          We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
        </p>
      </div>
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={() => window.open("/privacy-policy", "_blank")}>
          Learn More
        </Button>
        <Button size="sm" onClick={acceptCookies}>
          Accept
        </Button>
      </div>
    </div>
  )
}

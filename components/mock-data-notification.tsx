"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X } from "lucide-react"
import { isSupabaseConfigured } from "@/lib/env"

export function MockDataNotification() {
  const [visible, setVisible] = useState(true)
  const [isMockData, setIsMockData] = useState(false)

  useEffect(() => {
    // Check if we're using mock data
    setIsMockData(!isSupabaseConfigured())

    // Hide notification after 10 seconds
    const timer = setTimeout(() => {
      setVisible(false)
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

  if (!isMockData || !visible) return null

  return (
    <Alert className="fixed bottom-4 right-4 w-auto max-w-md bg-amber-50 shadow-lg">
      <div className="flex items-start justify-between">
        <AlertDescription className="text-amber-800">
          Using mock data. Supabase configuration is missing.
        </AlertDescription>
        <button onClick={() => setVisible(false)} className="ml-2 rounded-full p-1 text-amber-800 hover:bg-amber-100">
          <X size={16} />
        </button>
      </div>
    </Alert>
  )
}

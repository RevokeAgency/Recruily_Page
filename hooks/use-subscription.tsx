"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"

interface SubscriptionContextType {
  plan: "free" | "pro" | "enterprise" | "testing"
  matchesUsed: number
  matchesLimit: number
  remainingMatches: number
  isTestingAccount: boolean
  hasUnlimitedAccess: boolean
  incrementMatchCount: () => void
  showPlanSelector: () => void
  resetMatches: () => void
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [plan, setPlan] = useState<"free" | "pro" | "enterprise" | "testing">("testing")
  const [matchesUsed, setMatchesUsed] = useState(0)
  const [showPlanModal, setShowPlanModal] = useState(false)

  // Plan limits
  const planLimits = {
    free: 10,
    pro: 100,
    enterprise: 1000,
    testing: Number.POSITIVE_INFINITY,
  }

  const matchesLimit = planLimits[plan]
  const remainingMatches = Math.max(0, matchesLimit - matchesUsed)
  const isTestingAccount = plan === "testing"
  const hasUnlimitedAccess = plan === "testing" || plan === "enterprise"

  // Load matches count from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recruitify_matches_used")
    if (stored) {
      setMatchesUsed(Number.parseInt(stored, 10))
    }
  }, [])

  // Save matches count to localStorage
  useEffect(() => {
    localStorage.setItem("recruitify_matches_used", matchesUsed.toString())
  }, [matchesUsed])

  const incrementMatchCount = () => {
    if (plan !== "testing") {
      setMatchesUsed((prev) => prev + 1)
    }
  }

  const showPlanSelector = () => {
    setShowPlanModal(true)
  }

  const resetMatches = () => {
    setMatchesUsed(0)
    localStorage.removeItem("recruitify_matches_used")
  }

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        matchesUsed,
        matchesLimit,
        remainingMatches,
        isTestingAccount,
        hasUnlimitedAccess,
        incrementMatchCount,
        showPlanSelector,
        resetMatches,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }
  return context
}

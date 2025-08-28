"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"

interface Quota {
  used: number
  limit: number
  unlimited: boolean
  reset_date: string
}

export function useQuota() {
  const { user } = useAuth()
  const [quota, setQuota] = useState<Quota | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if this is a testing account
  const isTestingAccount =
    user?.email === "preview@example.com" ||
    user?.id === "preview-user-id" ||
    user?.email?.includes("test") ||
    user?.email?.includes("demo")

  // Check if user has unlimited access
  const hasUnlimitedAccess = isTestingAccount || quota?.unlimited || false

  useEffect(() => {
    const fetchQuota = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // For testing accounts, provide unlimited quota
        if (isTestingAccount) {
          setQuota({
            used: 0,
            limit: 999999,
            unlimited: true,
            reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          setLoading(false)
          return
        }

        // For regular users, fetch from API or use default
        const response = await fetch("/api/quota", {
          headers: {
            Authorization: `Bearer ${user.access_token}`,
          },
        })

        if (response.ok) {
          const quotaData = await response.json()
          setQuota(quotaData)
        } else {
          // Default quota for regular users
          setQuota({
            used: 0,
            limit: 10,
            unlimited: false,
            reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
        }
      } catch (error) {
        console.error("Error fetching quota:", error)
        // Fallback quota
        setQuota({
          used: 0,
          limit: isTestingAccount ? 999999 : 10,
          unlimited: isTestingAccount,
          reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
      } finally {
        setLoading(false)
      }
    }

    fetchQuota()
  }, [user, isTestingAccount])

  const incrementUsage = (amount = 1) => {
    if (hasUnlimitedAccess) return // Don't increment for unlimited accounts

    setQuota((prev) =>
      prev
        ? {
            ...prev,
            used: prev.used + amount,
          }
        : null,
    )
  }

  const canUseFeature = () => {
    if (hasUnlimitedAccess) return true
    return quota ? quota.used < quota.limit : false
  }

  return {
    quota,
    loading,
    isTestingAccount,
    hasUnlimitedAccess,
    incrementUsage,
    canUseFeature,
  }
}

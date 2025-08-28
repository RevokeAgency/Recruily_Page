"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Infinity, Zap } from "lucide-react"
import { useQuota } from "@/hooks/use-quota"
import { useLanguage } from "@/contexts/language-context"

export function MatchCounter() {
  const { quota, loading, isTestingAccount } = useQuota()
  const { t } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading || !quota) {
    return null
  }

  const usedPercentage = quota.unlimited ? 0 : Math.min(100, Math.round((quota.used / quota.limit) * 100))
  const quotaColor = quota.unlimited
    ? "bg-gradient-to-r from-teal-400 to-blue-400"
    : usedPercentage > 90
      ? "bg-red-500"
      : usedPercentage > 70
        ? "bg-amber-500"
        : "bg-teal-500"

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-500 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
    >
      <Card className="w-80 shadow-lg border-2 border-teal-100 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {quota.unlimited || isTestingAccount ? (
                <Infinity className="h-5 w-5 text-teal-600" />
              ) : (
                <Zap className="h-5 w-5 text-teal-600" />
              )}
              <span className="font-semibold text-gray-900">
                {quota.unlimited || isTestingAccount ? "Unlimited Testing" : t("monthlyQuota")}
              </span>
            </div>
            {(quota.unlimited || isTestingAccount) && (
              <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-medium">FREE</span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{quota.unlimited || isTestingAccount ? "Matches Used" : t("used")}</span>
              <span className="font-medium text-gray-900">
                {quota.used} /{" "}
                {quota.unlimited || isTestingAccount ? (
                  <span className="inline-flex items-center gap-1">
                    <Infinity className="h-3 w-3" />
                  </span>
                ) : (
                  quota.limit
                )}
              </span>
            </div>

            <div className="relative">
              {quota.unlimited || isTestingAccount ? (
                <div className="h-2 bg-gradient-to-r from-teal-400 to-blue-400 rounded-full animate-pulse" />
              ) : (
                <Progress value={usedPercentage} className="h-2" indicatorClassName={quotaColor} />
              )}
            </div>

            <p className="text-xs text-gray-500">
              {quota.unlimited || isTestingAccount ? (
                <span className="text-teal-600 font-medium">
                  ✨ Unlimited matches for testing enhanced CV extraction!
                </span>
              ) : (
                `${t("resetsOn")} ${new Date(quota.reset_date).toLocaleDateString()}`
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

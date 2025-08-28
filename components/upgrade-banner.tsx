"use client"

import { useState } from "react"
import { useQuota } from "@/hooks/use-quota"
import { useSubscription } from "@/hooks/use-subscription"
import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { X, Zap, TrendingUp } from "lucide-react"

export function UpgradeBanner() {
  const { quota, isTestingAccount, hasUnlimitedAccess } = useQuota()
  const { showPlanSelector } = useSubscription()
  const { language } = useLanguage()
  const [dismissed, setDismissed] = useState(false)

  // Don't show banner for testing accounts or unlimited users
  if (isTestingAccount || hasUnlimitedAccess || dismissed || !quota) {
    return null
  }

  // Only show when usage is above 80%
  const usagePercentage = (quota.used / quota.limit) * 100
  if (usagePercentage < 80) {
    return null
  }

  const isNearLimit = usagePercentage >= 90
  const isAtLimit = quota.used >= quota.limit

  return (
    <Card
      className={`border-2 ${isAtLimit ? "border-red-200 bg-red-50" : isNearLimit ? "border-orange-200 bg-orange-50" : "border-yellow-200 bg-yellow-50"}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div
              className={`p-2 rounded-lg ${isAtLimit ? "bg-red-100" : isNearLimit ? "bg-orange-100" : "bg-yellow-100"}`}
            >
              {isAtLimit ? (
                <X className="h-5 w-5 text-red-600" />
              ) : (
                <Zap className={`h-5 w-5 ${isNearLimit ? "text-orange-600" : "text-yellow-600"}`} />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">
                  {isAtLimit
                    ? language === "EN"
                      ? "Quota Exceeded"
                      : "Kontingent überschritten"
                    : language === "EN"
                      ? "Quota Warning"
                      : "Kontingent-Warnung"}
                </h3>
                <Badge variant={isAtLimit ? "destructive" : "secondary"}>
                  {quota.used} / {quota.limit}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-2">
                {isAtLimit
                  ? language === "EN"
                    ? "You've reached your monthly limit. Upgrade to continue matching candidates."
                    : "Sie haben Ihr monatliches Limit erreicht. Upgraden Sie, um weiter Kandidaten zu matchen."
                  : language === "EN"
                    ? "You're running low on matches. Consider upgrading for unlimited access."
                    : "Ihre Matches gehen zur Neige. Erwägen Sie ein Upgrade für unbegrenzten Zugang."}
              </p>

              <Progress
                value={Math.min(100, usagePercentage)}
                className={`h-2 ${isAtLimit ? "bg-red-100" : isNearLimit ? "bg-orange-100" : "bg-yellow-100"}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={showPlanSelector}
              className={
                isAtLimit
                  ? "bg-red-600 hover:bg-red-700"
                  : isNearLimit
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-yellow-600 hover:bg-yellow-700"
              }
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {language === "EN" ? "Upgrade Now" : "Jetzt upgraden"}
            </Button>

            <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

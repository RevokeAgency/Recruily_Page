"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuota } from "@/hooks/use-quota"
import { UpgradeBanner } from "@/components/upgrade-banner"
import { useLanguage } from "@/contexts/language-context"

export default function DashboardPage() {
  const router = useRouter()
  const { quota } = useQuota()
  const { language } = useLanguage()

  // Redirect to matches page
  useEffect(() => {
    router.push("/dashboard/matches")
  }, [router])

  return (
    <div className="container mx-auto p-4">
      {quota && (quota as any).isExceeded && <UpgradeBanner />}
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">
          {language === "EN" ? "Redirecting to matches..." : "Weiterleitung zu Übereinstimmungen..."}
        </p>
      </div>
    </div>
  )
}

import type { ReactNode } from "react"
import { ModernSidebar } from "@/components/modern-sidebar"
import { MatchCounter } from "@/components/match-counter"
import { PlanSelector } from "@/components/plan-selector"
import { DashboardBackgroundElements } from "@/components/design-elements"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DashboardBackgroundElements />
      <ModernSidebar />
      <main className="flex-1 overflow-y-auto pb-16">{children}</main>
      <MatchCounter />
      <PlanSelector />
    </div>
  )
}

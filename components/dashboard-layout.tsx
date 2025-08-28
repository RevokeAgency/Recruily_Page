"use client"

import type React from "react"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Briefcase, PieChart, Settings, Bell, UserPlus } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { language } = useLanguage()

  const navigation = [
    {
      name: language === "EN" ? "Dashboard" : "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: language === "EN" ? "Candidates" : "Kandidaten",
      href: "/dashboard/candidates",
      icon: Users,
    },
    {
      name: language === "EN" ? "Jobs" : "Stellenangebote",
      href: "/dashboard/jobs",
      icon: Briefcase,
    },
    {
      name: language === "EN" ? "Matches" : "Übereinstimmungen",
      href: "/dashboard/matches",
      icon: PieChart,
    },
    {
      name: language === "EN" ? "Team" : "Team",
      href: "/dashboard/team",
      icon: UserPlus,
    },
    {
      name: language === "EN" ? "Settings" : "Einstellungen",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

  return <div className="w-full">{children}</div>
}

interface NotificationItemProps {
  title: string
  description: string
  time: string
}

function NotificationItem({ title, description, time }: NotificationItemProps) {
  return (
    <div className="flex gap-4 px-4 py-3 hover:bg-gray-50">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
        <Bell className="h-5 w-5 text-teal-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 line-clamp-1">{description}</p>
        <p className="mt-1 text-xs text-gray-400">{time}</p>
      </div>
    </div>
  )
}

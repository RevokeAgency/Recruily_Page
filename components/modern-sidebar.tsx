"use client"

import { useState, useEffect } from "react"
import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
  ChevronRight,
  Menu,
  LogOut,
  HelpCircle,
  Bell,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase.client"
import { useLanguage } from "@/contexts/language-context"

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
  isCollapsed: boolean
  badge?: number
}

const NavItem = ({ href, icon, label, isActive, isCollapsed, badge }: NavItemProps) => {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 group relative",
              isActive
                ? "bg-teal-600 text-white"
                : "hover:bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            <div className="flex shrink-0 items-center justify-center">{icon}</div>
            <span
              className={cn(
                "text-sm font-medium transition-all duration-200",
                isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100",
              )}
            >
              {label}
            </span>
            {badge && (
              <Badge
                className={cn(
                  "ml-auto bg-primary/10 text-primary hover:bg-primary/20",
                  isActive && "bg-white/20 text-white hover:bg-white/30",
                )}
              >
                {badge}
              </Badge>
            )}
            {isActive && (
              <span
                className={cn(
                  "absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-md bg-teal-600",
                  isCollapsed ? "opacity-100" : "opacity-0",
                )}
              />
            )}
          </Link>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right" className="border-none bg-primary text-primary-foreground">
            {label}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

export function ModernSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { t } = useLanguage()
  // Use centralized Supabase client
  const [counts, setCounts] = useState({
    jobs: 0,
    candidates: 0,
  })

  // Fetch counts for badges
  useEffect(() => {
    const fetchCounts = async () => {
      if (!user?.app_metadata?.org_id) return

      try {
        // Get job count
        const { count: jobCount } = await supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .eq("org_id", user.app_metadata.org_id)

        // Get candidate count
        const { count: candidateCount } = await supabase
          .from("candidates")
          .select("*", { count: "exact", head: true })
          .eq("organisation_id", user.app_metadata.org_id)

        setCounts({
          jobs: jobCount || 0,
          candidates: candidateCount || 0,
        })
      } catch (error) {
        console.error("Error fetching counts:", error)
      }
    }

    fetchCounts()
  }, [user, supabase])

  const navigation = [
    {
      href: "/dashboard",
      icon: <LayoutDashboard size={20} />,
      label: t("dashboard"),
      badge: undefined,
    },
    {
      href: "/dashboard/jobs",
      icon: <Briefcase size={20} />,
      label: t("jobs"),
      badge: counts.jobs > 0 ? counts.jobs : undefined,
    },
    {
      href: "/dashboard/candidates",
      icon: <Users size={20} />,
      label: t("candidates"),
      badge: counts.candidates > 0 ? counts.candidates : undefined,
    },
    {
      href: "/dashboard/subscription",
      icon: <CreditCard size={20} />,
      label: t("subscription"),
      badge: undefined,
    },
    {
      href: "/dashboard/settings",
      icon: <Settings size={20} />,
      label: t("settings"),
      badge: undefined,
    },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-card border-r transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[70px]" : "w-[240px]",
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">R</span>
            </div>
            <span className="font-semibold">Recruitify</span>
          </Link>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 mx-auto rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">R</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn("rounded-full", isCollapsed && "mx-auto")}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
        </Button>
      </div>

      <div className="flex-1 overflow-auto py-2 px-2">
        <nav className="grid gap-1">
          {navigation.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`)
              }
              isCollapsed={isCollapsed}
              badge={item.badge}
            />
          ))}
        </nav>
      </div>

      <div className={cn("mt-auto border-t p-4", isCollapsed ? "flex justify-center" : "block")}>
        {!isCollapsed && user && (
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/abstract-geometric-shapes.png" alt={user.email || "User"} />
              <AvatarFallback>{user.email ? user.email.substring(0, 2).toUpperCase() : "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user.user_metadata?.full_name || user.email}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )}

        <div className={cn("flex gap-1", isCollapsed ? "flex-col" : "justify-between")}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <HelpCircle size={18} />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}

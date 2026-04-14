"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Briefcase, Users, Settings, LogOut, Upload, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/hooks/use-auth"
import { useQuota } from "@/hooks/use-quota"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CVUploadModal as CvUploadModal } from "@/components/cv-upload-modal"

export default function DashboardSidebar() {
  const pathname = usePathname()
  const { language, t } = useLanguage()
  const { user, signOut } = useAuth()
  const { quota } = useQuota()
  const [isCvModalOpen, setIsCvModalOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  // Fetch the most recent job for CV upload
  useEffect(() => {
    const fetchRecentJob = async () => {
      if (!user?.app_metadata?.org_id) return

      try {
        const { supabase } = await import("@/lib/supabase")

        const { data } = await supabase
          .from("jobs")
          .select("id")
          .eq("org_id", user.app_metadata.org_id)
          .order("created_at", { ascending: false })
          .limit(1)

        if (data && data.length > 0) {
          setSelectedJobId((data[0] as any).id)
        }
      } catch (error) {
        console.error("Error fetching recent job:", error)
      }
    }

    fetchRecentJob()
  }, [user])

  const navigation = [
    {
      name: t("dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
      tooltip: language === "EN" ? "Overview of your recruitment" : "Überblick über Ihre Rekrutierung",
    },
    {
      name: t("jobs"),
      href: "/dashboard/jobs",
      icon: Briefcase,
      tooltip: language === "EN" ? "Manage job postings" : "Stellenangebote verwalten",
    },
    {
      name: t("candidates"),
      href: "/dashboard/candidates",
      icon: Users,
      tooltip: language === "EN" ? "Manage your candidates" : "Kandidaten verwalten",
    },
    {
      name: t("settings"),
      href: "/dashboard/settings",
      icon: Settings,
      tooltip: language === "EN" ? "Account and app settings" : "Konto- und App-Einstellungen",
    },
  ]

  const usedPercentage = quota ? Math.min(100, Math.round((quota.used / quota.limit) * 100)) : 0
  const quotaColor = usedPercentage > 90 ? "bg-red-500" : usedPercentage > 70 ? "bg-amber-500" : "bg-teal-500"

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="border-r">
        <SidebarHeader className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-teal-600 p-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                <path d="M2 17L12 22L22 17" fill="white" />
                <path d="M2 12L12 17L22 12" fill="white" />
              </svg>
            </div>
            <span className="text-xl font-bold">Recruitify</span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t("navigation")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.tooltip}>
                      <Link href={item.href} className="flex items-center">
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>{t("quickActions")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={language === "EN" ? "Create a new job posting" : "Neue Stellenausschreibung erstellen"}
                  >
                    <Link href="/dashboard/jobs/new" className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" />
                      <span>{t("createJob")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsCvModalOpen(true)}
                    disabled={!selectedJobId}
                    tooltip={language === "EN" ? "Upload candidate CVs" : "Kandidaten-Lebensläufe hochladen"}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    <span>{t("uploadResume")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {language === "EN" ? "Monthly Quota" : "Monatliches Kontingent"}
                </span>
                <span className="font-medium">
                  {quota?.used} / {quota?.limit}
                </span>
              </div>
              <Progress value={usedPercentage} className="h-2" {...{ indicatorClassName: quotaColor } as any} />
              <p className="text-xs text-muted-foreground">
                {language === "EN" ? "Resets on" : "Zurückgesetzt am"}{" "}
                {quota?.reset_date ? new Date(quota.reset_date).toLocaleDateString() : "-"}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
                  <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user?.user_metadata?.name || user?.email}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => signOut?.()}>
                      <LogOut className="h-4 w-4" />
                      <span className="sr-only">{t("logout")}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("logout")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </SidebarFooter>

        {/* CV Upload Modal */}
        <CvUploadModal jobId={selectedJobId ?? undefined} />
      </Sidebar>
    </SidebarProvider>
  )
}

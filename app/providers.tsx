"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { LanguageProvider } from "@/contexts/language-context"
import { SubscriptionProvider } from "@/hooks/use-subscription"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toaster"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <LanguageProvider>
          <SubscriptionProvider>
            <SidebarProvider>
              {children}
              <Toaster />
            </SidebarProvider>
          </SubscriptionProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

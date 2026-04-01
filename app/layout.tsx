import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import dynamic from "next/dynamic"
import "./globals.css"
import { Providers } from "./providers"

// Optimize font loading with display swap for better performance
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true
})

// Lazy load non-critical components
const BackgroundElements = dynamic(() => import("@/components/design-elements").then(mod => ({ default: mod.BackgroundElements })), {
  ssr: false
})

const CookieConsent = dynamic(() => import("@/components/cookie-consent"), {
  ssr: false
})

export const metadata: Metadata = {
  title: "Recruitify",
  description: "AI-powered recruitment platform",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BackgroundElements />
        <Providers>{children}</Providers>
        <CookieConsent />
      </body>
    </html>
  )
}

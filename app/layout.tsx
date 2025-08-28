import type React from "react"
import type { Metadata } from "next/next-types"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { BackgroundElements } from "@/components/design-elements"
import CookieConsent from "@/components/cookie-consent"

const inter = Inter({ subsets: ["latin"] })

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

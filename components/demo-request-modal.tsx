"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { ExternalLink } from "lucide-react"

export default function DemoRequestModal({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage()

  return (
    <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="inline-block">
      <Button className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2">
        {language === "EN" ? "How Recrewly Works" : "Wie Recrewly funktioniert"}
        <ExternalLink className="h-4 w-4" />
      </Button>
    </a>
  )
}

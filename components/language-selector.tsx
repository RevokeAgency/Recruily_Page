"use client"

import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"

interface LanguageSelectorProps {
  variant?: "default" | "minimal"
}

export default function LanguageSelector({ variant = "default" }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage()

  if (variant === "minimal") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Globe className="h-5 w-5" />
            <span className="sr-only">Select language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setLanguage("EN")} className={language === "EN" ? "bg-muted" : ""}>
            English
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLanguage("DE")} className={language === "DE" ? "bg-muted" : ""}>
            Deutsch
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={language === "EN" ? "default" : "outline"}
        size="sm"
        onClick={() => setLanguage("EN")}
        className="w-20"
      >
        English
      </Button>
      <Button
        variant={language === "DE" ? "default" : "outline"}
        size="sm"
        onClick={() => setLanguage("DE")}
        className="w-20"
      >
        Deutsch
      </Button>
    </div>
  )
}

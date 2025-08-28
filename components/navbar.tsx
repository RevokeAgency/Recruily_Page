"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, Globe, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/contexts/language-context"
import LoginModal from "./login-modal"
import { getCurrentUser, signOutUser } from "@/lib/auth-helpers"
import { useRouter } from "next/navigation"

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { language, setLanguage } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()

  // Only run on client-side
  useEffect(() => {
    setIsClient(true)
    const currentUser = getCurrentUser()
    setUser(currentUser)

    // Add scroll event listener
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSignOut = async () => {
    await signOutUser()
    setUser(null)
    router.push("/")
  }

  // Smooth scroll function
  const scrollToSection = (elementId: string) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(elementId)
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - 80
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      })
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 shadow-sm backdrop-blur" : "bg-white shadow-sm"
      }`}
    >
      <nav className="container flex items-center justify-between py-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-teal-500"></div>
            <span className="text-xl font-bold text-gray-900">Recruitify</span>
          </Link>
          <div className="hidden md:ml-10 md:flex md:items-center md:space-x-8">
            <button
              onClick={() => scrollToSection("features")}
              className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors"
            >
              {language === "EN" ? "Features" : "Funktionen"}
            </button>
            <button
              onClick={() => scrollToSection("use-cases")}
              className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors"
            >
              {language === "EN" ? "Use Cases" : "Anwendungsfälle"}
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors"
            >
              {language === "EN" ? "Pricing" : "Preise"}
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors"
            >
              {language === "EN" ? "FAQ" : "FAQ"}
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-sm font-medium text-gray-600 hover:text-teal-600 transition-colors"
            >
              {language === "EN" ? "Contact" : "Kontakt"}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <LanguageSelector />

          <div className="hidden md:flex md:items-center md:space-x-2">
            {isClient && user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-gray-700 hover:text-teal-600">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" className="text-gray-700 hover:text-teal-600" onClick={handleSignOut}>
                  {language === "EN" ? "Sign out" : "Abmelden"}
                </Button>
              </>
            ) : (
              <>
                <LoginModal>
                  <Button variant="ghost" className="text-gray-700 hover:text-teal-600">
                    {language === "EN" ? "Log in" : "Anmelden"}
                  </Button>
                </LoginModal>
                <Link href="/signup">
                  <Button className="bg-teal-600 hover:bg-teal-700">
                    {language === "EN" ? "Sign up" : "Registrieren"}
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-4 pb-3 pt-2">
            <button
              onClick={() => scrollToSection("features")}
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-teal-600"
            >
              {language === "EN" ? "Features" : "Funktionen"}
            </button>
            <button
              onClick={() => scrollToSection("use-cases")}
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-teal-600"
            >
              {language === "EN" ? "Use Cases" : "Anwendungsfälle"}
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-teal-600"
            >
              {language === "EN" ? "Pricing" : "Preise"}
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-teal-600"
            >
              {language === "EN" ? "FAQ" : "FAQ"}
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-teal-600"
            >
              {language === "EN" ? "Contact" : "Kontakt"}
            </button>
            {isClient && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-teal-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleSignOut()
                    setMobileMenuOpen(false)
                  }}
                  className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-teal-600"
                >
                  {language === "EN" ? "Sign out" : "Abmelden"}
                </button>
              </>
            ) : (
              <div className="border-t border-gray-200 pt-4">
                <Link
                  href="/login"
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-teal-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {language === "EN" ? "Log in" : "Anmelden"}
                </Link>
                <Link
                  href="/signup"
                  className="mt-2 block rounded-md bg-teal-600 px-3 py-2 text-center text-base font-medium text-white hover:bg-teal-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {language === "EN" ? "Sign up" : "Registrieren"}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-sm text-gray-700">
          <Globe className="h-4 w-4" />
          <span>{language}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage("EN")}>English</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("DE")}>Deutsch</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

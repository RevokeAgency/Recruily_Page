"use client"

import type React from "react"
import Link from "next/link"
import { Globe, ChevronDown, Linkedin, Twitter, Youtube } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/contexts/language-context"

export default function Footer() {
  const { language, setLanguage } = useLanguage()

  return (
    <footer className="bg-gray-50 pt-16 pb-12">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-teal-500"></div>
              <span className="text-xl font-bold text-gray-900">Recruitify</span>
            </Link>
            <p className="mt-4 max-w-md text-gray-600">
              {language === "EN"
                ? "AI-powered recruiting assistant that helps HR teams match job descriptions with the best candidates without screening hundreds of résumés."
                : "KI-gestützter Rekrutierungsassistent, der HR-Teams hilft, Stellenbeschreibungen mit den besten Kandidaten abzugleichen, ohne Hunderte von Lebensläufen zu prüfen."}
            </p>
            <div className="mt-6 flex space-x-4">
              <SocialIcon href="#" icon={<Linkedin className="h-5 w-5" />} label="LinkedIn" />
              <SocialIcon href="#" icon={<Twitter className="h-5 w-5" />} label="Twitter" />
              <SocialIcon href="#" icon={<Youtube className="h-5 w-5" />} label="YouTube" />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
              {language === "EN" ? "Product" : "Produkt"}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="#features" className="text-gray-600 hover:text-teal-600">
                  {language === "EN" ? "Features" : "Funktionen"}
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-gray-600 hover:text-teal-600">
                  {language === "EN" ? "Pricing" : "Preise"}
                </Link>
              </li>
              <li>
                <Link href="#faq" className="text-gray-600 hover:text-teal-600">
                  {language === "EN" ? "FAQ" : "FAQ"}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-teal-600">
                  {language === "EN" ? "Blog" : "Blog"}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
              {language === "EN" ? "Company" : "Unternehmen"}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-gray-600 hover:text-teal-600">
                  {language === "EN" ? "About" : "Über uns"}
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-gray-600 hover:text-teal-600">
                  {language === "EN" ? "Contact" : "Kontakt"}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-900">
              {language === "EN" ? "Legal" : "Rechtliches"}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-gray-600 hover:text-teal-600">
                  {language === "EN" ? "Impressum" : "Impressum"}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-teal-600">
                  {language === "EN" ? "Privacy Policy" : "Datenschutz"}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-teal-600">
                  {language === "EN" ? "Terms of Service" : "Nutzungsbedingungen"}
                </Link>
              </li>
            </ul>
            <div className="mt-6">
              <LanguageSelector />
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
          <p>
            © {new Date().getFullYear()} Recruitify.{" "}
            {language === "EN" ? "All rights reserved." : "Alle Rechte vorbehalten."}
          </p>
        </div>
      </div>
    </footer>
  )
}

function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-1 text-sm">
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

interface SocialIconProps {
  href: string
  icon: React.ReactNode
  label: string
}

function SocialIcon({ href, icon, label }: SocialIconProps) {
  return (
    <Link
      href={href}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-teal-600 hover:bg-teal-50 hover:text-teal-600"
      aria-label={label}
    >
      {icon}
    </Link>
  )
}

"use client"
import { ChevronRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import RecruitmentEfficiencySection from "@/components/recruitment-efficiency-section"
import Features from "@/components/features"
import UseCases from "@/components/use-cases"
import Pricing from "@/components/pricing"
import Testimonials from "@/components/testimonials"
import ProductPreview from "@/components/product-preview"
import Footer from "@/components/footer"
import { useLanguage } from "@/contexts/language-context"
import { SectionAccent } from "@/components/design-elements"
import { DecorativeAccent, FloatingElements } from "@/components/decorative-elements"
import FaqSection from "@/components/faq-section"
import ContactSection from "@/components/contact-section"
import DemoRequestModal from "@/components/demo-request-modal"

// Define the exact teal color to use for both the wave and the box
const TEAL_COLOR = "#1AB3A6"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />

        {/* Recruitment Efficiency Section (replacing AI Matching Demo) */}
        <div className="relative">
          <DecorativeAccent variant="wave" position="top-left" color="secondary" size="lg" className="opacity-30" />
          <RecruitmentEfficiencySection />
        </div>

        {/* Features Section */}
        <div className="relative">
          <SectionAccent position="top-right" />
          <DecorativeAccent variant="dots" position="bottom-left" color="accent" size="lg" className="opacity-40" />
          <Features />
        </div>

        {/* Product Preview Section - moved here */}
        <div className="relative">
          <FloatingElements />
          <ProductPreview />
        </div>

        {/* Use Cases Section */}
        <div className="relative">
          <DecorativeAccent variant="circles" position="center-right" color="secondary" size="lg" />
          <UseCases />
        </div>

        {/* Pricing Section */}
        <div className="relative overflow-hidden">
          <DecorativeAccent variant="triangle" position="top-left" color="primary" size="lg" className="opacity-20" />
          <DecorativeAccent variant="squares" position="bottom-right" color="accent" size="md" className="opacity-30" />
          <Pricing />
        </div>

        {/* Testimonials Section */}
        <div className="relative">
          <SectionAccent position="bottom-left" />
          <DecorativeAccent variant="lines" position="top-right" color="muted" size="md" />
          <Testimonials />
        </div>

        {/* CTA Repeat Section */}
        <div className="relative">
          {/* Custom wave divider with exact teal color match */}
          <div className="w-full overflow-hidden">
            <svg viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fill={TEAL_COLOR} /* Using the exact same color variable */
                d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              ></path>
            </svg>
          </div>
          <CTASection />
        </div>

        {/* FAQ Section */}
        <div className="relative">
          <DecorativeAccent variant="dots" position="top-right" color="muted" size="md" className="opacity-30" />
          <FaqSection />
        </div>

        {/* Contact Section */}
        <div className="relative">
          <DecorativeAccent variant="circles" position="bottom-left" color="primary" size="sm" className="opacity-20" />
          <ContactSection />
        </div>
      </main>

      <Footer />
    </div>
  )
}

// Separate the Hero section as a client component to use the language context
function HeroSection() {
  const { language } = useLanguage()

  return (
    <section className="relative overflow-hidden bg-white py-20 md:py-32">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-teal-50 via-white to-blue-50 opacity-70"></div>

      {/* Decorative elements */}
      <DecorativeAccent variant="circles" position="top-right" color="primary" size="lg" className="opacity-30" />
      <DecorativeAccent variant="dots" position="bottom-left" color="secondary" size="md" className="opacity-40" />
      <FloatingElements />

      <div className="container relative z-10">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div className="flex flex-col space-y-6">
            <div className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-600 mb-2">
              <span className="mr-1 h-2 w-2 rounded-full bg-teal-500"></span>
              {language === "EN" ? "AI-Powered Recruitment" : "KI-gestützte Rekrutierung"}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              {language === "EN" ? "Smarter Hiring" : "Intelligentere Einstellungen"} <br />
              <span className="text-teal-600 relative">
                {language === "EN" ? "Starts Here" : "Beginnen Hier"}
                <svg
                  className="absolute -bottom-2 left-0 w-full h-2 text-teal-200 opacity-70"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path d="M0,0 C25,5 75,5 100,0 L100,10 L0,10 Z" fill="currentColor"></path>
                </svg>
              </span>
            </h1>
            <p className="max-w-md text-xl text-gray-600">
              {language === "EN"
                ? "AI-powered matching to find top candidates without résumé chaos."
                : "KI-gestütztes Matching, um Top-Kandidaten ohne Lebenslauf-Chaos zu finden."}
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Button size="lg" className="bg-teal-600 hover:bg-teal-700 relative overflow-hidden group">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-teal-500 to-teal-600 group-hover:opacity-90 transition-opacity"></span>
                <span className="relative flex items-center">
                  {language === "EN" ? "Try for free" : "Kostenlos testen"}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </span>
              </Button>
              <DemoRequestModal>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-teal-600 text-teal-600 hover:bg-teal-50 gradient-border"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {language === "EN" ? "Request a Demo" : "Demo anfragen"}
                </Button>
              </DemoRequestModal>
            </div>
          </div>
          <div className="relative h-[400px] w-full rounded-lg shadow-2xl">
            <div className="absolute -top-6 -left-6 h-full w-full rounded-lg border border-teal-200 bg-teal-50"></div>
            <div className="absolute -bottom-6 -right-6 h-full w-full rounded-lg border border-blue-200 bg-blue-50"></div>
            <div className="relative h-full w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
              {/* Using the direct blob URL instead of a local file */}
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hr-recruitment-leadership-teambuilding-select-team-leader-business-concept.jpg-DKyyu1yR5EgxYxuoBkM81I85Y4OR85.jpeg"
                alt="AI-Powered Candidate Selection Interface"
                className="h-full w-full object-cover"
              />

              {/* Corner accents */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-teal-500/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-teal-500/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Separate the CTA section as a client component to use the language context
function CTASection() {
  const { language } = useLanguage()

  return (
    <section className={`relative py-20 text-white overflow-hidden`} style={{ backgroundColor: TEAL_COLOR }}>
      {/* Decorative elements */}
      <DecorativeAccent variant="wave" position="bottom-right" color="secondary" size="lg" className="opacity-20" />
      <DecorativeAccent variant="circles" position="top-left" color="accent" size="lg" className="opacity-10" />

      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=200&width=200&text=pattern')] bg-repeat opacity-5"></div>

      <div className="container relative text-center z-10">
        <h2 className="mb-6 text-3xl font-bold md:text-4xl">
          {language === "EN" ? "Ready to Match Smarter?" : "Bereit für intelligenteres Matching?"}
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-teal-50">
          {language === "EN"
            ? "Join thousands of companies that have streamlined their recruitment process with Recruitify."
            : "Schließen Sie sich Tausenden von Unternehmen an, die ihren Rekrutierungsprozess mit Recruitify optimiert haben."}
        </p>
        <Button
          size="lg"
          className="bg-white hover:bg-teal-50 relative overflow-hidden group"
          style={{ color: TEAL_COLOR }}
        >
          <span className="absolute inset-0 w-0 bg-teal-50 transition-all duration-300 ease-out group-hover:w-full"></span>
          <span className="relative">
            {language === "EN"
              ? "Start for Free – No Credit Card Required"
              : "Kostenlos starten – Keine Kreditkarte erforderlich"}
          </span>
        </Button>
      </div>
    </section>
  )
}

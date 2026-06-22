"use client"
import { ChevronRight, Play, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
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
import StatsSection from "@/components/stats-section"
import HowItWorks from "@/components/how-it-works"
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/animated-section"

const TEAL_COLOR = "#1AB3A6"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />

        {/* Animated Stats Section */}
        <StatsSection />

        {/* How It Works — Hiring Process with large avatars */}
        <div className="relative">
          <AnimatedSection variant="fadeUp">
            <HowItWorks />
          </AnimatedSection>
        </div>

        {/* Recruitment Efficiency Section */}
        <div className="relative">
          <DecorativeAccent variant="wave" position="top-left" color="secondary" size="lg" className="opacity-30" />
          <AnimatedSection variant="fadeUp">
            <RecruitmentEfficiencySection />
          </AnimatedSection>
        </div>

        {/* Features Section */}
        <div className="relative">
          <SectionAccent position="top-right" />
          <DecorativeAccent variant="dots" position="bottom-left" color="accent" size="lg" className="opacity-40" />
          <AnimatedSection variant="fadeUp" delay={0.1}>
            <Features />
          </AnimatedSection>
        </div>

        {/* Product Preview Section */}
        <div className="relative">
          <FloatingElements />
          <AnimatedSection variant="scaleUp" delay={0.05}>
            <ProductPreview />
          </AnimatedSection>
        </div>

        {/* Use Cases Section */}
        <div className="relative">
          <DecorativeAccent variant="circles" position="center-right" color="secondary" size="lg" />
          <AnimatedSection variant="fadeUp" delay={0.1}>
            <UseCases />
          </AnimatedSection>
        </div>

        {/* Pricing Section */}
        <div className="relative overflow-hidden">
          <DecorativeAccent variant="triangle" position="top-left" color="primary" size="lg" className="opacity-20" />
          <DecorativeAccent variant="squares" position="bottom-right" color="accent" size="md" className="opacity-30" />
          <AnimatedSection variant="fadeUp" delay={0.05}>
            <Pricing />
          </AnimatedSection>
        </div>

        {/* Testimonials Section */}
        <Testimonials />

        {/* CTA Repeat Section */}
        <div className="relative">
          <div className="w-full overflow-hidden">
            <svg viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fill={TEAL_COLOR}
                d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              />
            </svg>
          </div>
          <CTASection />
        </div>

        {/* FAQ Section */}
        <div className="relative">
          <DecorativeAccent variant="dots" position="top-right" color="muted" size="md" className="opacity-30" />
          <AnimatedSection variant="fadeUp" delay={0.05}>
            <FaqSection />
          </AnimatedSection>
        </div>

        {/* Contact Section */}
        <div className="relative">
          <DecorativeAccent variant="circles" position="bottom-left" color="primary" size="sm" className="opacity-20" />
          <AnimatedSection variant="fadeUp" delay={0.05}>
            <ContactSection />
          </AnimatedSection>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function HeroSection() {
  const { language } = useLanguage()

  return (
    <section className="relative overflow-hidden bg-white py-20 md:py-32">
      {/* Animated gradient background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-teal-50 via-white to-blue-50 opacity-70" />

      {/* Animated glowing orbs */}
      <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-teal-300/20 blur-3xl animate-orb-1 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-cyan-300/15 blur-3xl animate-orb-2 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-blue-200/20 blur-3xl animate-orb-3 pointer-events-none" />

      {/* Decorative elements */}
      <DecorativeAccent variant="circles" position="top-right" color="primary" size="lg" className="opacity-30" />
      <DecorativeAccent variant="dots" position="bottom-left" color="secondary" size="md" className="opacity-40" />
      <FloatingElements />

      <div className="container relative z-10">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          {/* Left: text content with staggered entrance */}
          <StaggerContainer className="flex flex-col space-y-6">
            <StaggerItem>
              <motion.div
                className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200/60 px-4 py-1.5 text-sm text-teal-700 w-fit"
                whileHover={{ scale: 1.04 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Sparkles className="h-3.5 w-3.5 text-teal-500" />
                {language === "EN" ? "AI-Powered Recruitment" : "KI-gestützte Rekrutierung"}
              </motion.div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                {language === "EN" ? "Smarter Hiring" : "Intelligentere Einstellungen"}
                <br />
                <span className="text-teal-600 relative inline-block">
                  {language === "EN" ? "Starts Here" : "Beginnen Hier"}
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-2 text-teal-200 opacity-70"
                    viewBox="0 0 100 10"
                    preserveAspectRatio="none"
                  >
                    <path d="M0,0 C25,5 75,5 100,0 L100,10 L0,10 Z" fill="currentColor" />
                  </svg>
                </span>
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="max-w-md text-xl text-gray-600">
                {language === "EN"
                  ? "AI-powered matching to find top candidates without résumé chaos."
                  : "KI-gestütztes Matching, um Top-Kandidaten ohne Lebenslauf-Chaos zu finden."}
              </p>
            </StaggerItem>

            <StaggerItem>
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button size="lg" className="bg-teal-600 hover:bg-teal-700 relative overflow-hidden group shadow-lg shadow-teal-500/25">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-teal-500 to-teal-600 group-hover:opacity-90 transition-opacity" />
                    <span className="relative flex items-center">
                      {language === "EN" ? "Try for free" : "Kostenlos testen"}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </span>
                  </Button>
                </motion.div>
                <DemoRequestModal>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-teal-600 text-teal-600 hover:bg-teal-50 gradient-border"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {language === "EN" ? "Request a Demo" : "Demo anfragen"}
                    </Button>
                  </motion.div>
                </DemoRequestModal>
              </div>
            </StaggerItem>

            {/* Social proof mini badges */}
            <StaggerItem>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex -space-x-2">
                  {["SJ", "MC", "TM", "AW"].map((initials, i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm"
                      style={{
                        background: ["#14b8a6", "#8b5cf6", "#f59e0b", "#10b981"][i],
                      }}
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-700">500+</span>{" "}
                  {language === "EN" ? "companies trust RECRUILY" : "Unternehmen vertrauen RECRUILY"}
                </p>
              </div>
            </StaggerItem>
          </StaggerContainer>

          {/* Right: hero image with entrance animation */}
          <motion.div
            initial={{ opacity: 0, x: 48, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[400px] w-full rounded-lg shadow-2xl"
          >
            <div className="absolute -top-6 -left-6 h-full w-full rounded-lg border border-teal-200 bg-teal-50" />
            <div className="absolute -bottom-6 -right-6 h-full w-full rounded-lg border border-blue-200 bg-blue-50" />
            <div className="relative h-full w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hr-recruitment-leadership-teambuilding-select-team-leader-business-concept.jpg-DKyyu1yR5EgxYxuoBkM81I85Y4OR85.jpeg"
                alt="AI-Powered Candidate Selection Interface"
                className="h-full w-full object-cover"
              />
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-teal-500/20 to-transparent" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-teal-500/20 to-transparent" />

              {/* Floating match score badge */}
              <motion.div
                className="absolute bottom-4 right-4 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">{language === "EN" ? "AI Match" : "KI Match"}</div>
                  <div className="text-sm font-bold text-teal-600">94% Fit</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  const { language } = useLanguage()

  return (
    <section className="relative py-20 text-white overflow-hidden" style={{ backgroundColor: TEAL_COLOR }}>
      {/* Animated background grid */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.2) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <DecorativeAccent variant="wave" position="bottom-right" color="secondary" size="lg" className="opacity-20" />
      <DecorativeAccent variant="circles" position="top-left" color="accent" size="lg" className="opacity-10" />

      <AnimatedSection variant="scaleUp" className="container relative z-10 text-center">
        <h2 className="mb-6 text-3xl font-bold md:text-4xl">
          {language === "EN" ? "Ready to Match Smarter?" : "Bereit für intelligenteres Matching?"}
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-teal-50">
          {language === "EN"
            ? "Join 500+ companies that have streamlined their recruitment with RECRUILY."
            : "Schließen Sie sich 500+ Unternehmen an, die ihre Rekrutierung mit RECRUILY optimiert haben."}
        </p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="inline-block"
        >
          <Button
            size="lg"
            className="bg-white hover:bg-teal-50 relative overflow-hidden group shadow-xl shadow-teal-900/30"
            style={{ color: TEAL_COLOR }}
          >
            <span className="absolute inset-0 w-0 bg-teal-50 transition-all duration-300 ease-out group-hover:w-full" />
            <span className="relative font-semibold">
              {language === "EN"
                ? "Start for Free – No Credit Card Required"
                : "Kostenlos starten – Keine Kreditkarte erforderlich"}
            </span>
          </Button>
        </motion.div>
      </AnimatedSection>
    </section>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { AnimatedSection } from "@/components/animated-section"

type Testimonial = {
  id: number
  quote: string
  quoteDE: string
  author: string
  position: string
  positionDE: string
  company: string
  initials: string
  gradient: string
  stars: number
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote:
      "RECRUILY completely transformed our hiring process. We reduced time-to-hire by 60% and found significantly better candidates — in half the time.",
    quoteDE:
      "RECRUILY hat unseren Einstellungsprozess komplett verändert. Wir haben die Einstellungszeit um 60% reduziert und deutlich bessere Kandidaten gefunden — in der halben Zeit.",
    author: "Sarah Johnson",
    position: "HR Director",
    positionDE: "HR-Direktorin",
    company: "TechGrowth GmbH",
    initials: "SJ",
    gradient: "from-teal-400 to-cyan-600",
    stars: 5,
  },
  {
    id: 2,
    quote:
      "The AI matching is incredibly accurate. We now only interview candidates who are truly qualified — the cover letter analysis alone is worth it.",
    quoteDE:
      "Das KI-Matching ist unglaublich präzise. Wir interviewen jetzt nur noch Kandidaten, die wirklich qualifiziert sind — allein die Anschreiben-Analyse ist ihren Preis wert.",
    author: "Michael Chen",
    position: "Talent Acquisition Manager",
    positionDE: "Talent Acquisition Manager",
    company: "Innovate Solutions AG",
    initials: "MC",
    gradient: "from-violet-400 to-purple-600",
    stars: 5,
  },
  {
    id: 3,
    quote:
      "Setup took under 10 minutes. The whole team was using it immediately — no IT needed, no training required. Simply brilliant.",
    quoteDE:
      "Das Setup dauerte unter 10 Minuten. Das gesamte Team nutzte es sofort — keine IT nötig, keine Schulung erforderlich. Einfach brillant.",
    author: "Emma Rodriguez",
    position: "Head of People",
    positionDE: "Head of People",
    company: "Future Finance GmbH",
    initials: "ER",
    gradient: "from-rose-400 to-pink-600",
    stars: 5,
  },
  {
    id: 4,
    quote:
      "As a recruiting agency, we handle dozens of clients. RECRUILY lets us scale 3x without hiring more recruiters. The ROI is exceptional.",
    quoteDE:
      "Als Personalvermittlung betreuen wir dutzende Kunden. RECRUILY ermöglicht uns eine 3-fache Skalierung ohne mehr Recruiter einzustellen. Der ROI ist außergewöhnlich.",
    author: "Thomas Müller",
    position: "CEO",
    positionDE: "Geschäftsführer",
    company: "TopTalent Recruiting",
    initials: "TM",
    gradient: "from-amber-400 to-orange-600",
    stars: 5,
  },
  {
    id: 5,
    quote:
      "DSGVO compliance on EU servers was non-negotiable for us. RECRUILY delivered on every front — security, speed, and match quality.",
    quoteDE:
      "DSGVO-Konformität auf EU-Servern war für uns nicht verhandelbar. RECRUILY hat in jeder Hinsicht geliefert — Sicherheit, Geschwindigkeit und Match-Qualität.",
    author: "Anna Weber",
    position: "CHRO",
    positionDE: "CHRO",
    company: "Mittelstand Plus GmbH",
    initials: "AW",
    gradient: "from-emerald-400 to-teal-600",
    stars: 5,
  },
]

const AUTOPLAY_INTERVAL = 5000

export default function Testimonials() {
  const { language } = useLanguage()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const goTo = (index: number, dir: 1 | -1) => {
    setDirection(dir)
    setCurrentIndex((index + testimonials.length) % testimonials.length)
  }

  const next = () => goTo(currentIndex + 1, 1)
  const prev = () => goTo(currentIndex - 1, -1)

  useEffect(() => {
    if (isPaused) return
    timerRef.current = setInterval(next, AUTOPLAY_INTERVAL)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentIndex, isPaused])

  const t = testimonials[currentIndex]

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.97,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.97,
    }),
  }

  return (
    <section
      id="testimonials"
      className="relative overflow-hidden py-24 md:py-32"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

      {/* Glowing orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container relative z-10">
        {/* Header */}
        <AnimatedSection variant="fadeUp" className="mx-auto max-w-2xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 border border-teal-500/20 px-4 py-1.5 text-sm text-teal-400 mb-4">
            <Star className="h-3.5 w-3.5 fill-teal-400" />
            {language === "EN" ? "Trusted by 500+ companies" : "Vertraut von 500+ Unternehmen"}
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            {language === "EN" ? "Why HR Teams Love " : "Warum HR-Teams "}
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              RECRUILY
            </span>
            {language === "DE" ? " lieben" : ""}
          </h2>
          <p className="mt-4 text-slate-400 text-lg">
            {language === "EN"
              ? "Real results from real companies across the DACH region."
              : "Echte Ergebnisse von echten Unternehmen im DACH-Raum."}
          </p>
        </AnimatedSection>

        {/* Main carousel */}
        <div className="relative mx-auto max-w-4xl">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={t.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="relative"
            >
              <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 md:p-12">
                {/* Quote icon */}
                <div className="absolute -top-5 left-10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-500/25">
                    <Quote className="h-5 w-5 text-white fill-white" />
                  </div>
                </div>

                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote text */}
                <blockquote className="text-xl md:text-2xl font-medium leading-relaxed text-white/90 mb-10">
                  "{language === "EN" ? t.quote : t.quoteDE}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4">
                  {/* Large Avatar */}
                  <div
                    className={`relative h-16 w-16 flex-shrink-0 rounded-2xl bg-gradient-to-br ${t.gradient} flex items-center justify-center shadow-lg`}
                  >
                    <span className="text-xl font-bold text-white">{t.initials}</span>
                    {/* Online indicator */}
                    <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-800 bg-emerald-400" />
                  </div>

                  <div>
                    <div className="font-semibold text-white text-lg">{t.author}</div>
                    <div className="text-slate-400 text-sm">
                      {language === "EN" ? t.position : t.positionDE}
                    </div>
                    <div className="text-teal-400 text-sm font-medium">{t.company}</div>
                  </div>

                  {/* Decorative line */}
                  <div className="ml-auto hidden md:block">
                    <div className={`h-12 w-1 rounded-full bg-gradient-to-b ${t.gradient} opacity-60`} />
                  </div>
                </div>

                {/* Subtle corner glow */}
                <div
                  className={`absolute -bottom-px -right-px h-32 w-32 rounded-br-2xl bg-gradient-to-tl ${t.gradient} opacity-10 blur-xl`}
                />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <button
            onClick={() => { prev(); setIsPaused(true) }}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 h-12 w-12 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/10 hover:border-teal-500/50 transition-all duration-200 hidden md:flex"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={() => { next(); setIsPaused(true) }}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 h-12 w-12 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/10 hover:border-teal-500/50 transition-all duration-200 hidden md:flex"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Dot indicators with progress */}
        <div className="flex items-center justify-center gap-3 mt-10">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > currentIndex ? 1 : -1)}
              className="group relative"
              aria-label={`Go to testimonial ${i + 1}`}
            >
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentIndex ? "w-8 bg-teal-400" : "w-2 bg-white/20 hover:bg-white/40"
                }`}
              />
              {i === currentIndex && !isPaused && (
                <motion.div
                  className="absolute inset-0 h-2 rounded-full bg-teal-400/40"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: AUTOPLAY_INTERVAL / 1000, ease: "linear" }}
                  style={{ transformOrigin: "left" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Mobile nav */}
        <div className="flex justify-center gap-3 mt-6 md:hidden">
          <Button
            variant="outline"
            size="icon"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => { prev(); setIsPaused(true) }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => { next(); setIsPaused(true) }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Company logos ticker */}
        <div className="mt-20 pt-10 border-t border-white/10">
          <p className="text-center text-sm text-slate-500 mb-8 uppercase tracking-widest">
            {language === "EN" ? "Trusted by teams at" : "Vertraut von Teams bei"}
          </p>
          <div className="relative overflow-hidden">
            <div className="flex gap-12 animate-marquee">
              {["TechGrowth", "Innovate AG", "Future Finance", "TopTalent", "Mittelstand+", "Scale GmbH", "Digital HR", "PeopleFirst"].map(
                (name, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 text-slate-500 font-semibold text-lg tracking-wide hover:text-slate-300 transition-colors whitespace-nowrap"
                  >
                    {name}
                  </div>
                )
              )}
              {/* Duplicate for seamless loop */}
              {["TechGrowth", "Innovate AG", "Future Finance", "TopTalent", "Mittelstand+", "Scale GmbH", "Digital HR", "PeopleFirst"].map(
                (name, i) => (
                  <div
                    key={`dup-${i}`}
                    className="flex-shrink-0 text-slate-500 font-semibold text-lg tracking-wide hover:text-slate-300 transition-colors whitespace-nowrap"
                  >
                    {name}
                  </div>
                )
              )}
            </div>
            {/* Fade edges */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-900 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  )
}

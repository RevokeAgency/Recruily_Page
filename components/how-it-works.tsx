"use client"

import type React from "react"
import { FileText, Upload, Award, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { StaggerContainer, StaggerItem } from "@/components/animated-section"
import { useLanguage } from "@/contexts/language-context"

export default function HowItWorks() {
  const { language } = useLanguage()

  const steps = [
    {
      number: 1,
      titleEN: "Upload your job description",
      titleDE: "Stellenbeschreibung hochladen",
      descEN: "Simply upload your job description or create one with our AI-powered assistant.",
      descDE: "Laden Sie Ihre Stellenbeschreibung hoch oder erstellen Sie eine mit unserem KI-Assistenten.",
      icon: <FileText className="h-9 w-9" />,
      gradient: "from-teal-400 to-cyan-500",
      bg: "bg-teal-50",
      ring: "ring-teal-200",
    },
    {
      number: 2,
      titleEN: "Upload candidate résumés",
      titleDE: "Kandidaten-CVs hochladen",
      descEN: "Upload résumés or connect to your existing ATS to import candidates automatically.",
      descDE: "Laden Sie Lebensläufe hoch oder verbinden Sie Ihr bestehendes ATS für automatischen Import.",
      icon: <Upload className="h-9 w-9" />,
      gradient: "from-violet-400 to-purple-500",
      bg: "bg-violet-50",
      ring: "ring-violet-200",
    },
    {
      number: 3,
      titleEN: "Get ranked top candidates",
      titleDE: "Top-Kandidaten erhalten",
      descEN: "Our AI analyzes and ranks candidates based on skills, experience, and cultural fit.",
      descDE: "Unsere KI analysiert und bewertet Kandidaten nach Fähigkeiten, Erfahrung und kultureller Passung.",
      icon: <Award className="h-9 w-9" />,
      gradient: "from-amber-400 to-orange-500",
      bg: "bg-amber-50",
      ring: "ring-amber-200",
    },
  ]

  return (
    <section id="how-it-works" className="bg-white py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            {language === "EN" ? "How It Works" : "So funktioniert es"}
          </h2>
          <p className="text-lg text-gray-600">
            {language === "EN"
              ? "Recruitify simplifies your hiring process in three easy steps"
              : "RECRUILY vereinfacht Ihren Einstellungsprozess in drei einfachen Schritten"}
          </p>
        </div>

        <StaggerContainer className="grid gap-8 md:grid-cols-3" staggerDelay={0.15}>
          {steps.map((step, index) => (
            <StaggerItem key={step.number}>
              <div className="relative flex flex-col items-center text-center">
                {/* Connector line between steps */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[calc(50%+5rem)] right-0 h-px z-0">
                    <div className="h-full w-full bg-gradient-to-r from-gray-300 to-gray-200 relative">
                      <ArrowRight className="absolute -top-3 right-2 h-6 w-6 text-gray-300" />
                    </div>
                  </div>
                )}

                {/* Large Avatar Circle */}
                <motion.div
                  className={`relative z-10 mb-6 h-32 w-32 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white shadow-xl`}
                  whileHover={{ scale: 1.07, rotate: 2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {step.icon}

                  {/* Step number badge */}
                  <div className="absolute -top-3 -right-3 h-9 w-9 rounded-full border-4 border-white bg-gray-900 text-white flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold">{step.number}</span>
                  </div>
                </motion.div>

                <div className={`rounded-xl ${step.bg} ring-1 ${step.ring} p-6 w-full`}>
                  <h3 className="mb-3 text-xl font-semibold text-gray-900">
                    {language === "EN" ? step.titleEN : step.titleDE}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {language === "EN" ? step.descEN : step.descDE}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}

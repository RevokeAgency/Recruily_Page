"use client"

import type React from "react"
import { Rocket, Building2, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"

export default function UseCases() {
  const { language } = useLanguage()

  const useCases = [
    {
      icon: <Rocket className="h-6 w-6" />,
      title:
        language === "EN"
          ? "Startups hiring fast with few resources"
          : "Startups, die schnell mit wenigen Ressourcen einstellen",
      description:
        language === "EN"
          ? "Find the right talent quickly to build your dream team without spending hours on résumés."
          : "Finden Sie schnell die richtigen Talente, um Ihr Traumteam aufzubauen, ohne Stunden mit Lebensläufen zu verbringen.",
    },
    {
      icon: <Building2 className="h-6 w-6" />,
      title:
        language === "EN"
          ? "Recruiting agencies handling many clients"
          : "Personalvermittlungen, die viele Kunden betreuen",
      description:
        language === "EN"
          ? "Scale your operations and serve more clients with AI-powered candidate matching."
          : "Skalieren Sie Ihre Aktivitäten und betreuen Sie mehr Kunden mit KI-gestütztem Kandidaten-Matching.",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title:
        language === "EN"
          ? "In-house HR teams overwhelmed with CVs"
          : "Interne HR-Teams, die mit Lebensläufen überlastet sind",
      description:
        language === "EN"
          ? "Focus on strategic HR initiatives while AI handles the initial screening process."
          : "Konzentrieren Sie sich auf strategische HR-Initiativen, während KI den ersten Auswahlprozess übernimmt.",
    },
  ]

  return (
    <section id="use-cases" className="bg-gray-50 py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            {language === "EN" ? "Use Cases" : "Anwendungsfälle"}
          </h2>
          <p className="mb-12 text-lg text-gray-600">
            {language === "EN"
              ? "See how different organizations benefit from Recruitify"
              : "Sehen Sie, wie verschiedene Organisationen von Recruitify profitieren"}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {useCases.map((useCase, index) => (
            <UseCaseCard key={index} icon={useCase.icon} title={useCase.title} description={useCase.description} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface UseCaseCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function UseCaseCard({ icon, title, description }: UseCaseCardProps) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="flex flex-col items-center p-6 text-center">
        <div className="mb-4 rounded-full bg-sky-100 p-3 text-sky-600">{icon}</div>
        <h3 className="mb-2 text-xl font-medium">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

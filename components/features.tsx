"use client"

import type React from "react"
import { Sparkles, FileText, BarChart, Users, Shield, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"

export default function Features() {
  const { language } = useLanguage()

  const features = [
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: language === "EN" ? "AI Résumé & Job Matching" : "KI-Lebenslauf & Job-Matching",
      description:
        language === "EN"
          ? "Our advanced algorithms find candidates that perfectly match your requirements, saving you hours of manual screening."
          : "Unsere fortschrittlichen Algorithmen finden Kandidaten, die perfekt zu Ihren Anforderungen passen und sparen Ihnen Stunden manueller Durchsicht.",
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: language === "EN" ? "Instant Résumé Summarization" : "Sofortige Lebenslaufzusammenfassung",
      description:
        language === "EN"
          ? "Get concise summaries of candidate qualifications and experience without reading through lengthy résumés."
          : "Erhalten Sie präzise Zusammenfassungen der Qualifikationen und Erfahrungen von Kandidaten, ohne lange Lebensläufe durchlesen zu müssen.",
    },
    {
      icon: <BarChart className="h-6 w-6" />,
      title: language === "EN" ? "Match Score with Explanation" : "Übereinstimmungswert mit Erklärung",
      description:
        language === "EN"
          ? "Understand exactly why a candidate is a good fit with detailed match explanations and scoring."
          : "Verstehen Sie genau, warum ein Kandidat gut passt, mit detaillierten Erklärungen und Bewertungen.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: language === "EN" ? "Multi-user Team Access" : "Multi-User-Teamzugriff",
      description:
        language === "EN"
          ? "Collaborate with your team members on hiring decisions with role-based permissions and shared candidate pools."
          : "Arbeiten Sie mit Ihren Teammitgliedern an Einstellungsentscheidungen mit rollenbasierten Berechtigungen und gemeinsamen Kandidatenpools.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: language === "EN" ? "GDPR-Compliant & Secure" : "DSGVO-konform & sicher",
      description:
        language === "EN"
          ? "Your data is encrypted and handled according to the strictest privacy standards. We're fully GDPR compliant."
          : "Ihre Daten werden verschlüsselt und nach den strengsten Datenschutzstandards behandelt. Wir sind vollständig DSGVO-konform.",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: language === "EN" ? "Easy Setup – No IT Required" : "Einfache Einrichtung – Keine IT erforderlich",
      description:
        language === "EN"
          ? "Get started in minutes with our intuitive interface. No technical knowledge required."
          : "Starten Sie in Minuten mit unserer intuitiven Benutzeroberfläche. Keine technischen Kenntnisse erforderlich.",
    },
  ]

  return (
    <section id="features" className="bg-white py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
            {language === "EN" ? "Powerful Features" : "Leistungsstarke Funktionen"}
          </h2>
          <p className="mb-12 text-lg text-gray-600">
            {language === "EN"
              ? "Everything you need to streamline your recruitment process"
              : "Alles, was Sie brauchen, um Ihren Rekrutierungsprozess zu optimieren"}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={index} icon={feature.icon} title={feature.title} description={feature.description} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="flex flex-col items-center p-6 text-center">
        <div className="mb-4 rounded-full bg-teal-100 p-3 text-teal-600">{icon}</div>
        <h3 className="mb-2 text-xl font-medium">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

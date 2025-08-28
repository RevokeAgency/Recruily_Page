"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

export default function ProductPreview() {
  const { language } = useLanguage()

  return (
    <section className="container py-12 md:py-16 lg:py-24">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          {language === "EN" ? "Your Dashboard at a Glance" : "Ihr Dashboard auf einen Blick"}
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          {language === "EN"
            ? "See all jobs, candidates, and matching scores in one clean view."
            : "Sehen Sie alle Jobs, Kandidaten und Matching-Ergebnisse in einer übersichtlichen Ansicht."}
        </p>
      </div>

      <div className="mt-12 overflow-hidden rounded-lg border bg-white shadow-xl">
        <div className="flex h-12 items-center border-b bg-slate-50 px-4">
          <div className="flex space-x-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <div className="mx-auto flex h-6 w-80 items-center justify-center rounded-full bg-white text-xs text-slate-500">
            app.recruitify.io/dashboard
          </div>
        </div>
        <div className="relative h-[500px] w-full">
          <Image
            src="/placeholder.svg?height=1000&width=1920&text=Recruitify+Dashboard+Preview"
            alt={language === "EN" ? "Recruitify Dashboard Preview" : "Recruitify Dashboard Vorschau"}
            fill
            className="object-cover"
          />
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
          {language === "EN"
            ? "Our intuitive dashboard gives your HR team a complete overview of all job postings, candidates, and matches in one place. Track progress, collaborate with team members, and make data-driven hiring decisions."
            : "Unser intuitives Dashboard gibt Ihrem HR-Team einen vollständigen Überblick über alle Stellenausschreibungen, Kandidaten und Matches an einem Ort. Verfolgen Sie den Fortschritt, arbeiten Sie mit Teammitgliedern zusammen und treffen Sie datengestützte Einstellungsentscheidungen."}
        </p>
        <Button className="bg-teal-600 hover:bg-teal-700">
          {language === "EN" ? "See the full dashboard" : "Vollständiges Dashboard ansehen"}
        </Button>
      </div>
    </section>
  )
}

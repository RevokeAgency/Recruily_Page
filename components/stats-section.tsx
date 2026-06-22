"use client"

import { useLanguage } from "@/contexts/language-context"
import { AnimatedCounter, StaggerContainer, StaggerItem } from "@/components/animated-section"
import { TrendingUp, Clock, DollarSign, BarChart3 } from "lucide-react"

const stats = [
  {
    icon: Clock,
    valueFrom: 0,
    valueTo: 60,
    suffix: "%",
    labelEN: "Faster Hiring",
    labelDE: "Schnellere Einstellung",
    descEN: "Reduction in time-to-hire",
    descDE: "Reduzierung der Einstellungszeit",
    gradient: "from-teal-400 to-cyan-500",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
  },
  {
    icon: TrendingUp,
    valueFrom: 0,
    valueTo: 45,
    suffix: "%",
    labelEN: "Better Quality",
    labelDE: "Bessere Qualität",
    descEN: "Improvement in candidate fit",
    descDE: "Verbesserung der Kandidatenpassung",
    gradient: "from-violet-400 to-purple-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
  {
    icon: DollarSign,
    valueFrom: 0,
    valueTo: 35,
    suffix: "%",
    labelEN: "Cost Reduction",
    labelDE: "Kostenreduzierung",
    descEN: "Lower cost per hire",
    descDE: "Geringere Kosten pro Einstellung",
    gradient: "from-emerald-400 to-green-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    icon: BarChart3,
    valueFrom: 0,
    valueTo: 10,
    suffix: "x",
    labelEN: "Return on Investment",
    labelDE: "Return on Investment",
    descEN: "Average ROI in first year",
    descDE: "Durchschnittlicher ROI im ersten Jahr",
    gradient: "from-amber-400 to-orange-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
]

export default function StatsSection() {
  const { language } = useLanguage()

  return (
    <section className="relative py-16 md:py-20 bg-white overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />

      <div className="container relative z-10">
        <StaggerContainer className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <StaggerItem key={i}>
                <div
                  className={`relative rounded-2xl border ${stat.border} ${stat.bg} p-6 text-center hover:scale-105 transition-transform duration-300`}
                >
                  <div
                    className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  <div
                    className={`text-4xl font-bold bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`}
                  >
                    <AnimatedCounter from={stat.valueFrom} to={stat.valueTo} suffix={stat.suffix} duration={1.8} />
                  </div>

                  <div className="mt-1 font-semibold text-gray-900 text-sm">
                    {language === "EN" ? stat.labelEN : stat.labelDE}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {language === "EN" ? stat.descEN : stat.descDE}
                  </div>
                </div>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      </div>
    </section>
  )
}

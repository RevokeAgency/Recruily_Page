import type React from "react"
import { Sparkles, FileText, BarChart, Zap, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function FeaturesSection() {
  return (
    <section id="features" className="container space-y-12 bg-slate-50 py-12 md:py-16 lg:py-24">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Powerful Features</h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Everything you need to streamline your recruitment process.
        </p>
      </div>
      <div className="mx-auto grid justify-center gap-8 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          title="AI-Powered Matching Engine"
          description="Our advanced algorithms find candidates that perfectly match your requirements."
          icon={<Sparkles className="h-6 w-6" />}
        />
        <FeatureCard
          title="Instant Résumé Summaries"
          description="Get concise summaries of candidate qualifications and experience."
          icon={<FileText className="h-6 w-6" />}
        />
        <FeatureCard
          title="Candidate Fit Score & Explanation"
          description="Understand exactly why a candidate is a good fit with detailed match explanations."
          icon={<BarChart className="h-6 w-6" />}
        />
        <FeatureCard
          title="Simple Setup – No IT Required"
          description="Get started in minutes with no IT support needed."
          icon={<Zap className="h-6 w-6" />}
        />
        <FeatureCard
          title="Multi-user Access for Teams"
          description="Collaborate with your team members on hiring decisions."
          icon={<Users className="h-6 w-6" />}
        />
      </div>
    </section>
  )
}

interface FeatureCardProps {
  title: string
  description: string
  icon: React.ReactNode
}

function FeatureCard({ title, description, icon }: FeatureCardProps) {
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

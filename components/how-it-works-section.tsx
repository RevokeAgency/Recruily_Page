import type React from "react"
import { FileText, Cpu, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="container space-y-12 py-12 md:py-16 lg:py-24">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Our AI-powered platform simplifies your hiring process in just three easy steps.
        </p>
      </div>
      <div className="mx-auto grid justify-center gap-8 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
        <StepCard
          step={1}
          title="Upload Your Job Description"
          description="Simply upload your job description and requirements to get started."
          icon={<FileText className="h-6 w-6" />}
        />
        <StepCard
          step={2}
          title="Let AI Analyze Résumés"
          description="Our AI analyzes thousands of profiles to find your perfect match."
          icon={<Cpu className="h-6 w-6" />}
        />
        <StepCard
          step={3}
          title="Interview Only the Best Candidates"
          description="Focus your time on candidates that truly fit your requirements."
          icon={<Users className="h-6 w-6" />}
        />
      </div>
    </section>
  )
}

interface StepCardProps {
  step: number
  title: string
  description: string
  icon: React.ReactNode
}

function StepCard({ step, title, description, icon }: StepCardProps) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="flex flex-col items-center p-6 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white">
          <span className="text-xl font-bold">{step}</span>
        </div>
        <div className="mb-4 rounded-full bg-teal-100 p-3 text-teal-600">{icon}</div>
        <h3 className="mb-2 text-xl font-medium">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

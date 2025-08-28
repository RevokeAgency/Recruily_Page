import type React from "react"
import { FileText, Upload, Award } from "lucide-react"

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">How It Works</h2>
          <p className="mb-12 text-lg text-gray-600">Recruitify simplifies your hiring process in three easy steps</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <StepCard
            number={1}
            title="Upload your job description"
            description="Simply upload your job description or create one with our AI-powered assistant."
            icon={<FileText className="h-8 w-8" />}
          />
          <StepCard
            number={2}
            title="Upload or connect candidate résumés"
            description="Upload résumés or connect to your existing ATS to import candidates automatically."
            icon={<Upload className="h-8 w-8" />}
          />
          <StepCard
            number={3}
            title="Let Recruitify match and rank the top candidates"
            description="Our AI analyzes and ranks candidates based on skills, experience, and cultural fit."
            icon={<Award className="h-8 w-8" />}
          />
        </div>
      </div>
    </section>
  )
}

interface StepCardProps {
  number: number
  title: string
  description: string
  icon: React.ReactNode
}

function StepCard({ number, title, description, icon }: StepCardProps) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-gray-100 bg-white p-8 text-center shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-teal-600">
        {icon}
      </div>
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-white">
        <span className="text-lg font-bold">{number}</span>
      </div>
      <h3 className="mb-3 mt-4 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

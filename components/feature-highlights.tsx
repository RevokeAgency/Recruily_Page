import type React from "react"
import { Sparkles, FileText, BarChart, Users, Zap } from "lucide-react"
import Image from "next/image"

export default function FeatureHighlights() {
  return (
    <section id="features" className="bg-gray-50 py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">Feature Highlights</h2>
          <p className="mb-12 text-lg text-gray-600">Powerful tools to streamline your recruitment process</p>
        </div>

        <div className="grid gap-12 md:grid-cols-2">
          <div className="space-y-12">
            <FeatureItem
              icon={<Sparkles className="h-6 w-6" />}
              title="AI Matching Engine with transparency"
              description="Our AI analyzes job requirements and candidate profiles to find the perfect match, with clear explanations of why each candidate is a good fit."
            />
            <FeatureItem
              icon={<FileText className="h-6 w-6" />}
              title="Instant Résumé Summaries"
              description="Get concise summaries of candidate qualifications, skills, and experience without reading through lengthy résumés."
            />
            <FeatureItem
              icon={<BarChart className="h-6 w-6" />}
              title="Candidate Ranking + Score Explanation"
              description="Each candidate receives a match score with detailed explanations of strengths and potential gaps."
            />
          </div>

          <div className="space-y-12">
            <FeatureItem
              icon={<Users className="h-6 w-6" />}
              title="Multi-user Dashboard for HR teams"
              description="Collaborate with your team, share notes, and make hiring decisions together in a centralized platform."
            />
            <FeatureItem
              icon={<Zap className="h-6 w-6" />}
              title="Fast setup, no IT skills needed"
              description="Get started in minutes with our intuitive interface. No technical knowledge required."
            />
            <div className="relative h-[200px] overflow-hidden rounded-lg border border-gray-200 shadow-md md:h-[220px]">
              <Image
                src="/placeholder.svg?height=440&width=640&text=Feature+Demo"
                alt="Feature demonstration"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

interface FeatureItemProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex">
      <div className="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
        {icon}
      </div>
      <div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  )
}

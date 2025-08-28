import type React from "react"
import { Rocket, Building2, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function UseCasesSection() {
  return (
    <section className="container space-y-12 py-12 md:py-16 lg:py-24">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Use Cases</h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Recruitify helps companies of all sizes streamline their hiring process.
        </p>
      </div>
      <div className="mx-auto grid justify-center gap-8 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
        <UseCaseCard
          title="Startups hiring their first team"
          description="Find the right talent to build your dream team without spending hours on résumés."
          icon={<Rocket className="h-6 w-6" />}
        />
        <UseCaseCard
          title="Recruitment agencies handling many clients"
          description="Scale your operations and serve more clients with AI-powered candidate matching."
          icon={<Building2 className="h-6 w-6" />}
        />
        <UseCaseCard
          title="HR departments with limited time"
          description="Focus on strategic HR initiatives while AI handles the initial screening process."
          icon={<Clock className="h-6 w-6" />}
        />
      </div>
    </section>
  )
}

interface UseCaseCardProps {
  title: string
  description: string
  icon: React.ReactNode
}

function UseCaseCard({ title, description, icon }: UseCaseCardProps) {
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

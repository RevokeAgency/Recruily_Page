import { FileText, Cpu, Users, type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface HowItWorksCardProps {
  step: number
  title: string
  description: string
  icon: string
}

export default function HowItWorksCard({ step, title, description, icon }: HowItWorksCardProps) {
  const getIcon = (): LucideIcon => {
    switch (icon) {
      case "FileText":
        return FileText
      case "Cpu":
        return Cpu
      case "Users":
        return Users
      default:
        return FileText
    }
  }

  const Icon = getIcon()

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="flex flex-col items-center p-6 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white">
          <span className="text-xl font-bold">{step}</span>
        </div>
        <div className="mb-4 rounded-full bg-teal-100 p-3 text-teal-600">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-xl font-medium">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

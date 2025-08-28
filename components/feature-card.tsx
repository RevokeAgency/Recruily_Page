import { BarChart, FileText, Sparkles, Zap, Users, Cpu, type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface FeatureCardProps {
  title: string
  description: string
  icon: string
}

export default function FeatureCard({ title, description, icon }: FeatureCardProps) {
  const getIcon = (): LucideIcon => {
    switch (icon) {
      case "BarChart":
        return BarChart
      case "FileText":
        return FileText
      case "Sparkles":
        return Sparkles
      case "Zap":
        return Zap
      case "Users":
        return Users
      case "Cpu":
        return Cpu
      default:
        return Sparkles
    }
  }

  const Icon = getIcon()

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="flex flex-col items-center p-6 text-center">
        <div className="mb-4 rounded-full bg-teal-100 p-3 text-teal-600">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-xl font-medium">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

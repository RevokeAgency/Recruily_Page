"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase-client"
import { useLanguage } from "@/contexts/language-context"

interface Step {
  id: string
  title: string
  description: string
  href: string
  completed: boolean
  current: boolean
}

export function WorkflowGuide() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const supabase = createClient()
  const [steps, setSteps] = useState<Step[]>([
    {
      id: "job",
      title: "Upload Job Description",
      description: "Upload a job description or provide a link to start the recruitment process.",
      href: "/dashboard/jobs/new",
      completed: false,
      current: true,
    },
    {
      id: "cv",
      title: "Upload Candidate CVs",
      description: "Upload CVs of applicants to be matched with the job description.",
      href: "/dashboard/candidates",
      completed: false,
      current: false,
    },
    {
      id: "match",
      title: "Review Matches",
      description: "Review AI-powered matches between candidates and job descriptions.",
      href: "/dashboard/matches",
      completed: false,
      current: false,
    },
  ])

  // Check workflow progress on component mount
  useEffect(() => {
    const checkWorkflowProgress = async () => {
      if (!user?.app_metadata?.org_id) return

      try {
        // Check if there are any jobs
        const { count: jobCount } = await supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .eq("org_id", user.app_metadata.org_id)

        // Check if there are any candidates
        const { count: candidateCount } = await supabase
          .from("candidates")
          .select("*", { count: "exact", head: true })
          .eq("organisation_id", user.app_metadata.org_id)

        // Check if there are any matches
        const { count: matchCount } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("org_id", user.app_metadata.org_id)

        // Update steps based on counts
        setSteps((prevSteps) => {
          const newSteps = [...prevSteps]

          // If there are jobs, mark the job step as completed
          if (jobCount && jobCount > 0) {
            newSteps[0].completed = true
            newSteps[0].current = false
            newSteps[1].current = candidateCount === 0
          }

          // If there are candidates, mark the CV step as completed
          if (candidateCount && candidateCount > 0) {
            newSteps[1].completed = true
            newSteps[1].current = false
            newSteps[2].current = matchCount === 0
          }

          // If there are matches, mark the match step as completed
          if (matchCount && matchCount > 0) {
            newSteps[2].completed = true
            newSteps[2].current = false
          }

          return newSteps
        })
      } catch (error) {
        console.error("Error checking workflow progress:", error)
      }
    }

    checkWorkflowProgress()
  }, [user, supabase])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("recruitmentWorkflow")}</CardTitle>
        <CardDescription>
          {t("recruitmentWorkflow") === "Recruitment Workflow"
            ? "Follow these steps to streamline your recruitment process"
            : "Folgen Sie diesen Schritten, um Ihren Rekrutierungsprozess zu optimieren"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex">
              <div className="flex flex-col items-center mr-4">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2",
                    step.completed
                      ? "border-primary bg-primary text-primary-foreground"
                      : step.current
                        ? "border-primary text-primary"
                        : "border-muted-foreground/20 text-muted-foreground",
                  )}
                >
                  {step.completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                </div>
                {index < steps.length - 1 && <div className="h-14 w-0.5 bg-muted-foreground/20 my-1" />}
              </div>
              <div className="flex-1 pt-1 pb-8">
                <h3
                  className={cn(
                    "text-lg font-medium",
                    step.completed ? "text-primary" : step.current ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.id === "job" ? t("defineJob") : step.id === "cv" ? t("uploadResumes") : t("reviewMatches")}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.id === "job"
                    ? t("defineJobDescription")
                    : step.id === "cv"
                      ? t("uploadResumesDescription")
                      : t("reviewMatchesDescription")}
                </p>
                {step.current && (
                  <Button asChild className="mt-4 bg-teal-600 hover:bg-teal-700" size="sm">
                    <Link href={step.href}>
                      {t("start")} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {step.completed && (
                  <p className="text-sm text-primary mt-2 flex items-center">
                    <CheckCircle2 className="mr-1 h-4 w-4" /> {t("review") === "Review" ? "Completed" : "Abgeschlossen"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <p className="text-sm text-muted-foreground">
          {t("recruitmentWorkflow") === "Recruitment Workflow"
            ? "Complete all steps to get the best matching results for your job openings."
            : "Schließen Sie alle Schritte ab, um die besten Matching-Ergebnisse für Ihre Stellenangebote zu erhalten."}
        </p>
      </CardFooter>
    </Card>
  )
}

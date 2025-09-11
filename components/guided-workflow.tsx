"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileText, Upload, PieChart, Check, ArrowRight, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabaseClient"
import CvUploadModal from "@/components/cv-upload-modal"

interface GuidedWorkflowProps {
  className?: string
}

export default function GuidedWorkflow({ className }: GuidedWorkflowProps) {
  const router = useRouter()
  const { language } = useLanguage()
  const { user } = useAuth()
  const [isCvModalOpen, setIsCvModalOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [stats, setStats] = useState({
    jobsCount: 0,
    candidatesCount: 0,
    matchesCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Fetch stats to determine current step
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.app_metadata?.org_id) return

      setIsLoading(true)
      try {
        // Use centralized Supabase client

        // Get job count
        const { count: jobCount } = await supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .eq("org_id", user.app_metadata.org_id)

        // Get candidate count
        const { count: candidateCount } = await supabase
          .from("candidates")
          .select("*", { count: "exact", head: true })
          .eq("organisation_id", user.app_metadata.org_id)

        // Get match count
        const { count: matchCount } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("org_id", user.app_metadata.org_id)

        // Get recent job for CV upload
        const { data: recentJobs } = await supabase
          .from("jobs")
          .select("id")
          .eq("org_id", user.app_metadata.org_id)
          .order("created_at", { ascending: false })
          .limit(1)

        if (recentJobs && recentJobs.length > 0) {
          setSelectedJobId(recentJobs[0].id)
        }

        setStats({
          jobsCount: jobCount || 0,
          candidatesCount: candidateCount || 0,
          matchesCount: matchCount || 0,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [user])

  // Determine the current step based on counts
  const currentStep = stats.jobsCount === 0 ? 1 : stats.candidatesCount === 0 ? 2 : stats.matchesCount === 0 ? 3 : 4

  if (isLoading) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{language === "EN" ? "Recruitment Workflow" : "Rekrutierungs-Workflow"}</CardTitle>
        <CardDescription>
          {language === "EN"
            ? "Follow these steps to find the best candidates for your jobs"
            : "Folgen Sie diesen Schritten, um die besten Kandidaten für Ihre Jobs zu finden"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Step 1: Create Job */}
          <div className="flex items-start gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                currentStep > 1 ? "bg-teal-600 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > 1 ? <Check className="h-5 w-5" /> : "1"}
            </div>
            <div className="space-y-2">
              <p className="font-medium">
                {language === "EN" ? "Create a Job Posting" : "Stellenausschreibung erstellen"}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === "EN"
                  ? "Upload a job description or create one from scratch"
                  : "Laden Sie eine Stellenbeschreibung hoch oder erstellen Sie eine von Grund auf"}
              </p>
              {currentStep === 1 && (
                <Button
                  className="mt-2 bg-teal-600 hover:bg-teal-700"
                  onClick={() => router.push("/dashboard/jobs/new")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {language === "EN" ? "Create Job" : "Job erstellen"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Step 2: Upload CVs */}
          <div className="flex items-start gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                currentStep > 2
                  ? "bg-teal-600 text-white"
                  : currentStep === 2
                    ? "bg-blue-600 text-white"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > 2 ? <Check className="h-5 w-5" /> : "2"}
            </div>
            <div className="space-y-2">
              <p className="font-medium">
                {language === "EN" ? "Upload Candidate CVs" : "Kandidaten-Lebensläufe hochladen"}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === "EN"
                  ? "Upload CVs to match with your job posting"
                  : "Laden Sie Lebensläufe hoch, um sie mit Ihrer Stellenausschreibung abzugleichen"}
              </p>
              {currentStep === 2 && (
                <Button
                  className="mt-2 bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsCvModalOpen(true)}
                  disabled={!selectedJobId}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {language === "EN" ? "Upload CVs" : "CVs hochladen"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Step 3: Review Matches */}
          <div className="flex items-start gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                currentStep > 3
                  ? "bg-teal-600 text-white"
                  : currentStep === 3
                    ? "bg-blue-600 text-white"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > 3 ? <Check className="h-5 w-5" /> : "3"}
            </div>
            <div className="space-y-2">
              <p className="font-medium">{language === "EN" ? "Review AI Matches" : "KI-Matches überprüfen"}</p>
              <p className="text-sm text-muted-foreground">
                {language === "EN"
                  ? "Review AI-matched candidates for your job"
                  : "Überprüfen Sie KI-gematchte Kandidaten für Ihren Job"}
              </p>
              {currentStep === 3 && (
                <Button
                  className="mt-2 bg-blue-600 hover:bg-blue-700"
                  onClick={() => router.push("/dashboard/matches")}
                >
                  <PieChart className="mr-2 h-4 w-4" />
                  {language === "EN" ? "View Matches" : "Matches anzeigen"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Step 4: Manage Recruitment */}
          <div className="flex items-start gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                currentStep === 4 ? "bg-teal-600 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep === 4 ? <Check className="h-5 w-5" /> : "4"}
            </div>
            <div className="space-y-2">
              <p className="font-medium">
                {language === "EN" ? "Manage Recruitment Process" : "Rekrutierungsprozess verwalten"}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === "EN"
                  ? "Track candidates through your recruitment pipeline"
                  : "Verfolgen Sie Kandidaten durch Ihre Rekrutierungspipeline"}
              </p>
              {currentStep === 4 && (
                <Button
                  className="mt-2 bg-teal-600 hover:bg-teal-700"
                  onClick={() => router.push("/dashboard/candidates")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {language === "EN" ? "Manage Candidates" : "Kandidaten verwalten"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* CV Upload Modal */}
      <CvUploadModal open={isCvModalOpen} onOpenChange={setIsCvModalOpen} jobId={selectedJobId} />
    </Card>
  )
}

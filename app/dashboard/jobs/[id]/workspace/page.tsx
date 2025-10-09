"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useJobs } from "@/hooks/use-jobs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  Plus,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Import Job interface from useJobs hook
import type { Job } from "@/hooks/use-jobs"
// Import enhanced components
import JobApplicationsTab from '@/components/job-applications-tab'
import { InviteCandidatesModal } from '@/components/invite-candidates-modal'

export default function JobWorkspace() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { getJobById, loading: jobsLoading } = useJobs()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const jobId = params.id as string
  const job = jobId ? getJobById(jobId) : null

  useEffect(() => {
    const initializeWorkspace = async () => {
      try {
        console.log("🔍 Loading job workspace for ID:", jobId)
        
        // Wait for jobs to load
        if (!jobsLoading) {
          if (job) {
            toast({
              title: "Workspace Loaded",
              description: `Job workspace for "${job.title}" is ready.`,
              variant: "default"
            })
          } else if (jobId) {
            setError("Job not found")
          }
          setLoading(false)
        }
      } catch (err) {
        console.error("Error loading workspace:", err)
        setError("Failed to load job workspace")
        setLoading(false)
      }
    }

    if (jobId) {
      initializeWorkspace()
    }
  }, [jobId, job, jobsLoading, toast])

  if (loading || jobsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading job workspace...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Job Not Found</h2>
            <p className="text-gray-600 mt-2">{error || "The requested job workspace could not be loaded."}</p>
          </div>
          <Button onClick={() => router.push("/dashboard/jobs")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push("/dashboard/jobs")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-gray-600">{job.company} • {job.location || "Remote"}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={job.status === 'active' ? 'default' : 'secondary'} className="capitalize">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {job.status}
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-2xl font-bold">{job.applications_count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Matches</p>
                <p className="text-2xl font-bold">{job.matches_count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Posted</p>
                <p className="text-2xl font-bold">
                  {job.created_at ? new Date(job.created_at).toLocaleDateString() : new Date(job.posted_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Type</p>
                <p className="text-lg font-semibold capitalize">{(job.type || 'full-time').replace('-', ' ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Job Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Job Details
                </CardTitle>
                <CardDescription>
                  Complete job information and requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{job.salary_range || "Salary not specified"}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{job.description}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Requirements</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    {Array.isArray(job.requirements) ? 
                      job.requirements.map((req, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{req}</span>
                        </div>
                      )) :
                      (job.requirements || "No specific requirements listed").split('\n').map((req, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{req}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {(job.technical_skills || "").split(',').filter(skill => skill.trim()).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill.trim()}
                      </Badge>
                    ))}
                    {(!job.technical_skills || !job.technical_skills.trim()) && (
                      <span className="text-sm text-gray-500">No skills specified</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your job posting and applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full justify-start" 
                  size="lg"
                  onClick={() => setShowInviteModal(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Invite Candidates
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <FileText className="mr-2 h-4 w-4" />
                  Edit Job Posting
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Applications
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="applications">
          <JobApplicationsTab jobId={jobId} />
        </TabsContent>

        <TabsContent value="candidates">
          <Card>
            <CardHeader>
              <CardTitle>Candidate Pool</CardTitle>
              <CardDescription>
                Browse and match potential candidates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">AI Matching Coming Soon</h3>
                <p className="text-gray-600 mb-4">
                  Our AI will automatically match qualified candidates to your job posting.
                </p>
                <Button variant="outline">Learn More</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Job Performance Analytics</CardTitle>
              <CardDescription>
                Track how your job posting is performing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                <p className="text-gray-600 mb-4">
                  Detailed analytics and insights will be available here.
                </p>
                <Button variant="outline">View Reports</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Invite Candidates Modal */}
      <InviteCandidatesModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        jobId={jobId}
        jobTitle={job.title}
        onCandidateAdded={(candidate) => {
          console.log('New candidate added:', candidate)
          toast({
            title: "Candidate Added",
            description: `${candidate.name} has been successfully processed and matched.`,
            variant: "default"
          })
        }}
      />
    </div>
  )
}
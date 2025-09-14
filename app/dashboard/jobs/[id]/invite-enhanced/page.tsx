"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useJobs } from "@/hooks/use-jobs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import InviteCandidatesModal from "@/components/invite-candidates-modal"
import { 
  ArrowLeft, 
  Users, 
  FileText,
  Briefcase,
  MapPin,
  AlertCircle,
  Plus
} from "lucide-react"

export default function InviteCandidatesEnhanced() {
  const params = useParams()
  const router = useRouter()
  const { getJobById } = useJobs()
  
  const jobId = params.id as string
  const job = jobId ? getJobById(jobId) : null

  const [isModalOpen, setIsModalOpen] = useState(true)

  const handleCandidateAdded = (candidate: any) => {
    console.log('✅ Candidate added successfully:', candidate)
    // Redirect back to workspace applications tab
    router.push(`/dashboard/jobs/${jobId}/workspace?tab=applications`)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    // Redirect back to workspace
    router.push(`/dashboard/jobs/${jobId}/workspace`)
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Job Not Found</h2>
            <p className="text-gray-600 mt-2">The requested job could not be loaded.</p>
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
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/dashboard/jobs/${jobId}/workspace`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workspace
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invite Candidates</h1>
            <p className="text-gray-600">Add candidates to {job.title} at {job.company}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Job Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-lg">{job.title}</h4>
                <p className="text-gray-600">{job.company}</p>
              </div>
              
              {job.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </div>
              )}
              
              {job.salary_range && (
                <div className="text-sm text-gray-600">
                  <strong>Salary:</strong> {job.salary_range}
                </div>
              )}
              
              {job.technical_skills && (
                <div>
                  <h5 className="font-medium text-sm mb-2">Required Skills:</h5>
                  <div className="flex flex-wrap gap-1">
                    {job.technical_skills.split(',').slice(0, 6).map((skill: string, index: number) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Instructions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Candidate Invitation Options
              </CardTitle>
              <CardDescription>
                Multiple ways to add candidates to your job posting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <FileText className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <h4 className="font-medium mb-2">Upload CV</h4>
                  <p className="text-sm text-gray-600">
                    Upload PDF, DOCX, or TXT files to automatically extract candidate information using AI.
                  </p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
                  <h4 className="font-medium mb-2">LinkedIn Import</h4>
                  <p className="text-sm text-gray-600">
                    Import candidate profiles directly from LinkedIn URLs or other professional websites.
                  </p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <Plus className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                  <h4 className="font-medium mb-2">Manual Entry</h4>
                  <p className="text-sm text-gray-600">
                    Manually enter candidate information with a comprehensive form interface.
                  </p>
                </div>
              </div>
              
              <div className="text-center py-8">
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-teal-600 hover:bg-teal-700"
                  size="lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Start Inviting Candidates
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Invite Candidates Modal */}
      <InviteCandidatesModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        jobId={jobId}
        onCandidateAdded={handleCandidateAdded}
      />
    </div>
  )
}
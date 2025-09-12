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

// Applications Tab Component
function ApplicationsTab({ jobId }: { jobId: string }) {
  const { toast } = useToast()
  const router = useRouter()
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        console.log("📋 Fetching matches for job:", jobId)
        
        const response = await fetch(`/api/matches?jobId=${jobId}`)
        const data = await response.json()
        
        if (data.success) {
          setMatches(data.matches || [])
          console.log(`✅ Found ${data.matches?.length || 0} matches`)
        } else {
          console.warn("⚠️ Failed to fetch matches:", data.error)
        }
      } catch (error) {
        console.error("❌ Error fetching matches:", error)
      } finally {
        setLoading(false)
      }
    }

    if (jobId) {
      fetchMatches()
    }
  }, [jobId])

  const handleStatusChange = async (matchId: string, newStatus: string) => {
    try {
      console.log(`🔄 Updating match status: ${matchId} → ${newStatus}`)
      
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        setMatches(prev => prev.map(match => 
          match.id === matchId ? { ...match, status: newStatus } : match
        ))
        toast({
          title: "Status Updated",
          description: `Candidate status changed to ${newStatus}`
        })
      }
    } catch (error) {
      console.error("❌ Error updating status:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update candidate status",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            Loading candidate applications...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">Loading applications...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            Manage and review job applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-600 mb-4">
              Applications will appear here once you invite candidates to this job.
            </p>
            <Button onClick={() => router.push(`/dashboard/jobs/${jobId}/invite`)}>
              <Plus className="mr-2 h-4 w-4" />
              Invite Candidates
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Applications ({matches.length})</CardTitle>
          <CardDescription>
            Manage and review candidate applications
          </CardDescription>
        </div>
        <Button onClick={() => router.push(`/dashboard/jobs/${jobId}/invite`)}>
          <Plus className="mr-2 h-4 w-4" />
          Invite More Candidates
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matches.map((match) => (
            <div key={match.id} className="border rounded-lg p-4 space-y-3">
              {/* Candidate Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {match.candidate?.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{match.candidate?.name || 'Unknown Candidate'}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {match.candidate?.email && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {match.candidate.email}
                        </span>
                      )}
                      {match.candidate?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {match.candidate.location}
                        </span>
                      )}
                      {match.candidate?.experience_years > 0 && (
                        <span>{match.candidate.experience_years} years exp.</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Match Score */}
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      match.score >= 80 ? 'text-green-600' : 
                      match.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {match.score}%
                    </div>
                    <div className="text-xs text-gray-500">Match</div>
                  </div>
                  
                  {/* Status Badge */}
                  <div>
                    <select
                      value={match.status}
                      onChange={(e) => handleStatusChange(match.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${
                        match.status === 'invited' ? 'bg-blue-100 text-blue-800' :
                        match.status === 'reviewing' ? 'bg-yellow-100 text-yellow-800' :
                        match.status === 'contacted' ? 'bg-purple-100 text-purple-800' :
                        match.status === 'interviewing' ? 'bg-orange-100 text-orange-800' :
                        match.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        match.status === 'hired' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="invited">Invited</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="contacted">Contacted</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {match.candidate?.skills && match.candidate.skills.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-1">
                    {match.candidate.skills.slice(0, 6).map((skill: string, index: number) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {match.candidate.skills.length > 6 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                        +{match.candidate.skills.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Match Analysis */}
              {(match.strengths?.length > 0 || match.weaknesses?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t">
                  {match.strengths?.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-green-700 mb-2">Strengths</h5>
                      <ul className="text-sm text-green-600 space-y-1">
                        {match.strengths.slice(0, 3).map((strength: string, index: number) => (
                          <li key={index} className="flex items-start gap-1">
                            <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {match.weaknesses?.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-orange-700 mb-2">Areas for Discussion</h5>
                      <ul className="text-sm text-orange-600 space-y-1">
                        {match.weaknesses.slice(0, 2).map((weakness: string, index: number) => (
                          <li key={index} className="flex items-start gap-1">
                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Applied Date */}
              <div className="flex items-center justify-between pt-2 text-xs text-gray-500">
                <span>Applied: {new Date(match.created_at).toLocaleDateString()}</span>
                {match.candidate?.source && (
                  <span className="capitalize">Source: {match.candidate.source.replace('_', ' ')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function JobWorkspace() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { getJobById, loading: jobsLoading } = useJobs()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
                  onClick={() => router.push(`/dashboard/jobs/${jobId}/invite`)}
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
          <ApplicationsTab jobId={jobId} />
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
    </div>
  )
}
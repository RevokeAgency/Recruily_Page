"use client"

import { useState, useMemo, Suspense } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Plus, Search, Briefcase, MapPin, DollarSign, Users, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useJobs } from "@/hooks/use-jobs"

// Lazy load heavy components
const JobActionsMenu = dynamic(() => import("@/components/job-actions-menu"), {
  loading: () => <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
})

// Job card component matching the design
const JobCard = ({ job, onDelete }: { job: any, onDelete: (id: string, title: string) => void }) => {
  const router = useRouter()
  
  const handleOpenWorkspace = () => {
    router.push(`/dashboard/jobs/${job.id}/workspace`)
  }

  // Calculate match percentage (mock calculation based on applications)
  const matchPercentage = job.applications_count > 0 ? 
    Math.min(Math.round((job.matches_count || 0) / job.applications_count * 100), 100) : 0

  // Format salary range
  const salaryRange = job.salary_range || 
    (job.salary_min && job.salary_max ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}` : null)

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                {job.title}
              </CardTitle>
              <Badge 
                variant={job.status === 'active' ? 'default' : 'secondary'}
                className={job.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : ''}
              >
                {job.status === 'active' ? 'ACTIVE' : job.status?.toUpperCase()}
              </Badge>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="font-medium">{job.company}</div>
              <div className="flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {job.location || "Remote"}
              </div>
            </div>
          </div>
          <Suspense fallback={<div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>}>
            <JobActionsMenu job={job} onDelete={onDelete} />
          </Suspense>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-4 py-3">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {job.applications_count || 0}
              </div>
              <div className="text-xs text-gray-500">Candidates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {matchPercentage}%
              </div>
              <div className="text-xs text-gray-500">Match</div>
            </div>
            <div className="text-center">
              <div className="flex items-center text-xs text-gray-500">
                <span className={job.status === 'active' ? 'text-green-600' : 'text-gray-400'}>
                  {job.status === 'active' ? 'Invalid Date' : 'Closed'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Job Description Preview */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {job.description ? job.description.substring(0, 120) + "..." : "No description available"}
          </p>
        </div>

        {/* Salary and Work Type */}
        {(salaryRange || job.type || job.experience_level) && (
          <div className="mb-4 space-y-2">
            {salaryRange && (
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-700">Full time:</span>
                <span className="ml-2 text-gray-600">{salaryRange}</span>
              </div>
            )}
            {job.experience_level && (
              <div className="text-xs text-gray-500">
                Experience: {job.experience_level}
              </div>
            )}
          </div>
        )}

        {/* Skills Tags */}
        {job.technical_skills && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {job.technical_skills.split(',').slice(0, 4).map((skill: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                  {skill.trim()}
                </Badge>
              ))}
              {job.technical_skills.split(',').length > 4 && (
                <Badge variant="outline" className="text-xs px-2 py-1">
                  +{job.technical_skills.split(',').length - 4}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Open Workspace Button */}
        <Button 
          onClick={handleOpenWorkspace}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Users className="w-4 h-4" />
          Open Workspace
        </Button>
      </CardContent>
    </Card>
  )
}

// Loading skeleton component
const JobsSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
    {[...Array(6)].map((_, i) => (
      <Card key={i} className="animate-pulse">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
          <div className="bg-gray-100 rounded-lg px-4 py-3">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="h-6 bg-gray-200 rounded w-8 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="text-center">
                <div className="h-6 bg-gray-200 rounded w-8 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-8"></div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

export default function JobsPageOptimized() {
  const router = useRouter()
  const { jobs, loading, error, deleteJob, refetch } = useJobs()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  // Memoize filtered jobs to prevent unnecessary re-computations
  const filteredJobs = useMemo(() => {
    if (!jobs.length) return []
    
    return jobs.filter((job) => {
      const matchesSearch = !searchTerm || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || job.status === statusFilter
      const matchesType = typeFilter === "all" || job.employment_type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [jobs, searchTerm, statusFilter, typeFilter])

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    if (!confirm(`Delete "${jobTitle}"? This cannot be undone.`)) return
    
    try {
      await deleteJob(jobId)
    } catch (error) {
      console.error("Error deleting job:", error)
    }
  }

  const handleCreateJob = () => {
    router.push("/dashboard/jobs/new")
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600">Error loading jobs: {error}</p>
            <Button onClick={refetch} className="mt-4" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Postings</h1>
          <p className="text-gray-600">Manage your open positions and recruitment</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={refetch} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleCreateJob} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </div>
      </div>

      {/* Search and Filters - Simplified for performance */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search jobs by title, company, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <div>
        {loading ? (
          <JobsSkeleton />
        ) : filteredJobs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {filteredJobs.map((job) => (
              <JobCard 
                key={job.id} 
                job={job} 
                onDelete={handleDeleteJob}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {jobs.length === 0 ? "No jobs posted yet" : "No jobs match your filters"}
              </h3>
              <p className="text-gray-600 mb-4">
                {jobs.length === 0 
                  ? "Create your first job posting to start recruiting" 
                  : "Try adjusting your search filters"}
              </p>
              <div className="flex justify-center gap-3">
                {jobs.length === 0 && (
                  <Button onClick={handleCreateJob} className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Job
                  </Button>
                )}
                {jobs.length > 0 && (
                  <Button 
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                      setTypeFilter("all")
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
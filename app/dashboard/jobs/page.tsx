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

// Job card component optimized for performance
const JobCard = ({ job, onDelete }: { job: any, onDelete: (id: string, title: string) => void }) => (
  <Card className="hover:shadow-md transition-shadow duration-200">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold text-gray-900">{job.title}</CardTitle>
          <div className="flex items-center text-sm text-gray-600 space-x-4">
            <span className="flex items-center">
              <Briefcase className="w-4 h-4 mr-1" />
              {job.company}
            </span>
            <span className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {job.location || "Remote"}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
            {job.status}
          </Badge>
          <Suspense fallback={<div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>}>
            <JobActionsMenu job={job} onDelete={onDelete} />
          </Suspense>
        </div>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {job.description?.substring(0, 150)}...
      </p>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {job.skills?.slice(0, 3).map((skill: string) => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {job.skills?.length > 3 && (
            <Badge variant="outline" className="text-xs">+{job.skills.length - 3}</Badge>
          )}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          {job.salary_min && job.salary_max && (
            <span className="flex items-center">
              <DollarSign className="w-4 h-4 mr-1" />
              ${job.salary_min.toLocaleString()}-${job.salary_max.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
)

// Loading skeleton component
const JobsSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {[...Array(6)].map((_, i) => (
      <Card key={i} className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
"use client"

import { useState, useEffect, Suspense } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Users,
  Briefcase,
  TrendingUp,
  Clock,
  Plus,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/contexts/language-context"
import { useJobs } from "@/hooks/use-jobs"
import { useCandidates } from "@/hooks/use-candidates"

// Lazy load heavy components to improve initial load time
const RecentActivity = dynamic(() => import("@/components/dashboard/recent-activity"), {
  loading: () => <div className="h-48 bg-gray-50 animate-pulse rounded-lg"></div>,
  ssr: false,
})

const QuickActions = dynamic(() => import("@/components/dashboard/quick-actions"), {
  loading: () => <div className="h-32 bg-gray-50 animate-pulse rounded-lg"></div>,
  ssr: false,
})

// Loading skeleton component
const MetricCardSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
    </CardHeader>
    <CardContent>
      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
      <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
    </CardContent>
  </Card>
)

export default function OptimizedDashboard() {
  const router = useRouter()
  const { t } = useLanguage()
  const { jobs, loading: jobsLoading } = useJobs()
  const { candidates, loading: candidatesLoading } = useCandidates()
  
  const [metrics, setMetrics] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalCandidates: 0,
    recentActivity: [],
  })

  // Optimized metrics calculation with useMemo equivalent
  useEffect(() => {
    if (!jobsLoading && !candidatesLoading) {
      const activeJobs = jobs.filter(job => job.status === 'open').length
      setMetrics({
        totalJobs: jobs.length,
        activeJobs,
        totalCandidates: candidates.length,
        recentActivity: [],
      })
    }
  }, [jobs, candidates, jobsLoading, candidatesLoading])

  const isLoading = jobsLoading || candidatesLoading

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push("/dashboard/jobs/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </div>
      </div>

      {/* Key Metrics - Optimized */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          // Show skeletons while loading
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalJobs}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.activeJobs} active positions
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalCandidates}</div>
                  <p className="text-xs text-muted-foreground">
                    Available for matching
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.activeJobs}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently hiring
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round((metrics.activeJobs / Math.max(metrics.totalJobs, 1)) * 100)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Job fill rate
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => router.push("/dashboard/jobs/new")}
                className="h-20 flex-col bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200"
                variant="outline"
              >
                <Plus className="h-6 w-6 mb-2" />
                <span>Create Job</span>
              </Button>
              <Button 
                onClick={() => router.push("/dashboard/candidates")}
                className="h-20 flex-col bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                variant="outline"
              >
                <Users className="h-6 w-6 mb-2" />
                <span>View Candidates</span>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => router.push("/dashboard/matches")}
                className="h-20 flex-col bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                variant="outline"
              >
                <TrendingUp className="h-6 w-6 mb-2" />
                <span>AI Matches</span>
              </Button>
              <Button 
                onClick={() => router.push("/dashboard/analytics")}
                className="h-20 flex-col bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                variant="outline"
              >
                <Activity className="h-6 w-6 mb-2" />
                <span>Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity - Lazy Loaded */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-32 bg-gray-50 animate-pulse rounded"></div>}>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      New candidate registered
                    </p>
                    <p className="text-sm text-muted-foreground">
                      2 minutes ago
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Job posting updated
                    </p>
                    <p className="text-sm text-muted-foreground">
                      1 hour ago
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      AI matching completed
                    </p>
                    <p className="text-sm text-muted-foreground">
                      3 hours ago
                    </p>
                  </div>
                </div>
              </div>
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs and Candidates - Lazy Loaded */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Jobs</CardTitle>
              <CardDescription>
                Your latest job postings
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              className="ml-auto"
              onClick={() => router.push("/dashboard/jobs")}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4">
            {isLoading ? (
              // Loading skeleton
              <>
                <div className="h-16 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-16 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-16 bg-gray-100 rounded animate-pulse"></div>
              </>
            ) : jobs.length > 0 ? (
              jobs.slice(0, 3).map((job) => (
                <div key={job.id} className="flex items-center space-x-4">
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">
                      {job.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {job.company} • {job.location || 'Remote'}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No jobs yet</p>
                <Button 
                  size="sm" 
                  onClick={() => router.push("/dashboard/jobs/new")}
                  className="mt-2"
                >
                  Create your first job
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Candidates</CardTitle>
              <CardDescription>
                Latest candidate profiles
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              className="ml-auto"
              onClick={() => router.push("/dashboard/candidates")}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4">
            {isLoading ? (
              // Loading skeleton
              <>
                <div className="h-16 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-16 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-16 bg-gray-100 rounded animate-pulse"></div>
              </>
            ) : candidates.length > 0 ? (
              candidates.slice(0, 3).map((candidate) => (
                <div key={candidate.id} className="flex items-center space-x-4">
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">
                      {candidate.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {candidate.experience_years || 0} years experience • {candidate.location || 'Location not specified'}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Badge variant="secondary">
                      {candidate.status || 'Active'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No candidates yet</p>
                <Button 
                  size="sm" 
                  onClick={() => router.push("/dashboard/candidates")}
                  className="mt-2"
                >
                  Browse candidates
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
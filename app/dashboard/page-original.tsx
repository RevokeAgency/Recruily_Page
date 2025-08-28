"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Users,
  Briefcase,
  TrendingUp,
  Clock,
  Plus,
  Eye,
  FileText,
  Calendar,
  ArrowRight,
  MoreHorizontal,
  Activity,
  Target,
  Award,
  MapPin,
  Star,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/contexts/language-context"
import { useJobs } from "@/hooks/use-jobs"
import { useCandidates } from "@/hooks/use-candidates"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BackgroundElements } from "@/components/design-elements"
import Link from "next/link"

interface DashboardMetrics {
  totalJobs: number
  activeJobs: number
  totalCandidates: number
  totalApplications: number
  recentCandidates: Array<{
    id: string
    name: string
    position: string
    uploadDate: string
    jobId?: string
  }>
  activeJobsList: Array<{
    id: string
    title: string
    applications: number
    created: string
    location: string
  }>
  recentActivity: Array<{
    id: string
    type: string
    message: string
    timestamp: string
    priority: "high" | "medium" | "low"
  }>
  pipelineData: {
    screening: number
    interview: number
    offer: number
    hired: number
  }
}

export default function DashboardPage() {
  const { language } = useLanguage()
  const { jobs, loading: jobsLoading } = useJobs()
  const { candidates, loading: candidatesLoading } = useCandidates()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const handleViewCandidate = (candidateId: string) => {
    // Navigate to candidates tab and trigger the profile view for the specific candidate
    router.push(`/dashboard/candidates?viewProfile=${candidateId}`)
  }

  useEffect(() => {
    const calculateMetrics = () => {
      try {
        // Get real data from localStorage
        const storedCandidates = JSON.parse(localStorage.getItem("recruitify_candidates") || "[]")

        // Get recent candidates (last 5) with simplified data including jobId
        const recentCandidates = storedCandidates
          .sort(
            (a: any, b: any) =>
              new Date(b.uploadedAt || b.appliedDate).getTime() - new Date(a.uploadedAt || a.appliedDate).getTime(),
          )
          .slice(0, 5)
          .map((candidate: any) => ({
            id: candidate.id,
            name: candidate.name,
            position: candidate.position || "Not specified",
            uploadDate: candidate.uploadedAt || candidate.appliedDate || new Date().toISOString(),
            jobId: candidate.jobId, // Include jobId for navigation
          }))

        // Get active jobs with application counts
        const activeJobsList = jobs
          .filter((job: any) => job.status === "active" || !job.status)
          .map((job: any) => {
            const jobCandidates = storedCandidates.filter((c: any) => c.jobId === job.id)
            return {
              id: job.id,
              title: job.title,
              applications: jobCandidates.length,
              created: job.created_at || new Date().toISOString(),
              location: job.location || "Remote",
            }
          })
          .sort((a, b) => b.applications - a.applications)
          .slice(0, 5)

        // Calculate pipeline data
        const pipelineData = {
          screening: storedCandidates.filter((c: any) => c.status === "Applied" || c.status === "screening").length,
          interview: storedCandidates.filter((c: any) => c.status === "interview" || c.status === "Interview").length,
          offer: storedCandidates.filter((c: any) => c.status === "offer").length,
          hired: storedCandidates.filter((c: any) => c.status === "hired" || c.status === "Hired").length,
        }

        // Generate recent activity
        const recentActivity = []

        // Add recent candidate uploads
        recentCandidates.slice(0, 3).forEach((candidate: any) => {
          recentActivity.push({
            id: `candidate-${candidate.id}`,
            type: "candidate",
            message: `New application from ${candidate.name} for ${candidate.position}`,
            timestamp: candidate.uploadDate,
            priority: "medium" as const,
          })
        })

        // Add recent job creations
        jobs.slice(-2).forEach((job: any) => {
          recentActivity.push({
            id: `job-${job.id}`,
            type: "job",
            message: `New job "${job.title}" was created`,
            timestamp: job.created_at || new Date().toISOString(),
            priority: "high" as const,
          })
        })

        // Sort by timestamp
        recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        const calculatedMetrics: DashboardMetrics = {
          totalJobs: jobs.length,
          activeJobs: jobs.filter((job: any) => job.status === "active" || !job.status).length,
          totalCandidates: storedCandidates.length,
          totalApplications: activeJobsList.reduce((sum, job) => sum + job.applications, 0),
          recentCandidates,
          activeJobsList,
          recentActivity: recentActivity.slice(0, 6),
          pipelineData,
        }

        setMetrics(calculatedMetrics)
      } catch (error) {
        console.error("Error calculating metrics:", error)
      } finally {
        setLoading(false)
      }
    }

    if (!jobsLoading && !candidatesLoading) {
      calculateMetrics()
    }
  }, [jobs, candidates, jobsLoading, candidatesLoading])

  if (loading || !metrics) {
    return (
      <div className="min-h-screen relative">
        <BackgroundElements />
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{language === "EN" ? "Dashboard" : "Dashboard"}</h1>
              <p className="text-muted-foreground">
                {language === "EN" ? "Loading your recruitment overview..." : "Lade Ihre Rekrutierungsübersicht..."}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-8 bg-gray-200 rounded"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  const totalPipeline = Object.values(metrics.pipelineData).reduce((sum, val) => sum + val, 0)

  return (
    <div className="min-h-screen relative">
      <BackgroundElements />
      <motion.div
        className="space-y-8 p-6 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              {language === "EN" ? "Recruitment Dashboard" : "Rekrutierungs-Dashboard"}
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              {language === "EN" ? "Your comprehensive recruitment overview" : "Ihre umfassende Rekrutierungsübersicht"}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/jobs/new">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <Plus className="h-4 w-4 mr-2" />
                  {language === "EN" ? "New Job" : "Neue Stelle"}
                </Button>
              </motion.div>
            </Link>
            <Link href="/dashboard/candidates">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  className="border-teal-200 hover:bg-teal-50 transition-all duration-300 bg-transparent"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {language === "EN" ? "View Candidates" : "Kandidaten anzeigen"}
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: language === "EN" ? "Active Jobs" : "Aktive Stellen",
              value: metrics.activeJobs,
              total: metrics.totalJobs,
              icon: Briefcase,
              color: "from-blue-500 to-blue-600",
              trend: "+12%",
              trendUp: true,
            },
            {
              title: language === "EN" ? "Total Candidates" : "Kandidaten gesamt",
              value: metrics.totalCandidates,
              icon: Users,
              color: "from-teal-500 to-teal-600",
              trend: "+8%",
              trendUp: true,
            },
            {
              title: language === "EN" ? "Applications" : "Bewerbungen",
              value: metrics.totalApplications,
              icon: FileText,
              color: "from-green-500 to-green-600",
              trend: "+15%",
              trendUp: true,
            },
            {
              title: language === "EN" ? "Success Rate" : "Erfolgsrate",
              value: totalPipeline > 0 ? Math.round((metrics.pipelineData.hired / totalPipeline) * 100) : 0,
              suffix: "%",
              icon: Target,
              color: "from-purple-500 to-purple-600",
              trend: "+5%",
              trendUp: true,
            },
          ].map((metric, index) => (
            <motion.div
              key={metric.title}
              variants={itemVariants}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              transition={{ duration: 0.2 }}
            >
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-5`} />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </CardDescription>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.color} text-white shadow-lg`}>
                      <metric.icon className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <motion.div
                      className="text-3xl font-bold"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
                    >
                      {metric.value}
                      {metric.suffix || ""}
                      {metric.total && <span className="text-lg text-muted-foreground ml-1">/{metric.total}</span>}
                    </motion.div>
                    <Badge
                      variant="secondary"
                      className={`${metric.trendUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} border-0`}
                    >
                      <TrendingUp className={`h-3 w-3 mr-1 ${metric.trendUp ? "" : "rotate-180"}`} />
                      {metric.trend}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Pipeline and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pipeline Visualization */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-teal-600" />
                  {language === "EN" ? "Recruitment Pipeline" : "Rekrutierungs-Pipeline"}
                </CardTitle>
                <CardDescription>
                  {language === "EN" ? "Candidate distribution across stages" : "Kandidatenverteilung nach Phasen"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    stage: language === "EN" ? "Screening" : "Screening",
                    count: metrics.pipelineData.screening,
                    color: "bg-blue-500",
                    percentage: totalPipeline > 0 ? (metrics.pipelineData.screening / totalPipeline) * 100 : 0,
                  },
                  {
                    stage: language === "EN" ? "Interview" : "Interview",
                    count: metrics.pipelineData.interview,
                    color: "bg-teal-500",
                    percentage: totalPipeline > 0 ? (metrics.pipelineData.interview / totalPipeline) * 100 : 0,
                  },
                  {
                    stage: language === "EN" ? "Offer" : "Angebot",
                    count: metrics.pipelineData.offer,
                    color: "bg-green-500",
                    percentage: totalPipeline > 0 ? (metrics.pipelineData.offer / totalPipeline) * 100 : 0,
                  },
                  {
                    stage: language === "EN" ? "Hired" : "Eingestellt",
                    count: metrics.pipelineData.hired,
                    color: "bg-purple-500",
                    percentage: totalPipeline > 0 ? (metrics.pipelineData.hired / totalPipeline) * 100 : 0,
                  },
                ].map((item, index) => (
                  <div key={item.stage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {item.count} ({Math.round(item.percentage)}%)
                        </span>
                      </div>
                    </div>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: index * 0.2 + 0.5, duration: 0.8 }}
                    >
                      <Progress value={item.percentage} className="h-3" />
                    </motion.div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-teal-600" />
                  {language === "EN" ? "Recent Activity" : "Letzte Aktivitäten"}
                </CardTitle>
                <CardDescription>
                  {language === "EN" ? "Latest updates and actions" : "Neueste Updates und Aktionen"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.recentActivity.length > 0 ? (
                    metrics.recentActivity.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div
                          className={`p-2 rounded-full ${
                            activity.priority === "high"
                              ? "bg-red-100 text-red-600"
                              : activity.priority === "medium"
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-green-100 text-green-600"
                          }`}
                        >
                          {activity.type === "candidate" ? (
                            <Users className="h-4 w-4" />
                          ) : (
                            <Briefcase className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {activity.priority === "high" && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                            className="w-2 h-2 bg-red-500 rounded-full"
                          />
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{language === "EN" ? "No recent activity" : "Keine aktuellen Aktivitäten"}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Active Jobs and Recent Candidates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Jobs */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-teal-600" />
                    {language === "EN" ? "Active Jobs" : "Aktive Stellen"}
                  </CardTitle>
                  <Link href="/dashboard/jobs">
                    <Button variant="ghost" size="sm" className="hover:bg-teal-50">
                      {language === "EN" ? "View all" : "Alle anzeigen"}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                <CardDescription>
                  {language === "EN" ? "Your currently open positions" : "Ihre aktuell offenen Stellen"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.activeJobsList.length > 0 ? (
                    metrics.activeJobsList.map((job, index) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.4 }}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{job.title}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {job.applications} applications
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(job.created).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="hover:bg-teal-50">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/jobs/${job.id}/workspace`}>
                                {language === "EN" ? "View Details" : "Details anzeigen"}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>{language === "EN" ? "Edit Job" : "Stelle bearbeiten"}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">
                        {language === "EN" ? "No active jobs yet" : "Noch keine aktiven Stellen"}
                      </p>
                      <p className="text-sm mb-4">
                        {language === "EN" ? "Create your first job to get started" : "Erstellen Sie Ihre erste Stelle"}
                      </p>
                      <Link href="/dashboard/jobs/new">
                        <Button className="bg-gradient-to-r from-teal-600 to-blue-600 text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          {language === "EN" ? "Create Job" : "Stelle erstellen"}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Candidates */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-teal-600" />
                    {language === "EN" ? "Recent Candidates" : "Neue Kandidaten"}
                  </CardTitle>
                  <Link href="/dashboard/candidates">
                    <Button variant="ghost" size="sm" className="hover:bg-teal-50">
                      {language === "EN" ? "View all" : "Alle anzeigen"}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                <CardDescription>
                  {language === "EN" ? "Latest candidate applications" : "Neueste Kandidatenbewerbungen"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.recentCandidates.length > 0 ? (
                    metrics.recentCandidates.map((candidate, index) => (
                      <motion.div
                        key={candidate.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.4 }}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-blue-500 flex items-center justify-center text-white font-medium text-sm">
                            {candidate.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{candidate.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{candidate.position}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(candidate.uploadDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-teal-50 ml-2"
                          onClick={() => handleViewCandidate(candidate.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {language === "EN" ? "View Profile" : "Profil anzeigen"}
                        </Button>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">
                        {language === "EN" ? "No candidates yet" : "Noch keine Kandidaten"}
                      </p>
                      <p className="text-sm mb-4">
                        {language === "EN" ? "Upload CVs to get started" : "CVs hochladen um zu beginnen"}
                      </p>
                      <Link href="/dashboard/candidates">
                        <Button className="bg-gradient-to-r from-teal-600 to-blue-600 text-white">
                          <Users className="h-4 w-4 mr-2" />
                          {language === "EN" ? "Upload CVs" : "CVs hochladen"}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-teal-50 to-blue-50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                {language === "EN" ? "Quick Actions" : "Schnellaktionen"}
              </CardTitle>
              <CardDescription className="text-center">
                {language === "EN" ? "Common tasks to streamline your workflow" : "Häufige Aufgaben für Ihren Workflow"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: language === "EN" ? "Create Job" : "Stelle erstellen",
                    href: "/dashboard/jobs/new",
                    icon: Plus,
                    color: "from-teal-600 to-blue-600",
                    description: language === "EN" ? "Post a new position" : "Neue Position ausschreiben",
                  },
                  {
                    label: language === "EN" ? "Upload CVs" : "CVs hochladen",
                    href: "/dashboard/candidates",
                    icon: Users,
                    color: "from-blue-600 to-purple-600",
                    description: language === "EN" ? "Add new candidates" : "Neue Kandidaten hinzufügen",
                  },
                  {
                    label: language === "EN" ? "View Matches" : "Matches anzeigen",
                    href: "/dashboard/matches",
                    icon: Target,
                    color: "from-green-600 to-teal-600",
                    description: language === "EN" ? "See candidate matches" : "Kandidaten-Matches ansehen",
                  },
                  {
                    label: language === "EN" ? "Analytics" : "Analytics",
                    href: "/dashboard/analytics",
                    icon: TrendingUp,
                    color: "from-purple-600 to-pink-600",
                    description: language === "EN" ? "View performance" : "Leistung anzeigen",
                  },
                ].map((action, index) => (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.6 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link href={action.href}>
                      <Card className="h-full cursor-pointer border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6 text-center">
                          <div
                            className={`w-12 h-12 mx-auto mb-4 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center text-white shadow-lg`}
                          >
                            <action.icon className="h-6 w-6" />
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{action.label}</h3>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}

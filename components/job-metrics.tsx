"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Clock, Target, TrendingUp, Briefcase, CheckCircle, AlertCircle } from "lucide-react"

export function JobMetrics() {
  const metrics = [
    {
      title: "Time to Fill",
      value: "12.3 days",
      change: "-2.1 days",
      trend: "down",
      icon: Clock,
      description: "Average time to fill positions",
    },
    {
      title: "Match Quality",
      value: "87%",
      change: "+5%",
      trend: "up",
      icon: Target,
      description: "Quality of candidate matches",
    },
    {
      title: "Response Rate",
      value: "64%",
      change: "+12%",
      trend: "up",
      icon: TrendingUp,
      description: "Candidate response rate",
    },
  ]

  const topJobs = [
    {
      title: "Senior React Developer",
      applications: 45,
      matches: 12,
      status: "active",
      progress: 75,
    },
    {
      title: "Product Manager",
      applications: 38,
      matches: 8,
      status: "active",
      progress: 60,
    },
    {
      title: "UX Designer",
      applications: 29,
      matches: 15,
      status: "filled",
      progress: 100,
    },
    {
      title: "DevOps Engineer",
      applications: 22,
      matches: 6,
      status: "active",
      progress: 45,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Job Performance Metrics
        </CardTitle>
        <CardDescription>Track the performance of your job postings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid gap-4">
          {metrics.map((metric) => (
            <div key={metric.title} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{metric.title}</p>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">{metric.value}</p>
                <p className={`text-xs ${metric.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                  {metric.change}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Top Performing Jobs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Top Performing Jobs</h4>
            <Badge variant="secondary">4 Active</Badge>
          </div>

          <div className="space-y-4">
            {topJobs.map((job, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{job.title}</span>
                    <Badge
                      variant={job.status === "filled" ? "default" : "secondary"}
                      className={job.status === "filled" ? "bg-green-600" : ""}
                    >
                      {job.status === "filled" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      )}
                      {job.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{job.matches} matches</p>
                    <p className="text-xs text-muted-foreground">{job.applications} applications</p>
                  </div>
                </div>
                <Progress value={job.progress} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">134</p>
              <p className="text-xs text-muted-foreground">Total Applications</p>
            </div>
            <div>
              <p className="text-2xl font-bold">41</p>
              <p className="text-xs text-muted-foreground">Quality Matches</p>
            </div>
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-muted-foreground">Positions Filled</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

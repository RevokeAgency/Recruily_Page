"use client"

import type React from "react"

import { useState } from "react"
import { Calendar, Download, Users, Briefcase, UserCheck, Clock, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TabsWrapper from "@/components/tabs-wrapper"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30")
  const [language, setLanguage] = useState("EN") // Assuming a language state, default to English

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <div className="flex flex-col space-y-6 p-6">
        <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {language === "EN" ? "Recruitment Analytics" : "Rekrutierungsanalysen"}
            </h1>
            <p className="text-muted-foreground">
              {language === "EN"
                ? "Track your recruitment performance and metrics."
                : "Verfolgen Sie Ihre Rekrutierungsleistung und -metriken."}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={language === "EN" ? "Select time range" : "Zeitraum auswählen"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{language === "EN" ? "Last 7 days" : "Letzte 7 Tage"}</SelectItem>
                <SelectItem value="30">{language === "EN" ? "Last 30 days" : "Letzte 30 Tage"}</SelectItem>
                <SelectItem value="90">{language === "EN" ? "Last 90 days" : "Letzte 90 Tage"}</SelectItem>
                <SelectItem value="365">{language === "EN" ? "Last 12 months" : "Letzte 12 Monate"}</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Candidates"
            value="1,248"
            change="+12.5%"
            trend="up"
            icon={<Users className="h-4 w-4" />}
          />
          <MetricCard
            title="Active Job Postings"
            value="24"
            change="+4"
            trend="up"
            icon={<Briefcase className="h-4 w-4" />}
          />
          <MetricCard
            title="Successful Hires"
            value="38"
            change="+8"
            trend="up"
            icon={<UserCheck className="h-4 w-4" />}
          />
          <MetricCard
            title="Avg. Time to Hire"
            value="18 days"
            change="-2.5 days"
            trend="down"
            icon={<Clock className="h-4 w-4" />}
          />
        </div>

        <TabsWrapper defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">{language === "EN" ? "Overview" : "Übersicht"}</TabsTrigger>
            <TabsTrigger value="jobs">{language === "EN" ? "Jobs" : "Stellen"}</TabsTrigger>
            <TabsTrigger value="candidates">{language === "EN" ? "Candidates" : "Kandidaten"}</TabsTrigger>
            <TabsTrigger value="sources">{language === "EN" ? "Sources" : "Quellen"}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Candidate Pipeline</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <img
                      src="/placeholder.svg?height=300&width=600&text=Pipeline+Chart"
                      alt="Candidate Pipeline Chart"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hiring Funnel</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <img
                      src="/placeholder.svg?height=300&width=600&text=Funnel+Chart"
                      alt="Hiring Funnel Chart"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recruitment Activity</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <img
                    src="/placeholder.svg?height=300&width=1200&text=Activity+Timeline"
                    alt="Recruitment Activity Timeline"
                    className="h-full w-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>Job Performance</CardTitle>
                <CardDescription>Track the performance of your active job postings.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <img
                    src="/placeholder.svg?height=400&width=1200&text=Job+Performance+Metrics"
                    alt="Job Performance Metrics"
                    className="h-full w-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="candidates">
            <Card>
              <CardHeader>
                <CardTitle>Candidate Metrics</CardTitle>
                <CardDescription>Analyze candidate flow and quality metrics.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <img
                    src="/placeholder.svg?height=400&width=1200&text=Candidate+Metrics"
                    alt="Candidate Metrics"
                    className="h-full w-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources">
            <Card>
              <CardHeader>
                <CardTitle>Recruitment Sources</CardTitle>
                <CardDescription>See which sources bring the best candidates.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <img
                    src="/placeholder.svg?height=400&width=1200&text=Source+Analysis"
                    alt="Source Analysis"
                    className="h-full w-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </TabsWrapper>

        <Card>
          <CardHeader>
            <CardTitle>{language === "EN" ? "Top Performing Job Postings" : "Beste Stellenangebote"}</CardTitle>
            <CardDescription>
              {language === "EN"
                ? "Jobs with the highest quality candidates and conversion rates."
                : "Stellen mit den qualitativ hochwertigsten Kandidaten und Konversionsraten."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left font-medium">Job Title</th>
                    <th className="pb-2 text-left font-medium">Applications</th>
                    <th className="pb-2 text-left font-medium">Interviews</th>
                    <th className="pb-2 text-left font-medium">Avg. Match Score</th>
                    <th className="pb-2 text-left font-medium">Time Open</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3">Marketing Manager</td>
                    <td className="py-3">124</td>
                    <td className="py-3">18</td>
                    <td className="py-3">76%</td>
                    <td className="py-3">14 days</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Frontend Developer</td>
                    <td className="py-3">98</td>
                    <td className="py-3">12</td>
                    <td className="py-3">82%</td>
                    <td className="py-3">21 days</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Product Designer</td>
                    <td className="py-3">87</td>
                    <td className="py-3">9</td>
                    <td className="py-3">79%</td>
                    <td className="py-3">18 days</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">Sales Representative</td>
                    <td className="py-3">156</td>
                    <td className="py-3">22</td>
                    <td className="py-3">68%</td>
                    <td className="py-3">10 days</td>
                  </tr>
                  <tr>
                    <td className="py-3">Customer Success Manager</td>
                    <td className="py-3">72</td>
                    <td className="py-3">8</td>
                    <td className="py-3">74%</td>
                    <td className="py-3">16 days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: React.ReactNode
}

function MetricCard({ title, value, change, trend, icon }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="rounded-full bg-muted p-1">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs">
          {trend === "up" ? (
            <TrendingUp className="mr-1 h-3 w-3 text-teal-500" />
          ) : (
            <TrendingDown className="mr-1 h-3 w-3 text-teal-500" />
          )}
          <span className={trend === "up" ? "text-teal-500" : "text-teal-500"}>{change}</span>
          <span className="ml-1 text-muted-foreground">from previous period</span>
        </div>
      </CardContent>
    </Card>
  )
}

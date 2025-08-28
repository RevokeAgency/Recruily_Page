"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, FileText, MessageSquare, CheckCircle, Clock, TrendingUp, ArrowRight, Plus } from "lucide-react"

export function RecruitmentWorkflow() {
  const [activeStage, setActiveStage] = useState("sourcing")

  const stages = [
    {
      id: "sourcing",
      name: "Sourcing",
      icon: Users,
      count: 45,
      color: "bg-blue-500",
      description: "Finding potential candidates",
    },
    {
      id: "screening",
      name: "Screening",
      icon: FileText,
      count: 23,
      color: "bg-orange-500",
      description: "Initial candidate review",
    },
    {
      id: "interviewing",
      name: "Interviewing",
      icon: MessageSquare,
      count: 12,
      color: "bg-purple-500",
      description: "Conducting interviews",
    },
    {
      id: "offer",
      name: "Offer",
      icon: CheckCircle,
      count: 5,
      color: "bg-green-500",
      description: "Making job offers",
    },
  ]

  const recentActivity = [
    {
      candidate: "Sarah Johnson",
      action: "moved to Interview stage",
      job: "Senior Developer",
      time: "2 hours ago",
      type: "progress",
    },
    {
      candidate: "Mike Chen",
      action: "received job offer",
      job: "Product Manager",
      time: "4 hours ago",
      type: "offer",
    },
    {
      candidate: "Emma Wilson",
      action: "completed screening",
      job: "UX Designer",
      time: "6 hours ago",
      type: "screening",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Recruitment Pipeline
        </CardTitle>
        <CardDescription>Track candidates through your recruitment stages</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeStage} onValueChange={setActiveStage}>
          <TabsList className="grid w-full grid-cols-4">
            {stages.map((stage) => (
              <TabsTrigger key={stage.id} value={stage.id} className="text-xs">
                <stage.icon className="h-3 w-3 mr-1" />
                {stage.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Pipeline Overview */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Pipeline Overview</h4>
              <Badge variant="secondary">85 Total Candidates</Badge>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex items-center">
                  <div className="flex-1">
                    <div
                      className={`h-2 rounded-full ${stage.color}`}
                      style={{ width: `${(stage.count / 85) * 100}%` }}
                    />
                    <div className="mt-1 text-center">
                      <p className="text-xs font-medium">{stage.count}</p>
                      <p className="text-xs text-muted-foreground">{stage.name}</p>
                    </div>
                  </div>
                  {index < stages.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />}
                </div>
              ))}
            </div>
          </div>

          {/* Stage Details */}
          {stages.map((stage) => (
            <TabsContent key={stage.id} value={stage.id} className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${stage.color.replace("bg-", "bg-").replace("-500", "-100")}`}>
                      <stage.icon className={`h-4 w-4 ${stage.color.replace("bg-", "text-")}`} />
                    </div>
                    <div>
                      <h4 className="font-medium">{stage.name} Stage</h4>
                      <p className="text-sm text-muted-foreground">{stage.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{stage.count} candidates</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Avg. Time</span>
                    </div>
                    <p className="text-lg font-bold mt-1">
                      {stage.id === "sourcing"
                        ? "3.2 days"
                        : stage.id === "screening"
                          ? "2.1 days"
                          : stage.id === "interviewing"
                            ? "5.4 days"
                            : "1.8 days"}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Success Rate</span>
                    </div>
                    <p className="text-lg font-bold mt-1">
                      {stage.id === "sourcing"
                        ? "68%"
                        : stage.id === "screening"
                          ? "74%"
                          : stage.id === "interviewing"
                            ? "82%"
                            : "91%"}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Recent Activity */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Recent Activity</h4>
            <Button variant="outline" size="sm">
              <Plus className="h-3 w-3 mr-1" />
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <div
                  className={`h-2 w-2 rounded-full ${
                    activity.type === "progress"
                      ? "bg-blue-500"
                      : activity.type === "offer"
                        ? "bg-green-500"
                        : "bg-orange-500"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.candidate}</span> {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.job} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

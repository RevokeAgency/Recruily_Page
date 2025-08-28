"use client"

import { useState } from "react"
import { Download, ArrowRight, Mail, Phone, MapPin, Calendar, MessageSquare, Clock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/contexts/language-context"

interface CandidateProfileExpandedProps {
  candidate: {
    id: string
    name: string
    avatar: string
    email: string
    phone: string
    location: string
    matchScore: number
    summary: string
    strengths: string[]
    weaknesses: string[]
    skills: string[]
    experience: {
      title: string
      company: string
      period: string
      description: string
    }[]
    education: {
      degree: string
      institution: string
      year: string
    }[]
    notes?: string[]
    timeline?: {
      date: string
      action: string
      user: string
    }[]
  }
  onClose?: () => void
}

export default function CandidateProfileExpanded({ candidate, onClose }: CandidateProfileExpandedProps) {
  const [newNote, setNewNote] = useState("")
  const { language } = useLanguage()

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-teal-700"
    if (score >= 70) return "text-blue-700"
    if (score >= 60) return "text-amber-700"
    return "text-red-700"
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-teal-50"
    if (score >= 70) return "bg-blue-50"
    if (score >= 60) return "bg-amber-50"
    return "bg-red-50"
  }

  const handleAddNote = () => {
    if (newNote.trim()) {
      // In a real app, this would add the note to the candidate's profile
      setNewNote("")
    }
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={candidate.avatar} alt={candidate.name} />
              <AvatarFallback>
                {candidate.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{candidate.name}</CardTitle>
              <CardDescription className="text-base">
                {language === "EN" ? "Marketing Manager Candidate" : "Marketing Manager Kandidat"}
              </CardDescription>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {candidate.email}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {candidate.phone}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {candidate.location}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
            <div
              className={`flex h-16 w-16 flex-col items-center justify-center rounded-full ${getScoreBg(candidate.matchScore)} ${getScoreColor(candidate.matchScore)}`}
            >
              <div className="text-xl font-bold">{candidate.matchScore}%</div>
              <div className="text-xs">{language === "EN" ? "Match" : "Übereinstimmung"}</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <Tabs defaultValue="overview" className="h-[calc(100%-120px)]">
        <div className="border-b px-6">
          <TabsList className="w-full justify-start rounded-none border-b-0 p-0">
            <TabsTrigger
              value="overview"
              className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
            >
              {language === "EN" ? "Overview" : "Übersicht"}
            </TabsTrigger>
            <TabsTrigger
              value="experience"
              className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
            >
              {language === "EN" ? "Experience" : "Erfahrung"}
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
            >
              {language === "EN" ? "Notes" : "Notizen"}
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
            >
              {language === "EN" ? "Timeline" : "Zeitlinie"}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="h-[calc(100%-48px)] overflow-y-auto p-6">
          <TabsContent value="overview" className="m-0 h-full space-y-6">
            <div>
              <h3 className="mb-2 font-medium">
                {language === "EN" ? "Résumé Summary" : "Lebenslauf Zusammenfassung"}
              </h3>
              <p className="text-muted-foreground">{candidate.summary}</p>
            </div>

            <div>
              <h3 className="mb-2 font-medium">{language === "EN" ? "Match Score" : "Übereinstimmungswert"}</h3>
              <div className="mb-1 flex justify-between text-sm">
                <span>{language === "EN" ? "Overall Fit" : "Gesamtpassung"}</span>
                <span className={`font-medium ${getScoreColor(candidate.matchScore)}`}>{candidate.matchScore}%</span>
              </div>
              <Progress
                value={candidate.matchScore}
                className="h-2"
                indicatorClassName={
                  candidate.matchScore >= 80
                    ? "bg-teal-500"
                    : candidate.matchScore >= 70
                      ? "bg-blue-500"
                      : candidate.matchScore >= 60
                        ? "bg-amber-500"
                        : "bg-red-500"
                }
              />

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-medium">
                    {language === "EN" ? "Skills Match" : "Fähigkeiten Übereinstimmung"}
                  </h4>
                  <Progress value={85} className="h-2 bg-gray-100" indicatorClassName="bg-teal-500" />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>
                      {language === "EN"
                        ? "85% match with job requirements"
                        : "85% Übereinstimmung mit Jobanforderungen"}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium">
                    {language === "EN" ? "Experience Match" : "Erfahrung Übereinstimmung"}
                  </h4>
                  <Progress value={78} className="h-2 bg-gray-100" indicatorClassName="bg-blue-500" />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>
                      {language === "EN"
                        ? "78% match with required experience"
                        : "78% Übereinstimmung mit erforderlicher Erfahrung"}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium">
                    {language === "EN" ? "Culture Fit" : "Kulturelle Passung"}
                  </h4>
                  <Progress value={92} className="h-2 bg-gray-100" indicatorClassName="bg-teal-500" />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>
                      {language === "EN" ? "92% potential culture fit" : "92% potenzielle kulturelle Passung"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-medium">{language === "EN" ? "Top Strengths" : "Stärken"}</h3>
                <ul className="space-y-1">
                  {candidate.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <span className="mr-2 text-teal-500">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-medium">
                  {language === "EN" ? "Areas for Consideration" : "Zu beachtende Bereiche"}
                </h3>
                <ul className="space-y-1">
                  {candidate.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <span className="mr-2 text-amber-500">!</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-medium">{language === "EN" ? "Skills" : "Fähigkeiten"}</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex flex-col space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Download className="mr-2 h-4 w-4" />
                {language === "EN" ? "Download CV" : "Lebenslauf herunterladen"}
              </Button>
              <Button className="w-full bg-teal-600 hover:bg-teal-700">
                {language === "EN" ? "Move to Interview" : "Zum Gespräch verschieben"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="experience" className="m-0 h-full space-y-6">
            <div>
              <h3 className="mb-4 font-medium">{language === "EN" ? "Work Experience" : "Berufserfahrung"}</h3>
              <div className="space-y-4">
                {candidate.experience.map((exp, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{exp.title}</h4>
                      <span className="text-sm text-muted-foreground">{exp.period}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{exp.company}</div>
                    <p className="mt-2 text-sm">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-4 font-medium">{language === "EN" ? "Education" : "Ausbildung"}</h3>
              <div className="space-y-4">
                {candidate.education.map((edu, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{edu.degree}</h4>
                      <span className="text-sm text-muted-foreground">{edu.year}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{edu.institution}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="m-0 h-full space-y-6">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-2">
                <Textarea
                  placeholder={
                    language === "EN"
                      ? "Add a note about this candidate..."
                      : "Fügen Sie eine Notiz zu diesem Kandidaten hinzu..."
                  }
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <div className="flex justify-end">
                  <Button onClick={handleAddNote} className="bg-teal-600 hover:bg-teal-700">
                    {language === "EN" ? "Add Note" : "Notiz hinzufügen"}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                {candidate.notes && candidate.notes.length > 0 ? (
                  candidate.notes.map((note, index) => (
                    <div key={index} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>JD</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">John Doe</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {language === "EN" ? "2 days ago" : "vor 2 Tagen"}
                        </span>
                      </div>
                      <p className="text-sm">{note}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground" />
                    <h4 className="text-lg font-medium">{language === "EN" ? "No notes yet" : "Noch keine Notizen"}</h4>
                    <p className="text-sm text-muted-foreground">
                      {language === "EN"
                        ? "Add the first note about this candidate"
                        : "Fügen Sie die erste Notiz zu diesem Kandidaten hinzu"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="m-0 h-full">
            <div className="space-y-4">
              {candidate.timeline && candidate.timeline.length > 0 ? (
                candidate.timeline.map((event, index) => (
                  <div key={index} className="flex space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-100 p-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                      </div>
                      {index < (candidate.timeline?.length || 0) - 1 && (
                        <div className="h-full w-0.5 bg-gray-100"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{event.action}</span>
                        <span className="text-xs text-muted-foreground">{event.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {language === "EN" ? "by " : "von "}
                        {event.user}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <Calendar className="mb-2 h-8 w-8 text-muted-foreground" />
                  <h4 className="text-lg font-medium">
                    {language === "EN" ? "No activity yet" : "Noch keine Aktivität"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {language === "EN"
                      ? "Timeline will show candidate activity"
                      : "Zeitlinie zeigt Kandidatenaktivität"}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  )
}

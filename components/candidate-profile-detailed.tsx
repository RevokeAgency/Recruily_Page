"use client"

import type React from "react"

import { useState } from "react"
import {
  Download,
  ArrowRight,
  Mail,
  MapPin,
  MessageSquare,
  X,
  Check,
  AlertTriangle,
  Briefcase,
  GraduationCap,
  Languages,
  Clock4,
  CreditCard,
  Plane,
  Code,
  HeartHandshake,
  Brain,
  Puzzle,
  Users,
  Lightbulb,
  RefreshCw,
  Timer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/contexts/language-context"

interface CandidateProfileDetailedProps {
  candidate: {
    id: string
    name: string
    avatar: string | null
    email: string
    jobTitle: string
    score: number
    strengths: string[]
    fitSummary: string
    profile: {
      summary: string
      pros: string[]
      cons: string[]
      hardFacts: {
        yearsOfExperience: number
        education: string
        languages: string[]
        location: string
        salary: string
        availability: string
        visaStatus: string
      }
    }
  }
  onClose?: () => void
}

// Strength icons mapping with Lucide icons
const strengthIcons: Record<string, React.ReactNode> = {
  "Technical Skills": <Code className="h-4 w-4 text-teal-600" />,
  Communication: <Mail className="h-4 w-4 text-teal-600" />,
  Leadership: <Users className="h-4 w-4 text-teal-600" />,
  "Problem Solving": <Puzzle className="h-4 w-4 text-teal-600" />,
  Teamwork: <HeartHandshake className="h-4 w-4 text-teal-600" />,
  Creativity: <Lightbulb className="h-4 w-4 text-teal-600" />,
  Adaptability: <RefreshCw className="h-4 w-4 text-teal-600" />,
  "Time Management": <Timer className="h-4 w-4 text-teal-600" />,
  "Critical Thinking": <Brain className="h-4 w-4 text-teal-600" />,
}

export default function CandidateProfileDetailed({ candidate, onClose }: CandidateProfileDetailedProps) {
  const [newNote, setNewNote] = useState("")
  const { language } = useLanguage()
  const [notes, setNotes] = useState<any[]>([])

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
      setNotes([
        {
          id: `note-${Date.now()}`,
          note: newNote,
          created_at: new Date().toISOString(),
          user: {
            name: "Current User",
          },
        },
        ...notes,
      ])
      setNewNote("")
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(language === "EN" ? "en-US" : "de-DE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  return (
    <Card className="h-full overflow-hidden shadow-lg border-0">
      <CardHeader className="pb-3 bg-gradient-to-r from-teal-500/10 to-blue-500/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
              <AvatarImage src={candidate.avatar || "/placeholder-icon.png"} alt={candidate.name} />
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white">
                {candidate.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{candidate.name}</CardTitle>
              <CardDescription className="text-base">{candidate.jobTitle}</CardDescription>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1 bg-white/50">
                  <Mail className="h-3 w-3" />
                  {candidate.email}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 bg-white/50">
                  <MapPin className="h-3 w-3" />
                  {candidate.profile.hardFacts.location}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            )}
            <div
              className={`flex h-16 w-16 flex-col items-center justify-center rounded-full ${getScoreBg(candidate.score)} ${getScoreColor(candidate.score)} border border-white/20 shadow-sm`}
            >
              <div className="text-xl font-bold">{candidate.score}%</div>
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
              value="profile"
              className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
            >
              {language === "EN" ? "Profile" : "Profil"}
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
            >
              {language === "EN" ? "Notes" : "Notizen"}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="h-[calc(100%-48px)] overflow-y-auto p-6">
          <TabsContent value="overview" className="m-0 h-full space-y-6">
            {/* AI Match Summary */}
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-4 rounded-lg border border-teal-100">
              <h3 className="mb-2 font-medium text-teal-800">
                {language === "EN" ? "AI Match Summary" : "KI-Übereinstimmungszusammenfassung"}
              </h3>
              <p className="text-teal-700">{candidate.fitSummary}</p>
            </div>

            <div>
              <h3 className="mb-2 font-medium">
                {language === "EN" ? "Candidate Summary" : "Kandidatenzusammenfassung"}
              </h3>
              <p className="text-muted-foreground">{candidate.profile.summary}</p>
            </div>

            <div>
              <h3 className="mb-2 font-medium">{language === "EN" ? "Match Score" : "Übereinstimmungswert"}</h3>
              <div className="mb-1 flex justify-between text-sm">
                <span>{language === "EN" ? "Overall Fit" : "Gesamtpassung"}</span>
                <span className={`font-medium ${getScoreColor(candidate.score)}`}>{candidate.score}%</span>
              </div>
              <Progress
                value={candidate.score}
                className="h-2"
                {...{ indicatorClassName: candidate.score >= 80 ? "bg-teal-500" : candidate.score >= 70 ? "bg-blue-500" : candidate.score >= 60 ? "bg-amber-500" : "bg-red-500" } as any}
              />

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-medium">
                    {language === "EN" ? "Skills Match" : "Fähigkeiten Übereinstimmung"}
                  </h4>
                  <Progress value={85} className="h-2 bg-gray-100" {...{ indicatorClassName: "bg-teal-500" } as any} />
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
                  <Progress value={78} className="h-2 bg-gray-100" {...{ indicatorClassName: "bg-blue-500" } as any} />
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
                  <Progress value={92} className="h-2 bg-gray-100" {...{ indicatorClassName: "bg-teal-500" } as any} />
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
                <h3 className="mb-2 font-medium">{language === "EN" ? "Pros" : "Vorteile"}</h3>
                <ul className="space-y-1">
                  {candidate.profile.pros.map((pro, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <span className="mr-2 text-teal-500">
                        <Check className="h-4 w-4" />
                      </span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-2 font-medium">{language === "EN" ? "Cons" : "Nachteile"}</h3>
                <ul className="space-y-1">
                  {candidate.profile.cons.map((con, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <span className="mr-2 text-amber-500">
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-medium">{language === "EN" ? "Key Strengths" : "Hauptstärken"}</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.strengths.map((strength, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-teal-50 text-teal-700 hover:bg-teal-100 flex items-center gap-1.5 py-1.5 px-3"
                  >
                    {strengthIcons[strength] || <Check className="h-4 w-4 text-teal-600" />}
                    {strength}
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

          <TabsContent value="profile" className="m-0 h-full space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Briefcase className="mr-2 h-5 w-5 text-teal-500" />
                    {language === "EN" ? "Experience" : "Erfahrung"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{language === "EN" ? "Years" : "Jahre"}</span>
                    <span className="font-medium">{candidate.profile.hardFacts.yearsOfExperience}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <GraduationCap className="mr-2 h-5 w-5 text-teal-500" />
                    {language === "EN" ? "Education" : "Ausbildung"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{candidate.profile.hardFacts.education}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Languages className="mr-2 h-5 w-5 text-teal-500" />
                    {language === "EN" ? "Languages" : "Sprachen"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {candidate.profile.hardFacts.languages.map((lang, index) => (
                      <li key={index} className="text-sm">
                        {lang}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Clock4 className="mr-2 h-5 w-5 text-teal-500" />
                    {language === "EN" ? "Availability" : "Verfügbarkeit"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{candidate.profile.hardFacts.availability}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <CreditCard className="mr-2 h-5 w-5 text-teal-500" />
                    {language === "EN" ? "Salary Expectation" : "Gehaltsvorstellung"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{candidate.profile.hardFacts.salary}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Plane className="mr-2 h-5 w-5 text-teal-500" />
                    {language === "EN" ? "Visa Status" : "Visumstatus"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{candidate.profile.hardFacts.visaStatus}</p>
                </CardContent>
              </Card>
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
                {notes && notes.length > 0 ? (
                  notes.map((note) => (
                    <div key={note.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-teal-100 text-teal-800">CU</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{note.user.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(note.created_at)}</span>
                      </div>
                      <p className="text-sm">{note.note}</p>
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
        </div>
      </Tabs>
    </Card>
  )
}

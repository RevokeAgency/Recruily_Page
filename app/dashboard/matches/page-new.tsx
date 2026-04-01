"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  ChevronDown,
  Code,
  HeartHandshake,
  Brain,
  Puzzle,
  Users,
  Lightbulb,
  RefreshCw,
  Timer,
  Mail,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabaseClient"
import { CVUploadModal as CvUploadModal } from "@/components/cv-upload-modal"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { generateDummyMatches, generateDummyJobs } from "@/lib/dummy-data"
import CandidateProfileDetailed from "@/components/candidate-profile-detailed"

// Status color mapping
const statusColors = {
  New: "bg-blue-100 text-blue-800",
  Interview: "bg-purple-100 text-purple-800",
  Offer: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
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

export default function MatchesPage() {
  const { language } = useLanguage()
  const { user } = useAuth()
  // Use the centralized Supabase client
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [scoreFilter, setScoreFilter] = useState<string[]>(["high", "medium", "low"])
  const [stageFilter, setStageFilter] = useState<string[]>(["New", "Interview", "Offer"])
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isCvModalOpen, setIsCvModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")

  // Use dummy data for jobs
  const [jobs, setJobs] = useState(generateDummyJobs(5))

  // Use dummy data for matches
  const [matches, setMatches] = useState<any[]>([])
  const mutateMatches = () => {
    setMatches(generateDummyMatches(15))
  }

  // Load dummy matches when job is selected
  useEffect(() => {
    if (selectedJob) {
      mutateMatches()
    }
  }, [selectedJob])

  // Filter matches
  const filteredMatches = matches?.filter((match) => {
    // Search filter
    if (searchTerm && !match.candidate.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Score filter
    const score = match.score
    if (
      (scoreFilter.includes("high") && score >= 80) ||
      (scoreFilter.includes("medium") && score >= 50 && score < 80) ||
      (scoreFilter.includes("low") && score < 50)
    ) {
      // Stage filter
      return stageFilter.includes(match.stage)
    }

    return false
  })

  // Setup realtime subscription
  useEffect(() => {
    if (!user) return

    const orgId = user.app_metadata?.org_id
    if (!orgId) return

    const channel = supabase
      .channel(`org_${orgId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matches", filter: `org_id=eq.${orgId}` },
        () => {
          // Refresh matches data
          mutateMatches()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // Handle job selection
  useEffect(() => {
    if (jobs && jobs.length > 0 && !selectedJob) {
      setSelectedJob(jobs[0].id)
    }
  }, [jobs, selectedJob])

  // Handle stage change
  const handleStageChange = async (matchId: string, newStage: string) => {
    // Update the stage in the local state
    setMatches(matches.map((match) => (match.id === matchId ? { ...match, stage: newStage } : match)))
  }

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-teal-700"
    if (score >= 50) return "text-blue-700"
    return "text-amber-700"
  }

  // Get score background
  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-teal-50"
    if (score >= 50) return "bg-blue-50"
    return "bg-amber-50"
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

  const openProfile = (match: any) => {
    setSelectedMatch(match)
    setIsProfileOpen(true)
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight">{language === "EN" ? "Matches" : "Übereinstimmungen"}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {}} className="bg-white shadow-sm border-0">
              <Download className="mr-2 h-4 w-4" />
              {language === "EN" ? "Export" : "Exportieren"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="w-full md:w-64">
            <Select value={selectedJob || ""} onValueChange={setSelectedJob}>
              <SelectTrigger className="bg-white shadow-sm border-0">
                <SelectValue placeholder={language === "EN" ? "Select Job" : "Job auswählen"} />
              </SelectTrigger>
              <SelectContent>
                {jobs?.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title} - {job.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={language === "EN" ? "Search candidates..." : "Kandidaten suchen..."}
              className="pl-8 bg-white shadow-sm border-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-white shadow-sm border-0">
                <Filter className="mr-2 h-4 w-4" />
                {language === "EN" ? "Score" : "Punktzahl"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>{language === "EN" ? "Filter by Score" : "Nach Punktzahl filtern"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={scoreFilter.includes("high")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setScoreFilter([...scoreFilter, "high"])
                  } else {
                    setScoreFilter(scoreFilter.filter((s) => s !== "high"))
                  }
                }}
              >
                {language === "EN" ? "High (80-100%)" : "Hoch (80-100%)"}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={scoreFilter.includes("medium")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setScoreFilter([...scoreFilter, "medium"])
                  } else {
                    setScoreFilter(scoreFilter.filter((s) => s !== "medium"))
                  }
                }}
              >
                {language === "EN" ? "Medium (50-79%)" : "Mittel (50-79%)"}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={scoreFilter.includes("low")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setScoreFilter([...scoreFilter, "low"])
                  } else {
                    setScoreFilter(scoreFilter.filter((s) => s !== "low"))
                  }
                }}
              >
                {language === "EN" ? "Low (0-49%)" : "Niedrig (0-49%)"}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-white shadow-sm border-0">
                <Filter className="mr-2 h-4 w-4" />
                {language === "EN" ? "Stage" : "Phase"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>{language === "EN" ? "Filter by Stage" : "Nach Phase filtern"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={stageFilter.includes("New")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setStageFilter([...stageFilter, "New"])
                  } else {
                    setStageFilter(stageFilter.filter((s) => s !== "New"))
                  }
                }}
              >
                {language === "EN" ? "New" : "Neu"}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={stageFilter.includes("Interview")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setStageFilter([...stageFilter, "Interview"])
                  } else {
                    setStageFilter(stageFilter.filter((s) => s !== "Interview"))
                  }
                }}
              >
                {language === "EN" ? "Interview" : "Interview"}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={stageFilter.includes("Offer")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setStageFilter([...stageFilter, "Offer"])
                  } else {
                    setStageFilter(stageFilter.filter((s) => s !== "Offer"))
                  }
                }}
              >
                {language === "EN" ? "Offer" : "Angebot"}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={stageFilter.includes("Rejected")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setStageFilter([...stageFilter, "Rejected"])
                  } else {
                    setStageFilter(stageFilter.filter((s) => s !== "Rejected"))
                  }
                }}
              >
                {language === "EN" ? "Rejected" : "Abgelehnt"}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tabs
            value={viewMode}
            onValueChange={(value: string) => setViewMode(value as "table" | "grid")}
            className="w-[180px]"
          >
            <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm border-0">
              <TabsTrigger value="table">{language === "EN" ? "Table" : "Tabelle"}</TabsTrigger>
              <TabsTrigger value="grid">{language === "EN" ? "Grid" : "Raster"}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {viewMode === "table" ? (
          <Card className="shadow-sm border-0 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[80px]">{language === "EN" ? "Score" : "Punktzahl"}</TableHead>
                    <TableHead>{language === "EN" ? "Candidate" : "Kandidat"}</TableHead>
                    <TableHead>{language === "EN" ? "Fit Summary" : "Passungszusammenfassung"}</TableHead>
                    <TableHead>{language === "EN" ? "Strengths" : "Stärken"}</TableHead>
                    <TableHead>{language === "EN" ? "Stage" : "Phase"}</TableHead>
                    <TableHead>{language === "EN" ? "Updated" : "Aktualisiert"}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatches && filteredMatches.length > 0 ? (
                    filteredMatches.map((match) => (
                      <TableRow
                        key={match.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openProfile(match)}
                      >
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full ${getScoreBg(match.score)} ${getScoreColor(match.score)} border border-white/20 shadow-sm`}
                            >
                              <span className="text-sm font-medium">{match.score}%</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="mr-2 h-8 w-8 border border-white/20 shadow-sm">
                              <AvatarImage src={match.candidate.avatar || "/placeholder-icon.png"} />
                              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white">
                                {match.candidate.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{match.candidate.name}</div>
                              <div className="text-xs text-muted-foreground">{match.candidate.jobTitle}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-[200px] truncate" title={match.fitSummary}>
                            {match.fitSummary}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <TooltipProvider>
                              {match.strengths &&
                                match.strengths.slice(0, 3).map((strength: string, index: number) => (
                                  <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                                        {strengthIcons[strength] || <Check className="h-4 w-4 text-teal-600" />}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{strength}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                            </TooltipProvider>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={match.stage}
                            onValueChange={(value: string) => {
                              handleStageChange(match.id, value)
                              // Stop propagation to prevent drawer from opening
                              event?.stopPropagation()
                            }}
                          >
                            <SelectTrigger
                              className="w-[100px] bg-white shadow-sm border-0"
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            >
                              <SelectValue>
                                <Badge className={statusColors[match.stage as keyof typeof statusColors]}>
                                  {match.stage}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                              <SelectItem value="New">
                                <Badge className={statusColors.New}>{language === "EN" ? "New" : "Neu"}</Badge>
                              </SelectItem>
                              <SelectItem value="Interview">
                                <Badge className={statusColors.Interview}>
                                  {language === "EN" ? "Interview" : "Interview"}
                                </Badge>
                              </SelectItem>
                              <SelectItem value="Offer">
                                <Badge className={statusColors.Offer}>{language === "EN" ? "Offer" : "Angebot"}</Badge>
                              </SelectItem>
                              <SelectItem value="Rejected">
                                <Badge className={statusColors.Rejected}>
                                  {language === "EN" ? "Rejected" : "Abgelehnt"}
                                </Badge>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(match.updated_at || match.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation()
                                  openProfile(match)
                                }}
                              >
                                {language === "EN" ? "View Profile" : "Profil anzeigen"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                {language === "EN" ? "Download CV" : "Lebenslauf herunterladen"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        {language === "EN" ? "No matches found." : "Keine Übereinstimmungen gefunden."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches && filteredMatches.length > 0 ? (
              filteredMatches.map((match) => (
                <Card
                  key={match.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-sm"
                  onClick={() => openProfile(match)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-white/20 shadow-sm">
                          <AvatarImage src={match.candidate.avatar || "/placeholder-icon.png"} />
                          <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white">
                            {match.candidate.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{match.candidate.name}</CardTitle>
                          <CardDescription className="text-xs">{match.candidate.jobTitle}</CardDescription>
                        </div>
                      </div>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${getScoreBg(match.score)} ${getScoreColor(match.score)} border border-white/20 shadow-sm`}
                      >
                        <span className="text-sm font-medium">{match.score}%</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-2">
                      <div className="text-sm line-clamp-2" title={match.fitSummary}>
                        {match.fitSummary}
                      </div>
                      <div className="flex gap-2 mt-2">
                        {match.strengths.slice(0, 3).map((strength: string, index: number) => (
                          <div
                            key={index}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-700"
                            title={strength}
                          >
                            {strengthIcons[strength] || <Check className="h-4 w-4 text-teal-600" />}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <Badge className={statusColors[match.stage as keyof typeof statusColors]}>{match.stage}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(match.updated_at || match.created_at)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full h-24 flex items-center justify-center">
                {language === "EN" ? "No matches found." : "Keine Übereinstimmungen gefunden."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Candidate Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          {selectedMatch && (
            <CandidateProfileDetailed
              candidate={{
                id: selectedMatch.candidate.id,
                name: selectedMatch.candidate.name,
                avatar: selectedMatch.candidate.avatar,
                email: selectedMatch.candidate.email,
                jobTitle: selectedMatch.candidate.jobTitle,
                score: selectedMatch.score,
                strengths: selectedMatch.strengths,
                fitSummary: selectedMatch.fitSummary,
                profile: selectedMatch.candidate.profile,
              }}
              onClose={() => setIsProfileOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* CV Upload Modal */}
      <CvUploadModal jobId={selectedJob ?? undefined} />
    </div>
  )
}

"use client"

import type React from "react"
import { MapPin } from "lucide-react" // Import MapPin here

import { useState, useEffect } from "react"
import {
  Search,
  Filter,
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
  Plus,
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
import { useJobs } from "@/hooks/use-jobs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import CandidateProfileDetailed from "@/components/candidate-profile-detailed"
import { useToast } from "@/hooks/use-toast"

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
  Experience: <Timer className="h-4 w-4 text-teal-600" />,
  Education: <Brain className="h-4 w-4 text-teal-600" />,
  Location: <MapPin className="h-4 w-4 text-teal-600" />,
}

export default function MatchesPage() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [scoreFilter, setScoreFilter] = useState<string[]>(["high", "medium", "low"])
  const [stageFilter, setStageFilter] = useState<string[]>(["New", "Interview", "Offer"])
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [matchingInProgress, setMatchingInProgress] = useState(false)

  // Get organisation ID from user
  const organisationId = user?.app_metadata?.org_id || "demo-org-123"

  // Use the jobs hook
  const { jobs, loading: jobsLoading, matchCandidates } = useJobs(organisationId)

  // Load matches when job is selected
  useEffect(() => {
    if (selectedJob && organisationId) {
      loadMatches()
    }
  }, [selectedJob, organisationId])

  // Set default job when jobs are loaded
  useEffect(() => {
    if (jobs && jobs.length > 0 && !selectedJob) {
      console.log("Setting default job:", jobs[0].id)
      setSelectedJob(jobs[0].id)
    }
  }, [jobs, selectedJob])

  const loadMatches = async () => {
    if (!selectedJob || !organisationId) return

    setLoading(true)
    try {
      console.log("Loading matches for job:", selectedJob, "org:", organisationId)
      const response = await fetch(`/api/matches?organisationId=${organisationId}&jobId=${selectedJob}`)
      if (!response.ok) {
        throw new Error("Failed to load matches")
      }
      const data = await response.json()
      console.log("Loaded matches:", data.matches?.length || 0)
      setMatches(data.matches || [])
    } catch (error) {
      console.error("Error loading matches:", error)
      toast({
        title: "Error",
        description: "Failed to load matches. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMatchCandidates = async () => {
    if (!selectedJob) return

    setMatchingInProgress(true)
    try {
      await matchCandidates(selectedJob)
      await loadMatches() // Reload matches after matching
      toast({
        title: "Success",
        description: "Candidates matched successfully!",
      })
    } catch (error) {
      console.error("Error matching candidates:", error)
      toast({
        title: "Error",
        description: "Failed to match candidates. Please try again.",
        variant: "destructive",
      })
    } finally {
      setMatchingInProgress(false)
    }
  }

  // Filter matches
  const filteredMatches =
    matches?.filter((match) => {
      // Search filter
      if (searchTerm && !match.candidate.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // Score filter
      const score = match.match_score * 100 // Convert to percentage
      const scoreInRange =
        (scoreFilter.includes("high") && score >= 80) ||
        (scoreFilter.includes("medium") && score >= 50 && score < 80) ||
        (scoreFilter.includes("low") && score < 50)

      if (!scoreInRange) return false

      // Stage filter
      return stageFilter.includes(match.stage)
    }) || []

  // Handle stage change
  const handleStageChange = async (matchId: string, newStage: string) => {
    try {
      const response = await fetch("/api/matches", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ matchId, status: newStage }),
      })

      if (!response.ok) {
        throw new Error("Failed to update match status")
      }

      // Update local state
      setMatches(matches.map((match) => (match.id === matchId ? { ...match, stage: newStage } : match)))

      toast({
        title: "Success",
        description: "Match status updated successfully!",
      })
    } catch (error) {
      console.error("Error updating match status:", error)
      toast({
        title: "Error",
        description: "Failed to update match status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Get score color
  const getScoreColor = (score: number) => {
    const percentage = score * 100
    if (percentage >= 80) return "text-teal-700"
    if (percentage >= 50) return "text-blue-700"
    return "text-amber-700"
  }

  // Get score background
  const getScoreBg = (score: number) => {
    const percentage = score * 100
    if (percentage >= 80) return "bg-teal-50"
    if (percentage >= 50) return "bg-blue-50"
    return "bg-amber-50"
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "Recently"
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

  if (jobsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p>Loading jobs...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{language === "EN" ? "Matches" : "Übereinstimmungen"}</h1>
          <p className="text-muted-foreground">
            {language === "EN"
              ? "Review AI-matched candidates for your jobs"
              : "Überprüfen Sie KI-gematchte Kandidaten für Ihre Jobs"}
          </p>
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
            {jobs?.length === 0 && (
              <p className="text-sm text-amber-500 mt-2">
                {language === "EN"
                  ? "No jobs found. Create a job first."
                  : "Keine Jobs gefunden. Erstellen Sie zuerst einen Job."}
              </p>
            )}
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
          <div className="flex gap-2">
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
            <Button
              onClick={handleMatchCandidates}
              disabled={!selectedJob || matchingInProgress}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {matchingInProgress ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {language === "EN" ? "Matching..." : "Matching..."}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {language === "EN" ? "Match Candidates" : "Kandidaten matchen"}
                </>
              )}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p>Loading matches...</p>
            </div>
          </div>
        ) : viewMode === "table" ? (
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
                              className={`flex h-10 w-10 items-center justify-center rounded-full ${getScoreBg(match.match_score)} ${getScoreColor(match.match_score)} border border-white/20 shadow-sm`}
                            >
                              <span className="text-sm font-medium">{Math.round(match.match_score * 100)}%</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="mr-2 h-8 w-8 border border-white/20 shadow-sm">
                              <AvatarImage src={match.candidate.avatar || "/placeholder-icon.png"} />
                              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white">
                                {match.candidate.name
                                  ?.split(" ")
                                  .map((n: string) => n[0])
                                  .join("") || "U"}
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
                        {matches.length === 0 ? (
                          <div className="text-center">
                            <p className="text-muted-foreground mb-2">
                              {language === "EN"
                                ? "No matches found for this job."
                                : "Keine Übereinstimmungen für diesen Job gefunden."}
                            </p>
                            <Button
                              onClick={handleMatchCandidates}
                              disabled={!selectedJob || matchingInProgress}
                              variant="outline"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              {language === "EN" ? "Match Candidates" : "Kandidaten matchen"}
                            </Button>
                          </div>
                        ) : language === "EN" ? (
                          "No matches found with current filters."
                        ) : (
                          "Keine Übereinstimmungen mit aktuellen Filtern gefunden."
                        )}
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
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("") || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{match.candidate.name}</CardTitle>
                          <CardDescription className="text-xs">{match.candidate.jobTitle}</CardDescription>
                        </div>
                      </div>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${getScoreBg(match.match_score)} ${getScoreColor(match.match_score)} border border-white/20 shadow-sm`}
                      >
                        <span className="text-sm font-medium">{Math.round(match.match_score * 100)}%</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-2">
                      <div className="text-sm line-clamp-2" title={match.fitSummary}>
                        {match.fitSummary}
                      </div>
                      <div className="flex gap-2 mt-2">
                        {match.strengths?.slice(0, 3).map((strength: string, index: number) => (
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
                {matches.length === 0 ? (
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">
                      {language === "EN"
                        ? "No matches found for this job."
                        : "Keine Übereinstimmungen für diesen Job gefunden."}
                    </p>
                    <Button
                      onClick={handleMatchCandidates}
                      disabled={!selectedJob || matchingInProgress}
                      variant="outline"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {language === "EN" ? "Match Candidates" : "Kandidaten matchen"}
                    </Button>
                  </div>
                ) : language === "EN" ? (
                  "No matches found with current filters."
                ) : (
                  "Keine Übereinstimmungen mit aktuellen Filtern gefunden."
                )}
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
                score: Math.round(selectedMatch.match_score * 100),
                strengths: selectedMatch.strengths,
                fitSummary: selectedMatch.fitSummary,
                profile: selectedMatch.candidate.profile,
              }}
              onClose={() => setIsProfileOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

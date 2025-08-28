"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import {
  Users,
  FileText,
  BarChart3,
  Settings,
  Plus,
  Search,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Star,
  TrendingUp,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useLanguage } from "@/contexts/language-context"
import { CVUploadEnhanced } from "@/components/cv-upload-enhanced"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Target, User, Award, GraduationCap } from "lucide-react"
import { ContactCandidateModal } from "@/components/contact-candidate-modal"
import { BulkContactModal } from "@/components/bulk-contact-modal"

interface Job {
  id: string
  title: string
  company: string
  location: string
  job_type?: string
  type?: string
  description: string
  requirements: string | string[]
  benefits?: string | string[]
  skills?: string
  salary_range?: string
  salary?: string
  status: string
  created_at?: string
  postedDate?: string
  applicants?: number
}

interface Candidate {
  id: string
  name: string
  email: string
  phone?: string
  position: string
  experience: string
  status: string
  match?: number
  location?: string
  avatar?: string
  applied?: string
  skills: string[]
  summary?: string
  jobId?: string
}

export default function JobWorkspacePage() {
  const params = useParams()
  const jobId = params.id as string
  const { language } = useLanguage()
  const { toast } = useToast()

  const [job, setJob] = useState<Job | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("candidates")

  // Delete functionality state
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  // Bulk contact functionality state
  const [showBulkContactModal, setShowBulkContactModal] = useState(false)
  const [bulkContactCandidates, setBulkContactCandidates] = useState<Candidate[]>([])

  const [showContactModal, setShowContactModal] = useState(false)
  const [selectedContactCandidate, setSelectedContactCandidate] = useState<Candidate | null>(null)

  // Helper function to ensure array format
  const ensureArray = (value: string | string[] | undefined): string[] => {
    if (!value) return []
    if (Array.isArray(value)) return value
    if (typeof value === "string") {
      // Split by common delimiters
      return value
        .split(/[,\n;]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    }
    return []
  }

  // Helper function to get job requirements as array
  const getJobRequirements = (job: Job | null): string[] => {
    if (!job) return []
    return ensureArray(job.requirements)
  }

  // Helper function to get job benefits as array
  const getJobBenefits = (job: Job | null): string[] => {
    if (!job) return []
    return ensureArray(job.benefits)
  }

  const handleContactCandidate = (candidate: Candidate) => {
    setSelectedContactCandidate(candidate)
    setShowContactModal(true)
  }

  const handleBulkContact = () => {
    const candidatesToContact = filteredCandidates.filter((candidate) => selectedCandidates.includes(candidate.id))
    setBulkContactCandidates(candidatesToContact)
    setShowBulkContactModal(true)
  }

  // Load job data
  const loadJob = async () => {
    try {
      setLoading(true)
      console.log("Loading job data for ID:", jobId)

      // Try to load from localStorage first (for newly created jobs)
      const storedJobs = localStorage.getItem("recruitify_jobs")
      if (storedJobs) {
        try {
          const jobs = JSON.parse(storedJobs)
          const foundJob = jobs.find((j: any) => j.id === jobId)
          if (foundJob) {
            console.log("Found job in localStorage:", foundJob)
            setJob(foundJob)
            setLoading(false)
            return
          }
        } catch (parseError) {
          console.error("Error parsing stored jobs:", parseError)
          localStorage.removeItem("recruitify_jobs")
        }
      }

      // Try API call
      try {
        const response = await fetch(`/api/jobs/${jobId}`)
        const data = await response.json()

        if (data.success && data.job) {
          console.log("Found job via API:", data.job)
          setJob(data.job)
          setLoading(false)
          return
        }
      } catch (apiError) {
        console.error("API call failed:", apiError)
      }

      // Create fallback job if not found
      console.log("Creating fallback job")
      const fallbackJob: Job = {
        id: jobId,
        title: "Software Developer",
        company: "Tech Company",
        location: "Berlin, Germany",
        job_type: "full-time",
        description: "We are looking for a talented software developer to join our team.",
        requirements: "Experience with JavaScript, React, and Node.js required.",
        benefits: "Health insurance, flexible hours, remote work options",
        skills: "JavaScript, React, Node.js, Git",
        salary_range: "€50,000 - €70,000",
        status: "active",
        created_at: new Date().toISOString(),
        applicants: 0,
      }
      setJob(fallbackJob)
    } catch (error) {
      console.error("Error loading job:", error)
      toast({
        title: language === "EN" ? "Error loading job" : "Fehler beim Laden des Jobs",
        description: language === "EN" ? "Could not load job details." : "Job-Details konnten nicht geladen werden.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load candidates for this job
  const loadCandidates = async () => {
    try {
      console.log("Loading candidates for job:", jobId)

      // Load from localStorage
      const storedCandidates = localStorage.getItem("recruitify_candidates")
      if (storedCandidates) {
        const allCandidates = JSON.parse(storedCandidates)
        const jobCandidates = allCandidates.filter((candidate: Candidate) => candidate.jobId === jobId)
        console.log(`Found ${jobCandidates.length} candidates for job ${jobId}`)
        setCandidates(jobCandidates)
        setFilteredCandidates(jobCandidates)
        return
      }

      // Try API call as fallback
      try {
        const response = await fetch(`/api/candidates?jobId=${jobId}`)
        const data = await response.json()

        if (data.success && data.candidates) {
          setCandidates(data.candidates)
          setFilteredCandidates(data.candidates)
        } else {
          setCandidates([])
          setFilteredCandidates([])
        }
      } catch (apiError) {
        console.error("API call for candidates failed:", apiError)
        setCandidates([])
        setFilteredCandidates([])
      }
    } catch (error) {
      console.error("Error loading candidates:", error)
      setCandidates([])
      setFilteredCandidates([])
    }
  }

  // Delete single candidate
  const deleteSingleCandidate = async (candidateId: string) => {
    try {
      setIsDeleting(true)
      console.log("Deleting candidate:", candidateId)

      // Remove from localStorage
      const storedCandidates = localStorage.getItem("recruitify_candidates")
      if (storedCandidates) {
        const allCandidates = JSON.parse(storedCandidates)
        const updatedCandidates = allCandidates.filter((candidate: Candidate) => candidate.id !== candidateId)
        localStorage.setItem("recruitify_candidates", JSON.stringify(updatedCandidates))
      }

      // Try to delete from API
      try {
        await fetch(`/api/candidates/${candidateId}`, {
          method: "DELETE",
        })
      } catch (apiError) {
        console.warn("API delete failed, localStorage updated:", apiError)
      }

      // Update local state
      setCandidates((prev) => prev.filter((candidate) => candidate.id !== candidateId))
      setFilteredCandidates((prev) => prev.filter((candidate) => candidate.id !== candidateId))
      setSelectedCandidates((prev) => prev.filter((id) => id !== candidateId))

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent("candidatesUpdated"))

      toast({
        title: language === "EN" ? "Candidate deleted" : "Kandidat gelöscht",
        description:
          language === "EN"
            ? "The candidate has been successfully removed."
            : "Der Kandidat wurde erfolgreich entfernt.",
      })
    } catch (error) {
      console.error("Error deleting candidate:", error)
      toast({
        title: language === "EN" ? "Error deleting candidate" : "Fehler beim Löschen des Kandidaten",
        description:
          language === "EN" ? "Could not delete the candidate." : "Der Kandidat konnte nicht gelöscht werden.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Delete multiple candidates
  const deleteBulkCandidates = async () => {
    try {
      setIsDeleting(true)
      console.log("Deleting candidates:", selectedCandidates)

      // Remove from localStorage
      const storedCandidates = localStorage.getItem("recruitify_candidates")
      if (storedCandidates) {
        const allCandidates = JSON.parse(storedCandidates)
        const updatedCandidates = allCandidates.filter(
          (candidate: Candidate) => !selectedCandidates.includes(candidate.id),
        )
        localStorage.setItem("recruitify_candidates", JSON.stringify(updatedCandidates))
      }

      // Try to delete from API
      try {
        await fetch("/api/candidates/bulk-delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ candidateIds: selectedCandidates }),
        })
      } catch (apiError) {
        console.warn("API bulk delete failed, localStorage updated:", apiError)
      }

      // Update local state
      setCandidates((prev) => prev.filter((candidate) => !selectedCandidates.includes(candidate.id)))
      setFilteredCandidates((prev) => prev.filter((candidate) => !selectedCandidates.includes(candidate.id)))
      setSelectedCandidates([])
      setShowBulkDeleteDialog(false)

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent("candidatesUpdated"))

      toast({
        title: language === "EN" ? "Candidates deleted" : "Kandidaten gelöscht",
        description: `${selectedCandidates.length} ${language === "EN" ? "candidates have been successfully removed." : "Kandidaten wurden erfolgreich entfernt."}`,
      })
    } catch (error) {
      console.error("Error deleting candidates:", error)
      toast({
        title: language === "EN" ? "Error deleting candidates" : "Fehler beim Löschen der Kandidaten",
        description:
          language === "EN" ? "Could not delete the candidates." : "Die Kandidaten konnten nicht gelöscht werden.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle individual candidate selection
  const handleCandidateSelection = (candidateId: string, checked: boolean) => {
    if (checked) {
      setSelectedCandidates((prev) => [...prev, candidateId])
    } else {
      setSelectedCandidates((prev) => prev.filter((id) => id !== candidateId))
    }
  }

  // Handle select all candidates
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidates(filteredCandidates.map((candidate) => candidate.id))
    } else {
      setSelectedCandidates([])
    }
  }

  useEffect(() => {
    if (jobId) {
      loadJob()
      loadCandidates()
    }
  }, [jobId])

  // Listen for candidate updates
  useEffect(() => {
    const handleCandidatesUpdated = () => {
      console.log("Candidates updated event received")
      loadCandidates()
    }

    window.addEventListener("candidatesUpdated", handleCandidatesUpdated)
    return () => window.removeEventListener("candidatesUpdated", handleCandidatesUpdated)
  }, [jobId])

  // Filter candidates
  useEffect(() => {
    let filtered = candidates

    if (searchTerm) {
      filtered = filtered.filter((candidate) => {
        const searchLower = searchTerm.toLowerCase()
        return (
          candidate.name.toLowerCase().includes(searchLower) ||
          candidate.email.toLowerCase().includes(searchLower) ||
          candidate.position.toLowerCase().includes(searchLower) ||
          candidate.skills.some((skill) => skill.toLowerCase().includes(searchLower))
        )
      })
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((candidate) => candidate.status.toLowerCase() === selectedStatus.toLowerCase())
    }

    setFilteredCandidates(filtered)
    // Clear selections when filter changes
    setSelectedCandidates([])
  }, [candidates, searchTerm, selectedStatus])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "applied":
        return "bg-blue-100 text-blue-800"
      case "screening":
        return "bg-yellow-100 text-yellow-800"
      case "interview":
        return "bg-purple-100 text-purple-800"
      case "offer":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "hired":
        return "bg-emerald-100 text-emerald-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleUploadComplete = () => {
    console.log("Upload completed, refreshing candidates")
    setShowUploadModal(false)
    loadCandidates()
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600"
    if (score >= 70) return "text-blue-600"
    if (score >= 55) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            {language === "EN" ? "Loading job workspace..." : "Lade Job-Arbeitsbereich..."}
          </p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">{language === "EN" ? "Job not found" : "Job nicht gefunden"}</h2>
          <p className="text-muted-foreground mb-4">
            {language === "EN"
              ? "The requested job could not be found."
              : "Der angeforderte Job konnte nicht gefunden werden."}
          </p>
          <Button onClick={() => window.history.back()}>{language === "EN" ? "Go Back" : "Zurück"}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
          <p className="text-muted-foreground">
            {job.company} • {job.location} • {candidates.length} candidates
          </p>
        </div>
        <Button onClick={() => setShowUploadModal(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="h-4 w-4 mr-2" />
          {language === "EN" ? "Upload CVs" : "CVs hochladen"}
        </Button>
      </div>

      {/* Job Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidates.length}</div>
            <p className="text-xs text-muted-foreground">
              +{candidates.filter((c) => c.applied === "Today" || c.applied === "1 day ago").length} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Matches</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidates.filter((c) => (c.match || 0) >= 80).length}</div>
            <p className="text-xs text-muted-foreground">80%+ match score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Process</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {candidates.filter((c) => ["screening", "interview", "offer"].includes(c.status.toLowerCase())).length}
            </div>
            <p className="text-xs text-muted-foreground">Active pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Match</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {candidates.length > 0
                ? Math.round(candidates.reduce((sum, c) => sum + (c.match || 0), 0) / candidates.length)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Match score</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="candidates">
            <Users className="h-4 w-4 mr-2" />
            Candidates ({candidates.length})
          </TabsTrigger>
          <TabsTrigger value="matching">
            <Star className="h-4 w-4 mr-2" />
            AI Matching
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="job-details">
            <FileText className="h-4 w-4 mr-2" />
            Job Details
          </TabsTrigger>
        </TabsList>

        {/* Candidates Tab */}
        <TabsContent value="candidates" className="space-y-4">
          {/* Filters and Bulk Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={language === "EN" ? "Search candidates..." : "Kandidaten suchen..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="applied">Applied</option>
              <option value="screening">Screening</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Bulk Actions Bar */}
          {filteredCandidates.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    {language === "EN" ? "Select All" : "Alle auswählen"} ({filteredCandidates.length})
                  </label>
                </div>
                {selectedCandidates.length > 0 && (
                  <Badge variant="secondary">
                    {selectedCandidates.length} {language === "EN" ? "selected" : "ausgewählt"}
                  </Badge>
                )}
              </div>

              {selectedCandidates.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkContact}
                    className="bg-teal-50 hover:bg-teal-100 border-teal-200"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {language === "EN" ? "Contact Selected" : "Ausgewählte kontaktieren"} ({selectedCandidates.length})
                  </Button>
                  <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={isDeleting}>
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        {language === "EN" ? "Delete Selected" : "Ausgewählte löschen"} ({selectedCandidates.length})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          {language === "EN" ? "Delete Candidates" : "Kandidaten löschen"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {language === "EN"
                            ? `Are you sure you want to delete ${selectedCandidates.length} candidate${selectedCandidates.length !== 1 ? "s" : ""}? This action cannot be undone.`
                            : `Sind Sie sicher, dass Sie ${selectedCandidates.length} Kandidat${selectedCandidates.length !== 1 ? "en" : ""} löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{language === "EN" ? "Cancel" : "Abbrechen"}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={deleteBulkCandidates}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {language === "EN" ? "Deleting..." : "Löschen..."}
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              {language === "EN" ? "Delete" : "Löschen"}
                            </>
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          )}

          {/* Candidates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((candidate) => (
              <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedCandidates.includes(candidate.id)}
                          onCheckedChange={(checked) => handleCandidateSelection(candidate.id, checked as boolean)}
                        />
                        <Avatar>
                          <AvatarImage src={candidate.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {candidate.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{candidate.name}</CardTitle>
                        <CardDescription>{candidate.position}</CardDescription>
                      </div>
                    </div>
                    {candidate.match && (
                      <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                        {candidate.match}% match
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    {candidate.email}
                  </div>
                  {candidate.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      {candidate.phone}
                    </div>
                  )}
                  {candidate.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {candidate.location}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4 mr-2" />
                    {candidate.experience}
                  </div>
                  {candidate.applied && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      Applied {candidate.applied}
                    </div>
                  )}

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {candidate.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{candidate.skills.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Badge className={getStatusColor(candidate.status)}>{candidate.status}</Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContactCandidate(candidate)}
                        className="bg-teal-50 hover:bg-teal-100 border-teal-200"
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        {language === "EN" ? "Contact" : "Kontakt"}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={candidate.avatar || "/placeholder.svg"} />
                                <AvatarFallback className="bg-teal-100 text-teal-700">
                                  {candidate.name.split(" ").map((n) => n[0])}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-xl font-bold">{candidate.name}</div>
                                <div className="text-sm font-normal text-muted-foreground">{candidate.position}</div>
                              </div>
                              {candidate.match && (
                                <Badge className={`${getMatchScoreColor(candidate.match)} ml-auto`}>
                                  <Star className="h-4 w-4 mr-1" />
                                  {candidate.match}% {language === "EN" ? "Match" : "Übereinstimmung"}
                                </Badge>
                              )}
                            </DialogTitle>
                          </DialogHeader>

                          <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="overview">{language === "EN" ? "Overview" : "Übersicht"}</TabsTrigger>
                              <TabsTrigger value="experience">
                                {language === "EN" ? "Experience" : "Erfahrung"}
                              </TabsTrigger>
                              <TabsTrigger value="skills">{language === "EN" ? "Skills" : "Fähigkeiten"}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Contact Information */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                      <Mail className="h-5 w-5 text-teal-600" />
                                      {language === "EN" ? "Contact Information" : "Kontaktinformationen"}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="flex items-center gap-3">
                                      <Mail className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">{candidate.email}</span>
                                    </div>
                                    {candidate.phone && (
                                      <div className="flex items-center gap-3">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{candidate.phone}</span>
                                      </div>
                                    )}
                                    {candidate.location && (
                                      <div className="flex items-center gap-3">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{candidate.location}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">
                                        {language === "EN" ? "Applied" : "Beworben"}:{" "}
                                        {candidate.applied || new Date().toLocaleDateString()}
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Status & Metrics */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                      <Target className="h-5 w-5 text-teal-600" />
                                      {language === "EN" ? "Status & Metrics" : "Status & Metriken"}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">
                                        {language === "EN" ? "Current Status" : "Aktueller Status"}
                                      </span>
                                      <Badge className={getStatusColor(candidate.status)}>{candidate.status}</Badge>
                                    </div>
                                    {candidate.match && (
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-medium">
                                            {language === "EN" ? "Match Score" : "Match-Score"}
                                          </span>
                                          <span className="text-sm font-bold">{candidate.match}%</span>
                                        </div>
                                        <Progress value={candidate.match} className="h-2" />
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">
                                        {language === "EN" ? "Experience" : "Erfahrung"}
                                      </span>
                                      <span className="text-sm">{candidate.experience}</span>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              {/* Professional Summary */}
                              {candidate.summary && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                      <User className="h-5 w-5 text-teal-600" />
                                      {language === "EN" ? "Professional Summary" : "Berufliche Zusammenfassung"}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-muted-foreground leading-relaxed">{candidate.summary}</p>
                                  </CardContent>
                                </Card>
                              )}
                            </TabsContent>

                            <TabsContent value="experience" className="space-y-6">
                              {/* Work Experience */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-teal-600" />
                                    {language === "EN" ? "Work Experience" : "Berufserfahrung"}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-4">
                                    <div className="border-l-4 border-teal-200 pl-4 pb-4">
                                      <h4 className="font-semibold text-lg">{candidate.position}</h4>
                                      <p className="text-muted-foreground font-medium">Previous Company</p>
                                      <p className="text-sm text-muted-foreground mb-2">{candidate.experience}</p>
                                      <p className="text-sm leading-relaxed">
                                        Professional experience in {candidate.position.toLowerCase()} with expertise in
                                        various technologies and methodologies.
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Education */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-teal-600" />
                                    {language === "EN" ? "Education" : "Bildung"}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-4">
                                    <div className="border-l-4 border-blue-200 pl-4">
                                      <h4 className="font-semibold">Bachelor's Degree</h4>
                                      <p className="text-muted-foreground">University</p>
                                      <p className="text-sm text-muted-foreground">2020</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>

                            <TabsContent value="skills" className="space-y-6">
                              {/* Technical Skills */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5 text-teal-600" />
                                    {language === "EN" ? "Technical Skills" : "Technische Fähigkeiten"}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="flex flex-wrap gap-2">
                                    {candidate.skills.map((skill, index) => (
                                      <Badge
                                        key={index}
                                        variant="secondary"
                                        className="bg-teal-100 text-teal-800 border-teal-200"
                                      >
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive bg-transparent"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                              {language === "EN" ? "Delete Candidate" : "Kandidat löschen"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {language === "EN"
                                ? `Are you sure you want to delete "${candidate.name}"? This action cannot be undone.`
                                : `Sind Sie sicher, dass Sie "${candidate.name}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{language === "EN" ? "Cancel" : "Abbrechen"}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteSingleCandidate(candidate.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  {language === "EN" ? "Deleting..." : "Löschen..."}
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {language === "EN" ? "Delete" : "Löschen"}
                                </>
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredCandidates.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No candidates found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedStatus !== "all"
                    ? "Try adjusting your search or filters"
                    : "Upload CVs to start building your candidate pipeline"}
                </p>
                <Button onClick={() => setShowUploadModal(true)} className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload CVs
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Matching Tab */}
        <TabsContent value="matching" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Candidate Matching</CardTitle>
              <CardDescription>
                Candidates are automatically scored based on job requirements, skills, and experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Top Matches */}
                <div>
                  <h4 className="font-medium mb-3">Top Matches (80%+)</h4>
                  <div className="space-y-3">
                    {candidates
                      .filter((c) => (c.match || 0) >= 80)
                      .sort((a, b) => (b.match || 0) - (a.match || 0))
                      .slice(0, 5)
                      .map((candidate) => (
                        <div key={candidate.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{candidate.name.split(" ").map((n) => n[0])}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{candidate.name}</div>
                              <div className="text-sm text-muted-foreground">{candidate.position}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800">{candidate.match}% match</Badge>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                  {candidates.filter((c) => (c.match || 0) >= 80).length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No high matches found. Upload more CVs to find better candidates.
                    </p>
                  )}
                </div>

                {/* Match Distribution */}
                <div>
                  <h4 className="font-medium mb-3">Match Score Distribution</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {candidates.filter((c) => (c.match || 0) >= 80).length}
                        </div>
                        <div className="text-sm text-muted-foreground">80-100%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {candidates.filter((c) => (c.match || 0) >= 60 && (c.match || 0) < 80).length}
                        </div>
                        <div className="text-sm text-muted-foreground">60-79%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {candidates.filter((c) => (c.match || 0) >= 40 && (c.match || 0) < 60).length}
                        </div>
                        <div className="text-sm text-muted-foreground">40-59%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {candidates.filter((c) => (c.match || 0) < 40).length}
                        </div>
                        <div className="text-sm text-muted-foreground">0-39%</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">This week</span>
                    <span className="font-medium">
                      {
                        candidates.filter((c) =>
                          ["Today", "1 day ago", "2 days ago", "3 days ago"].includes(c.applied || ""),
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last week</span>
                    <span className="font-medium">{candidates.filter((c) => c.applied === "1 week ago").length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">This month</span>
                    <span className="font-medium">{candidates.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"].map((status) => {
                    const count = candidates.filter((c) => c.status.toLowerCase() === status.toLowerCase()).length
                    const percentage = candidates.length > 0 ? Math.round((count / candidates.length) * 100) : 0
                    return (
                      <div key={status} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(status)} variant="outline">
                            {status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{count}</span>
                          <span className="text-sm text-muted-foreground ml-2">({percentage}%)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Job Details Tab */}
        <TabsContent value="job-details" className="space-y-4">
          {job && (
            <Card>
              <CardHeader>
                <CardTitle>{job.title}</CardTitle>
                <CardDescription>
                  {job.company} • {job.location} • {job.job_type || job.type || "Full-time"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Job Description</h4>
                  <p className="text-sm text-muted-foreground">{job.description}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Requirements</h4>
                  <div className="flex flex-wrap gap-2">
                    {getJobRequirements(job).map((req, index) => (
                      <Badge key={index} variant="outline">
                        {req}
                      </Badge>
                    ))}
                  </div>
                  {getJobRequirements(job).length === 0 && (
                    <p className="text-sm text-muted-foreground">No specific requirements listed</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Benefits</h4>
                  <div className="flex flex-wrap gap-2">
                    {getJobBenefits(job).map((benefit, index) => (
                      <Badge key={index} variant="secondary">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                  {getJobBenefits(job).length === 0 && (
                    <p className="text-sm text-muted-foreground">No specific benefits listed</p>
                  )}
                </div>

                {(job.salary_range || job.salary) && (
                  <div>
                    <h4 className="font-medium mb-2">Salary Range</h4>
                    <p className="text-sm text-muted-foreground">{job.salary_range || job.salary}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Posted on {new Date(job.created_at || job.postedDate || Date.now()).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status:{" "}
                      <Badge
                        className={
                          job.status === "active" || job.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {job.status === "active" ? "Active" : job.status}
                      </Badge>
                    </p>
                  </div>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Job
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Candidate CVs</DialogTitle>
            <DialogDescription>
              Upload CV files to automatically extract candidate information and match them to this job.
            </DialogDescription>
          </DialogHeader>
          <CVUploadEnhanced onComplete={handleUploadComplete} jobId={jobId} />
        </DialogContent>
      </Dialog>

      {/* Individual Contact Modal */}
      {selectedContactCandidate && (
        <ContactCandidateModal
          isOpen={showContactModal}
          onClose={() => {
            setShowContactModal(false)
            setSelectedContactCandidate(null)
          }}
          candidate={selectedContactCandidate}
          jobTitle={job?.title}
          companyName={job?.company}
        />
      )}

      {/* Bulk Contact Modal */}
      <BulkContactModal
        isOpen={showBulkContactModal}
        onClose={() => {
          setShowBulkContactModal(false)
          setBulkContactCandidates([])
        }}
        candidates={bulkContactCandidates}
        jobTitle={job?.title}
        companyName={job?.company}
      />
    </div>
  )
}

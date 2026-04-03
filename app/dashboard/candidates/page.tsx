"use client"

import { useState } from "react"
import {
  Search,
  Filter,
  MoreHorizontal,
  ChevronDown,
  MapPin,
  Mail,
  Download,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Users,
  RefreshCw,
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
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/hooks/use-auth"
import { useCandidates } from "@/hooks/use-candidates"
import { useToast } from "@/hooks/use-toast"
import CandidateProfileDetailed from "@/components/candidate-profile-detailed"
import { ContactCandidateModal } from "@/components/contact-candidate-modal"
import { BulkContactModal } from "@/components/bulk-contact-modal"
import { Checkbox } from "@/components/ui/checkbox"

// Status color mapping
const statusColors = {
  Applied: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  hired: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  Contacted: "bg-yellow-100 text-yellow-800",
  Interviewing: "bg-purple-100 text-purple-800",
}

export default function CandidatesPage() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>([
    "Applied",
    "Contacted",
    "Interviewing",
    "active",
    "inactive",
  ])
  const [experienceFilter, setExperienceFilter] = useState<string[]>(["Junior", "Mid-level", "Senior"])
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isBulkContactModalOpen, setIsBulkContactModalOpen] = useState(false)
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])

  // Get organisation ID from user
  const organisationId = user?.app_metadata?.org_id || null

  // Use the candidates hook
  const { candidates, loading, error, deleteCandidate, refetch } = useCandidates(organisationId)

  console.log("🔍 Candidates page debug:", {
    candidatesCount: candidates.length,
    loading,
    error,
    organisationId,
    candidates: candidates.slice(0, 3), // Show first 3 for debugging
  })

  // Filter candidates
  const filteredCandidates = candidates.filter((candidate) => {
    // Search filter
    if (
      searchTerm &&
      !candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !candidate.position.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false
    }

    // Status filter
    if (!statusFilter.includes(candidate.status)) {
      return false
    }

    // Experience filter
    const experienceLevel = candidate.experience_level || "Mid-level"
    return experienceFilter.includes(experienceLevel)
  })

  // Handle candidate deletion
  const handleDeleteCandidate = async (candidateId: string, candidateName: string) => {
    try {
      await deleteCandidate(candidateId)
      toast({
        title: "Success",
        description: `Candidate "${candidateName}" deleted successfully!`,
      })
    } catch (error) {
      console.error("Error deleting candidate:", error)
      toast({
        title: "Error",
        description: "Failed to delete candidate. Please try again.",
        variant: "destructive",
      })
    }
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

  const openProfile = (candidate: any) => {
    setSelectedCandidate(candidate)
    setIsProfileOpen(true)
  }

  const openContactModal = (candidate: any) => {
    setSelectedCandidate(candidate)
    setIsContactModalOpen(true)
  }

  const handleSelectCandidate = (candidateId: string, checked: boolean) => {
    if (checked) {
      setSelectedCandidates([...selectedCandidates, candidateId])
    } else {
      setSelectedCandidates(selectedCandidates.filter((id) => id !== candidateId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidates(filteredCandidates.map((c) => c.id))
    } else {
      setSelectedCandidates([])
    }
  }

  const handleRefresh = () => {
    console.log("🔄 Manual refresh triggered")
    refetch()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p>Loading candidates...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading candidates: {error}</p>
          <Button onClick={handleRefresh}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{language === "EN" ? "Candidates" : "Kandidaten"}</h1>
            <p className="text-muted-foreground">
              {language === "EN"
                ? "Manage your candidate database and track applications"
                : "Verwalten Sie Ihre Kandidatendatenbank und verfolgen Sie Bewerbungen"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {language === "EN"
                ? `${candidates.length} total candidates`
                : `${candidates.length} Kandidaten insgesamt`}
              {filteredCandidates.length !== candidates.length &&
                ` (${filteredCandidates.length} ${language === "EN" ? "filtered" : "gefiltert"})`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" className="bg-white shadow-sm border-0">
              <RefreshCw className="mr-2 h-4 w-4" />
              {language === "EN" ? "Refresh" : "Aktualisieren"}
            </Button>
            {selectedCandidates.length > 0 && (
              <Button
                onClick={() => setIsBulkContactModalOpen(true)}
                variant="outline"
                className="bg-white shadow-sm border-0"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {language === "EN"
                  ? `Contact ${selectedCandidates.length}`
                  : `${selectedCandidates.length} kontaktieren`}
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
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
                {language === "EN" ? "Status" : "Status"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>{language === "EN" ? "Filter by Status" : "Nach Status filtern"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {["Applied", "Contacted", "Interviewing", "active", "inactive", "hired", "rejected"].map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter.includes(status)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setStatusFilter([...statusFilter, status])
                    } else {
                      setStatusFilter(statusFilter.filter((s) => s !== status))
                    }
                  }}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-white shadow-sm border-0">
                <Filter className="mr-2 h-4 w-4" />
                {language === "EN" ? "Experience" : "Erfahrung"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>
                {language === "EN" ? "Filter by Experience" : "Nach Erfahrung filtern"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {["Junior", "Mid-level", "Senior"].map((level) => (
                <DropdownMenuCheckboxItem
                  key={level}
                  checked={experienceFilter.includes(level)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setExperienceFilter([...experienceFilter, level])
                    } else {
                      setExperienceFilter(experienceFilter.filter((e) => e !== level))
                    }
                  }}
                >
                  {level}
                </DropdownMenuCheckboxItem>
              ))}
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
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>{language === "EN" ? "Candidate" : "Kandidat"}</TableHead>
                    <TableHead>{language === "EN" ? "Position" : "Position"}</TableHead>
                    <TableHead>{language === "EN" ? "Experience" : "Erfahrung"}</TableHead>
                    <TableHead>{language === "EN" ? "Location" : "Standort"}</TableHead>
                    <TableHead>{language === "EN" ? "Status" : "Status"}</TableHead>
                    <TableHead>{language === "EN" ? "Match" : "Übereinstimmung"}</TableHead>
                    <TableHead>{language === "EN" ? "Added" : "Hinzugefügt"}</TableHead>
                    <TableHead className="w-[100px]">{language === "EN" ? "Actions" : "Aktionen"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates && filteredCandidates.length > 0 ? (
                    filteredCandidates.map((candidate) => (
                      <TableRow
                        key={candidate.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openProfile(candidate)}
                      >
                        <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedCandidates.includes(candidate.id)}
                            onCheckedChange={(checked) => handleSelectCandidate(candidate.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="mr-3 h-10 w-10 border border-white/20 shadow-sm">
                              <AvatarImage src={candidate.avatar || "/placeholder-icon.png"} />
                              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white">
                                {candidate.name
                                  ?.split(" ")
                                  .map((n: string) => n[0])
                                  .join("") || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{candidate.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                {candidate.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {candidate.position || candidate.job_title || "Not specified"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {candidate.skills?.slice(0, 2).join(", ") || "No skills listed"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{candidate.experience_level || "Mid-level"}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span>{candidate.location || "Remote"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              statusColors[candidate.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
                            }
                          >
                            {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {candidate.match && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {candidate.match}%
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(candidate.created_at || candidate.applied || candidate.added_date || "")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e: any) => {
                                e.stopPropagation()
                                openContactModal(candidate)
                              }}
                              className="h-8 px-2"
                            >
                              <MessageSquare className="h-3 w-3" />
                            </Button>
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
                                    openProfile(candidate)
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  {language === "EN" ? "View Profile" : "Profil anzeigen"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation()
                                    openContactModal(candidate)
                                  }}
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  {language === "EN" ? "Contact" : "Kontaktieren"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                  <Download className="mr-2 h-4 w-4" />
                                  {language === "EN" ? "Download CV" : "Lebenslauf herunterladen"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  {language === "EN" ? "Edit" : "Bearbeiten"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation()
                                    handleDeleteCandidate(candidate.id, candidate.name)
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {language === "EN" ? "Delete" : "Löschen"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        <div className="text-center">
                          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">
                            {language === "EN" ? "No candidates found" : "Keine Kandidaten gefunden"}
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            {language === "EN"
                              ? "Upload some CVs or adjust your filters to see candidates."
                              : "Laden Sie einige CVs hoch oder passen Sie Ihre Filter an, um Kandidaten zu sehen."}
                          </p>
                          <div className="flex gap-2 justify-center">
                            <Button onClick={handleRefresh} variant="outline">
                              <RefreshCw className="mr-2 h-4 w-4" />
                              {language === "EN" ? "Refresh" : "Aktualisieren"}
                            </Button>
                            <p className="text-sm text-muted-foreground">
                              {language === "EN"
                                ? "Add candidates by uploading CVs inside a Job"
                                : "Fügen Sie Kandidaten hinzu, indem Sie CVs in einem Stellenangebot hochladen"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCandidates && filteredCandidates.length > 0 ? (
              filteredCandidates.map((candidate) => (
                <Card
                  key={candidate.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-sm"
                  onClick={() => openProfile(candidate)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border border-white/20 shadow-sm">
                          <AvatarImage src={candidate.avatar || "/placeholder-icon.png"} />
                          <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white">
                            {candidate.name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("") || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{candidate.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {candidate.position || candidate.job_title || "Not specified"}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Checkbox
                          checked={selectedCandidates.includes(candidate.id)}
                          onCheckedChange={(checked) => handleSelectCandidate(candidate.id, checked as boolean)}
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        />
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
                                openProfile(candidate)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {language === "EN" ? "View Profile" : "Profil anzeigen"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation()
                                openContactModal(candidate)
                              }}
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              {language === "EN" ? "Contact" : "Kontaktieren"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                              <Download className="mr-2 h-4 w-4" />
                              {language === "EN" ? "Download CV" : "Lebenslauf herunterladen"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                              <Edit className="mr-2 h-4 w-4" />
                              {language === "EN" ? "Edit" : "Bearbeiten"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation()
                                handleDeleteCandidate(candidate.id, candidate.name)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {language === "EN" ? "Delete" : "Löschen"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{candidate.email}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{candidate.location || "Remote"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{candidate.experience_level || "Mid-level"}</Badge>
                        <Badge
                          className={
                            statusColors[candidate.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"
                          }
                        >
                          {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                        </Badge>
                        {candidate.match && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {candidate.match}%
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(candidate.created_at || candidate.applied || candidate.added_date || "")}
                        </span>
                        <Button
                          size="sm"
                          onClick={(e: any) => {
                            e.stopPropagation()
                            openContactModal(candidate)
                          }}
                          className="bg-teal-600 hover:bg-teal-700 h-8 px-3"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {language === "EN" ? "Contact" : "Kontakt"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {language === "EN" ? "No candidates found" : "Keine Kandidaten gefunden"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {language === "EN"
                    ? "Upload some CVs or adjust your filters to see candidates."
                    : "Laden Sie einige CVs hoch oder passen Sie Ihre Filter an, um Kandidaten zu sehen."}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleRefresh} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {language === "EN" ? "Refresh" : "Aktualisieren"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {language === "EN"
                    ? "Add candidates by uploading CVs inside a Job"
                    : "Fügen Sie Kandidaten hinzu, indem Sie CVs in einem Stellenangebot hochladen"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Candidate Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          {selectedCandidate && (
            <CandidateProfileDetailed
              candidate={{
                id: selectedCandidate.id,
                name: selectedCandidate.name,
                avatar: selectedCandidate.avatar,
                email: selectedCandidate.email,
                jobTitle: selectedCandidate.position || selectedCandidate.job_title || "Not specified",
                score: selectedCandidate.match || 85,
                strengths: selectedCandidate.strengths || ["Technical Skills", "Communication", "Problem Solving"],
                fitSummary:
                  selectedCandidate.summary ||
                  "Strong candidate with relevant experience and skills that align well with our requirements.",
                profile: {
                  summary:
                    selectedCandidate.summary || "Experienced professional with a strong background in their field.",
                  pros: selectedCandidate.strengths || ["Technical Skills", "Communication"],
                  cons: selectedCandidate.weaknesses || [],
                  hardFacts: {
                    yearsOfExperience: selectedCandidate.yearsOfExperience || selectedCandidate.experience_years || 0,
                    education: selectedCandidate.education || "Not specified",
                    languages: selectedCandidate.languages || ["English"],
                    location: selectedCandidate.location || "Not specified",
                    salary: selectedCandidate.salary_expectation || "Not specified",
                    availability: selectedCandidate.availability || "available",
                    visaStatus: selectedCandidate.visa_status || "Not specified",
                  },
                },
              }}
              onClose={() => setIsProfileOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Candidate Modal */}
      <ContactCandidateModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        candidate={selectedCandidate}
      />

      {/* Bulk Contact Modal */}
      <BulkContactModal
        isOpen={isBulkContactModalOpen}
        onClose={() => setIsBulkContactModalOpen(false)}
        candidates={filteredCandidates.filter((c) => selectedCandidates.includes(c.id))}
      />
    </div>
  )
}

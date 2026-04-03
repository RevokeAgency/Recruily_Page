"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Award, 
  FileText, 
  Eye, 
  MessageCircle,
  MoreVertical,
  Filter,
  SortDesc,
  Users
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { InviteCandidatesModal } from "./invite-candidates-modal"
import Link from "next/link"

interface JobApplicationsTabProps {
  jobId: string
  jobTitle: string
}

interface CandidateMatch {
  id: string
  candidate_id: string
  job_id: string
  score: number
  status: string
  match_reasons: any
  strengths: string[]
  weaknesses: string[]
  skill_matches: any
  ai_analysis: any
  created_at: string
  candidate: {
    id: string
    name: string
    email: string
    phone?: string
    location?: string
    skills: string[]
    experience_years: number
    education?: string
    summary?: string
    languages?: string[]
    certifications?: string[]
    status: string
    profile_image_url?: string
  }
}

export function JobApplicationsTab({ jobId, jobTitle }: JobApplicationsTabProps) {
  const [candidates, setCandidates] = useState<CandidateMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"score" | "date" | "name">("score")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    fetchCandidates()
  }, [jobId])

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/matches?jobId=${jobId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch candidates')
      }

      const result = await response.json()
      
      if (result.success) {
        setCandidates(result.matches || [])
      } else {
        // Fallback to mock data for development
        console.warn("Using mock candidate data")
        setCandidates(getMockCandidates())
      }
    } catch (error) {
      console.error('Error fetching candidates:', error)
      setError('Failed to load candidates')
      // Use mock data as fallback
      setCandidates(getMockCandidates())
    } finally {
      setLoading(false)
    }
  }

  const handleCandidateAdded = (newCandidate: any) => {
    // Add new candidate to the list
    const mockMatch: CandidateMatch = {
      id: `match_${Date.now()}`,
      candidate_id: newCandidate.id,
      job_id: jobId,
      score: newCandidate.match_score || 75,
      status: 'reviewed',
      match_reasons: {},
      strengths: ['Strong skills match', 'Relevant experience'],
      weaknesses: [],
      skill_matches: {},
      ai_analysis: {},
      created_at: new Date().toISOString(),
      candidate: {
        id: newCandidate.id,
        name: newCandidate.name,
        email: newCandidate.email,
        phone: newCandidate.phone,
        location: newCandidate.location,
        skills: newCandidate.skills || [],
        experience_years: newCandidate.experience_years || 0,
        education: newCandidate.education,
        summary: newCandidate.summary,
        languages: newCandidate.languages || ['English'],
        certifications: newCandidate.certifications || [],
        status: 'active',
        profile_image_url: newCandidate.profile_image_url
      }
    }

    setCandidates(prev => [mockMatch, ...prev])
  }

  const getMockCandidates = (): CandidateMatch[] => {
    return [
      {
        id: "match_1",
        candidate_id: "candidate_1",
        job_id: jobId,
        score: 92,
        status: "reviewed",
        match_reasons: { skill_match_count: 8, experience_suitable: true },
        strengths: ["Excellent React skills", "Senior level experience", "Strong portfolio"],
        weaknesses: ["No AWS experience"],
        skill_matches: { matched: ["React", "TypeScript", "JavaScript"], missing: ["AWS"] },
        ai_analysis: { recommendation: "strong_match", confidence: 0.92 },
        created_at: "2024-09-14T10:30:00Z",
        candidate: {
          id: "candidate_1",
          name: "Sarah Chen",
          email: "sarah.chen@email.com",
          phone: "+1 (555) 123-4567",
          location: "San Francisco, CA",
          skills: ["React", "TypeScript", "JavaScript", "Node.js", "Python"],
          experience_years: 6,
          education: "M.S. Computer Science",
          summary: "Senior Frontend Developer with 6 years of experience building scalable web applications",
          languages: ["English", "Mandarin"],
          certifications: ["AWS Developer Associate"],
          status: "active"
        }
      },
      {
        id: "match_2",
        candidate_id: "candidate_2",
        job_id: jobId,
        score: 78,
        status: "contacted",
        match_reasons: { skill_match_count: 6, experience_suitable: true },
        strengths: ["Good technical skills", "Relevant experience"],
        weaknesses: ["Junior level for senior role", "Limited leadership experience"],
        skill_matches: { matched: ["JavaScript", "React", "CSS"], missing: ["TypeScript", "Node.js"] },
        ai_analysis: { recommendation: "good_match", confidence: 0.78 },
        created_at: "2024-09-13T15:45:00Z",
        candidate: {
          id: "candidate_2",
          name: "Marcus Johnson",
          email: "marcus.j@email.com",
          phone: "+1 (555) 987-6543",
          location: "Austin, TX",
          skills: ["JavaScript", "React", "CSS", "HTML", "Git"],
          experience_years: 3,
          education: "B.S. Computer Science",
          summary: "Mid-level Frontend Developer passionate about creating user-friendly interfaces",
          languages: ["English", "Spanish"],
          certifications: [],
          status: "active"
        }
      },
      {
        id: "match_3",
        candidate_id: "candidate_3",
        job_id: jobId,
        score: 65,
        status: "pending",
        match_reasons: { skill_match_count: 4, experience_suitable: false },
        strengths: ["Eager to learn", "Strong educational background"],
        weaknesses: ["Limited professional experience", "Missing key skills"],
        skill_matches: { matched: ["JavaScript", "HTML"], missing: ["React", "TypeScript", "Node.js"] },
        ai_analysis: { recommendation: "potential_match", confidence: 0.65 },
        created_at: "2024-09-12T09:15:00Z",
        candidate: {
          id: "candidate_3",
          name: "Emily Rodriguez",
          email: "emily.rodriguez@email.com",
          phone: "+1 (555) 456-7890",
          location: "Remote",
          skills: ["JavaScript", "HTML", "CSS", "Python", "SQL"],
          experience_years: 1,
          education: "B.S. Software Engineering",
          summary: "Recent graduate with strong fundamentals and enthusiasm for frontend development",
          languages: ["English", "Spanish"],
          certifications: ["Google Analytics Certified"],
          status: "active"
        }
      }
    ]
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "contacted": return "bg-blue-500"
      case "interviewing": return "bg-purple-500"
      case "reviewed": return "bg-green-500"
      case "rejected": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const sortedAndFilteredCandidates = candidates
    .filter(match => filterStatus === "all" || match.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.score - a.score
        case "date":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "name":
          return a.candidate.name.localeCompare(b.candidate.name)
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading candidates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            Applications ({candidates.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                All Candidates
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("pending")}>
                Pending Review
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("reviewed")}>
                Reviewed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("contacted")}>
                Contacted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("interviewing")}>
                Interviewing
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SortDesc className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy("score")}>
                Match Score (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("date")}>
                Application Date (Recent First)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name")}>
                Name (A-Z)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <InviteCandidatesModal
            jobId={jobId}
            jobTitle={jobTitle}
            onCandidateAdded={handleCandidateAdded}
          />
        </div>
      </div>

      {error && (
        <div className="text-center p-4 text-destructive">
          <p>{error}</p>
          <Button onClick={fetchCandidates} variant="outline" size="sm" className="mt-2">
            Try Again
          </Button>
        </div>
      )}

      {/* Candidates List */}
      {sortedAndFilteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No candidates yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by inviting candidates to this position
            </p>
            <InviteCandidatesModal
              jobId={jobId}
              jobTitle={jobTitle}
              onCandidateAdded={handleCandidateAdded}
              trigger={
                <Button>
                  <User className="h-4 w-4 mr-2" />
                  Invite Your First Candidate
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedAndFilteredCandidates.map((match) => (
            <Card key={match.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={match.candidate.profile_image_url} />
                      <AvatarFallback>
                        {match.candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-lg">{match.candidate.name}</h4>
                        <Badge variant={getScoreBadgeVariant(match.score)}>
                          {match.score}% match
                        </Badge>
                        <Badge variant="outline" className={`${getStatusColor(match.status)} text-white`}>
                          {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {match.candidate.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {match.candidate.email}
                          </div>
                        )}
                        {match.candidate.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {match.candidate.location}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(match.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/candidates/${match.candidate.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact Candidate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Update Status</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Remove from Job
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Match Score Visualization */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Match Score</span>
                    <span className="font-semibold">{match.score}%</span>
                  </div>
                  <Progress value={match.score} className="h-2" />
                </div>

                {/* Summary */}
                {match.candidate.summary && (
                  <div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {match.candidate.summary}
                    </p>
                  </div>
                )}

                {/* Skills */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Key Skills</h5>
                  <div className="flex flex-wrap gap-1">
                    {match.candidate.skills.slice(0, 6).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {match.candidate.skills.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{match.candidate.skills.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Experience & Education */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Experience:</span>
                    <span className="ml-1">{match.candidate.experience_years} years</span>
                  </div>
                  {match.candidate.education && (
                    <div>
                      <span className="font-medium">Education:</span>
                      <span className="ml-1">{match.candidate.education}</span>
                    </div>
                  )}
                </div>

                {/* AI Analysis Summary */}
                {match.strengths.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-2 text-green-700">Strengths</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {match.strengths.slice(0, 3).map((strength, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="h-1 w-1 bg-green-500 rounded-full"></div>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button asChild variant="default" size="sm">
                    <Link href={`/candidates/${match.candidate.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Profile
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                  {match.candidate.phone && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`tel:${match.candidate.phone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
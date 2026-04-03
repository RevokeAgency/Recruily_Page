"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  TrendingUp, 
  Award, 
  Calendar, 
  ExternalLink, 
  Download,
  Filter,
  Search,
  SortDesc,
  CheckCircle,
  XCircle,
  MessageSquare,
  Eye,
  Briefcase,
  GraduationCap,
  Globe,
  Link
} from "lucide-react"
import { CandidateQuickActions } from "./candidate-quick-actions"
import { InviteCandidatesModal } from "./invite-candidates-modal"

interface CandidateMatch {
  id: string
  job_id: string
  candidate_id: string
  overall_score: number
  skills_score: number
  experience_score: number
  education_score: number
  languages_score: number
  certifications_score: number
  other_score: number
  strengths: string[]
  gaps: string[]
  recommendations: string[]
  created_at: string
  candidate: {
    id: string
    name: string
    email: string
    phone?: string
    location?: string
    summary?: string
    skills: string[]
    experience: any[]
    education: any[]
    languages: string[]
    certifications: string[]
    experience_years: number
    degree?: string
    university?: string
    linkedin_url?: string
    portfolio_url?: string
    github_url?: string
    resume_url?: string
    source?: string
    tags: string[]
  }
}

interface CandidateListProps {
  jobId: string
  jobTitle?: string
}

export function CandidateList({ jobId, jobTitle = "Job Position" }: CandidateListProps) {
  const [candidates, setCandidates] = useState<CandidateMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("overall_score")
  const [filterBy, setFilterBy] = useState("all")
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateMatch | null>(null)

  // Fetch candidates
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        console.log('🔍 Fetching candidates for job:', jobId)
        setLoading(true)
        
        const response = await fetch(`/api/jobs/${jobId}/candidates`)
        const result = await response.json()
        
        if (result.success) {
          setCandidates(result.candidates || [])
          console.log(`✅ Loaded ${result.candidates?.length || 0} candidates`)
        } else {
          setError(result.error || 'Failed to load candidates')
        }
      } catch (err: any) {
        console.error('❌ Error fetching candidates:', err)
        setError(err.message || 'Failed to load candidates')
      } finally {
        setLoading(false)
      }
    }

    if (jobId) {
      fetchCandidates()
    }
  }, [jobId])

  // Filter and sort candidates
  const filteredCandidates = useMemo(() => {
    let filtered = candidates

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(match => 
        match.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (match.candidate.skills || []).some((skill: string) => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        (match.candidate.location || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Score filter
    if (filterBy !== "all") {
      const minScore = filterBy === "high" ? 80 : filterBy === "medium" ? 60 : 0
      const maxScore = filterBy === "high" ? 100 : filterBy === "medium" ? 79 : 59
      filtered = filtered.filter(match => 
        match.overall_score >= minScore && match.overall_score <= maxScore
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "overall_score":
          return b.overall_score - a.overall_score
        case "experience_years":
          return b.candidate.experience_years - a.candidate.experience_years
        case "name":
          return a.candidate.name.localeCompare(b.candidate.name)
        case "created_at":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [candidates, searchTerm, sortBy, filterBy])

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50"
    if (score >= 60) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  // Get score badge variant
  const getScoreBadge = (score: number) => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "outline"
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading candidates...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <XCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Error loading candidates: {error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Candidate Pool</h2>
          <p className="text-gray-600">{filteredCandidates.length} candidates for {jobTitle}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1">
            {candidates.length} Total
          </Badge>
          <Badge variant="default" className="px-3 py-1">
            {candidates.filter(c => c.overall_score >= 80).length} High Match
          </Badge>
          <InviteCandidatesModal
            jobId={jobId}
            jobTitle={jobTitle}
            onCandidateAdded={(newCandidate) => {
              setCandidates(prev => [{
                id: `uploaded_${Date.now()}`,
                job_id: jobId,
                candidate_id: newCandidate.id,
                overall_score: newCandidate.match_score || 0,
                skills_score: 0,
                experience_score: 0,
                education_score: 0,
                languages_score: 0,
                certifications_score: 0,
                other_score: 0,
                strengths: [],
                gaps: [],
                recommendations: [],
                created_at: new Date().toISOString(),
                candidate: newCandidate,
              } as any, ...prev])
            }}
          />
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search candidates by name, email, skills, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter by score */}
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by match" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Candidates</SelectItem>
                <SelectItem value="high">High Match (80%+)</SelectItem>
                <SelectItem value="medium">Medium Match (60-79%)</SelectItem>
                <SelectItem value="low">Low Match (&lt;60%)</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SortDesc className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall_score">Match Score</SelectItem>
                <SelectItem value="experience_years">Experience</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="created_at">Recently Added</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Candidate List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCandidates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterBy !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Upload CVs to add candidates to this job."}
              </p>
              {!searchTerm && filterBy === "all" && (
                <InviteCandidatesModal
                  jobId={jobId}
                  jobTitle={jobTitle}
                  onCandidateAdded={(newCandidate) => {
                    setCandidates(prev => [{
                      id: `uploaded_${Date.now()}`,
                      job_id: jobId,
                      candidate_id: newCandidate.id,
                      overall_score: newCandidate.match_score || 0,
                      skills_score: 0,
                      experience_score: 0,
                      education_score: 0,
                      languages_score: 0,
                      certifications_score: 0,
                      other_score: 0,
                      strengths: [],
                      gaps: [],
                      recommendations: [],
                      created_at: new Date().toISOString(),
                      candidate: newCandidate,
                    } as any, ...prev])
                  }}
                />
              )}
            </CardContent>
          </Card>
        ) : (
          filteredCandidates.map((match) => (
            <Card key={match.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Left: Candidate Info */}
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      {/* Avatar */}
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {match.candidate.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {match.candidate.name}
                          </h3>
                          <Badge variant={getScoreBadge(match.overall_score)}>
                            {match.overall_score}% Match
                          </Badge>
                          {match.candidate.source && (
                            <Badge variant="outline" className="text-xs">
                              {match.candidate.source.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          {match.candidate.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="w-4 h-4" />
                              <span className="truncate">{match.candidate.email}</span>
                            </div>
                          )}
                          {match.candidate.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{match.candidate.location}</span>
                            </div>
                          )}
                          {match.candidate.experience_years > 0 && (
                            <div className="flex items-center space-x-1">
                              <Briefcase className="w-4 h-4" />
                              <span>{match.candidate.experience_years} years exp</span>
                            </div>
                          )}
                        </div>

                        {/* Skills */}
                        {match.candidate.skills && match.candidate.skills.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {(Array.isArray(match.candidate.skills) 
                                ? match.candidate.skills 
                                : (match.candidate.skills as string).split(',')
                              ).slice(0, 5).map((skill: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill.trim()}
                                </Badge>
                              ))}
                              {(Array.isArray(match.candidate.skills) 
                                ? match.candidate.skills.length 
                                : (match.candidate.skills as string).split(',').length
                              ) > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(Array.isArray(match.candidate.skills) 
                                    ? match.candidate.skills.length 
                                    : (match.candidate.skills as string).split(',').length
                                  ) - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Match Analysis */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Strengths */}
                          {match.strengths && match.strengths.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-green-700 mb-1 flex items-center">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Strengths
                              </h4>
                              <ul className="text-sm text-gray-600 space-y-0.5">
                                {match.strengths.slice(0, 3).map((strength, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-green-500 mr-1">•</span>
                                    {strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Recommendations */}
                          {match.recommendations && match.recommendations.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-blue-700 mb-1 flex items-center">
                                <Star className="w-3 h-3 mr-1" />
                                Recommendations
                              </h4>
                              <ul className="text-sm text-gray-600 space-y-0.5">
                                {match.recommendations.slice(0, 2).map((rec, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="text-blue-500 mr-1">•</span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score Breakdown & Actions */}
                  <div className="ml-6 flex-shrink-0 w-64">
                    {/* Overall Score */}
                    <div className="text-center mb-4">
                      <div className={`text-3xl font-bold ${getScoreColor(match.overall_score).split(' ')[0]}`}>
                        {match.overall_score}%
                      </div>
                      <div className="text-sm text-gray-500">Overall Match</div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">Skills</span>
                        <span className="font-medium">{match.skills_score}%</span>
                      </div>
                      <Progress value={match.skills_score} className="h-1" />
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">Experience</span>
                        <span className="font-medium">{match.experience_score}%</span>
                      </div>
                      <Progress value={match.experience_score} className="h-1" />
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">Education</span>
                        <span className="font-medium">{match.education_score}%</span>
                      </div>
                      <Progress value={match.education_score} className="h-1" />
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full"
                        onClick={() => setSelectedCandidate(match)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>
                      
                      <CandidateQuickActions 
                        candidate={match.candidate}
                        jobId={jobId}
                        onStatusUpdate={(status) => {
                          console.log(`Status updated to: ${status}`)
                          // Optionally refresh the candidate list or update local state
                        }}
                      />

                      {/* Links */}
                      {(match.candidate.linkedin_url || match.candidate.portfolio_url || match.candidate.github_url) && (
                        <div className="flex justify-center space-x-2 pt-2">
                          {match.candidate.linkedin_url && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="p-2"
                              onClick={() => window.open(match.candidate.linkedin_url, '_blank')}
                            >
                              <Link className="w-4 h-4" />
                            </Button>
                          )}
                          {match.candidate.portfolio_url && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="p-2"
                              onClick={() => window.open(match.candidate.portfolio_url, '_blank')}
                            >
                              <Globe className="w-4 h-4" />
                            </Button>
                          )}
                          {match.candidate.github_url && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="p-2"
                              onClick={() => window.open(match.candidate.github_url, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Candidate Detail Modal would go here */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedCandidate.candidate.name}</CardTitle>
                  <CardDescription>
                    {selectedCandidate.overall_score}% Match • {selectedCandidate.candidate.location}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedCandidate(null)}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      {selectedCandidate.candidate.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{selectedCandidate.candidate.email}</span>
                        </div>
                      )}
                      {selectedCandidate.candidate.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{selectedCandidate.candidate.phone}</span>
                        </div>
                      )}
                      {selectedCandidate.candidate.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{selectedCandidate.candidate.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Professional Links</h4>
                    <div className="space-y-2 text-sm">
                      {selectedCandidate.candidate.linkedin_url && (
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Link className="w-4 h-4 mr-2" />
                          LinkedIn Profile
                        </Button>
                      )}
                      {selectedCandidate.candidate.portfolio_url && (
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Globe className="w-4 h-4 mr-2" />
                          Portfolio
                        </Button>
                      )}
                      {selectedCandidate.candidate.github_url && (
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          GitHub
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Match Analysis */}
                <div>
                  <h4 className="font-semibold mb-4">Match Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-medium text-green-700 mb-2">Strengths</h5>
                      <ul className="space-y-1">
                        {selectedCandidate.strengths?.map((strength, index) => (
                          <li key={index} className="text-sm flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-orange-700 mb-2">Areas for Development</h5>
                      <ul className="space-y-1">
                        {selectedCandidate.gaps?.map((gap, index) => (
                          <li key={index} className="text-sm flex items-start">
                            <span className="text-orange-500 mr-2">•</span>
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                {selectedCandidate.candidate.skills && selectedCandidate.candidate.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(selectedCandidate.candidate.skills) 
                        ? selectedCandidate.candidate.skills 
                        : (selectedCandidate.candidate.skills as string).split(',')
                      ).map((skill: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {skill.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {selectedCandidate.candidate.summary && (
                  <div>
                    <h4 className="font-semibold mb-2">Professional Summary</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedCandidate.candidate.summary}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 pt-4 border-t">
                  <Button className="flex-1">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Shortlist Candidate
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Schedule Interview
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download CV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default CandidateList
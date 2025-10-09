"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

  // Filter candidates by search
  const filteredCandidates = candidates.filter(match => 
    !searchTerm || 
    match.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (match.candidate.skills || []).some((skill: string) => 
      skill.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
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
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search candidates by name, email, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
              <p className="text-gray-600">
                {searchTerm 
                  ? "Try adjusting your search criteria."
                  : "Upload some CVs to see candidates here."
                }
              </p>
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
                          <Badge variant="default">
                            {match.overall_score}% Match
                          </Badge>
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
                              <span>{match.candidate.experience_years} years</span>
                            </div>
                          )}
                        </div>

                        {/* Skills */}
                        {match.candidate.skills && match.candidate.skills.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {(Array.isArray(match.candidate.skills) 
                                ? match.candidate.skills 
                                : match.candidate.skills.split(',')
                              ).slice(0, 5).map((skill: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill.trim()}
                                </Badge>
                              ))}
                              {(Array.isArray(match.candidate.skills) 
                                ? match.candidate.skills.length 
                                : match.candidate.skills.split(',').length
                              ) > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(Array.isArray(match.candidate.skills) 
                                    ? match.candidate.skills.length 
                                    : match.candidate.skills.split(',').length
                                  ) - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Strengths */}
                        {match.strengths && match.strengths.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-green-700 mb-1 flex items-center">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Strengths
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-0.5">
                              {match.strengths.slice(0, 2).map((strength, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-green-500 mr-1">•</span>
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Score & Actions */}
                  <div className="ml-6 flex-shrink-0 w-48">
                    {/* Overall Score */}
                    <div className="text-center mb-4">
                      <div className={`text-3xl font-bold ${getScoreColor(match.overall_score)}`}>
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
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Shortlist
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-1">
                        {match.candidate.email && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.location.href = `mailto:${match.candidate.email}`}
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            Email
                          </Button>
                        )}
                        
                        {match.candidate.resume_url && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(match.candidate.resume_url, '_blank')}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            CV
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default CandidateList
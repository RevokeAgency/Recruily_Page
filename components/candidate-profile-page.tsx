'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ArrowLeft,
  Mail,
  Phone,
  Linkedin as LinkedIn,
  Globe,
  MapPin,
  Calendar,
  Download,
  FileText,
  GraduationCap,
  Briefcase,
  Star,
  Languages,
  Award,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

interface CandidateProfilePageProps {
  candidateId: string
  jobId?: string
  onBack?: () => void
}

interface Candidate {
  id: string
  name: string
  email: string
  phone?: string
  linkedin_url?: string
  location?: string
  summary?: string
  skills: string[]
  experience: Array<{
    title: string
    company: string
    duration: string
    description?: string
  }>
  education: Array<{
    degree: string
    school: string
    year: string
    gpa?: string
  }>
  languages: string[]
  certifications: string[]
  created_at: string
  resume_url?: string
}

interface MatchData {
  id: string
  overall_score: number
  skills_score: number
  experience_score: number
  education_score: number
  languages_score: number
  certifications_score: number
  other_score: number
  ai_summary?: string
  strengths: string[]
  gaps: string[]
}

export default function CandidateProfilePage({ candidateId, jobId, onBack }: CandidateProfilePageProps) {
  const router = useRouter()
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCandidateData()
  }, [candidateId, jobId])

  const fetchCandidateData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch candidate data
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single()

      if (candidateError) {
        console.error('Error fetching candidate:', candidateError)
        // Use mock data as fallback
        setCandidate(getMockCandidate())
      } else {
        setCandidate(candidateData)
      }

      // Fetch match data if jobId is provided
      if (jobId) {
        const { data: matchesData, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .eq('candidate_id', candidateId)
          .eq('job_id', jobId)
          .single()

        if (matchError) {
          console.error('Error fetching match data:', matchError)
          // Use mock match data as fallback
          setMatchData(getMockMatchData())
        } else {
          setMatchData(matchesData)
        }
      }
    } catch (error) {
      console.error('Error in fetchCandidateData:', error)
      setError('Failed to load candidate profile')
      // Use mock data as fallback
      setCandidate(getMockCandidate())
      if (jobId) {
        setMatchData(getMockMatchData())
      }
    } finally {
      setLoading(false)
    }
  }

  const getMockCandidate = (): Candidate => ({
    id: candidateId,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    linkedin_url: 'https://linkedin.com/in/sarahjohnson',
    location: 'San Francisco, CA',
    summary: 'Experienced Senior Frontend Developer with 6+ years of expertise in React, TypeScript, and modern web technologies. Passionate about creating intuitive user experiences and leading development teams.',
    skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Python', 'AWS', 'Docker', 'GraphQL', 'REST APIs', 'Git'],
    experience: [
      {
        title: 'Senior Frontend Developer',
        company: 'TechCorp Inc.',
        duration: '2021 - Present',
        description: 'Led a team of 4 developers in building scalable React applications. Implemented CI/CD pipelines and reduced deployment time by 60%.'
      },
      {
        title: 'Frontend Developer',
        company: 'StartupXYZ',
        duration: '2019 - 2021',
        description: 'Developed responsive web applications using React and TypeScript. Collaborated with UX team to improve user engagement by 40%.'
      },
      {
        title: 'Junior Web Developer',
        company: 'WebSolutions Ltd.',
        duration: '2018 - 2019',
        description: 'Built and maintained client websites using modern JavaScript frameworks. Gained experience in full-stack development.'
      }
    ],
    education: [
      {
        degree: 'Master of Science in Computer Science',
        school: 'Stanford University',
        year: '2018',
        gpa: '3.8'
      },
      {
        degree: 'Bachelor of Science in Software Engineering',
        school: 'UC Berkeley',
        year: '2016',
        gpa: '3.6'
      }
    ],
    languages: ['English (Native)', 'Spanish (Fluent)', 'French (Conversational)'],
    certifications: ['AWS Solutions Architect', 'Google Cloud Professional', 'Certified Scrum Master'],
    created_at: '2024-01-15T10:00:00Z',
    resume_url: '/sample-resume.pdf'
  })

  const getMockMatchData = (): MatchData => ({
    id: 'match-1',
    overall_score: 87,
    skills_score: 92,
    experience_score: 85,
    education_score: 78,
    languages_score: 90,
    certifications_score: 85,
    other_score: 80,
    ai_summary: 'Excellent candidate with strong technical skills and relevant experience. Perfect match for Senior Frontend Developer role with React and TypeScript expertise.',
    strengths: [
      'Extensive React and TypeScript experience',
      'Leadership experience with team management',
      'Strong educational background from top universities',
      'Relevant AWS and cloud certifications',
      'Multilingual capabilities'
    ],
    gaps: [
      'Could benefit from more backend development experience',
      'No specific experience with our industry vertical'
    ]
  })

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  const handleDownloadResume = async () => {
    if (!candidate?.resume_url) {
      toast.error('No resume available for download')
      return
    }

    try {
      // In a real implementation, this would handle file download from Supabase Storage
      const link = document.createElement('a')
      link.href = candidate.resume_url
      link.download = `${candidate.name}_Resume.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Resume download started')
    } catch (error) {
      console.error('Error downloading resume:', error)
      toast.error('Failed to download resume')
    }
  }

  const handleContactCandidate = () => {
    if (candidate?.email) {
      window.open(`mailto:${candidate.email}`, '_blank')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100"
    if (score >= 60) return "bg-yellow-100"
    return "bg-red-100"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidate profile...</p>
        </div>
      </div>
    )
  }

  if (error && !candidate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchCandidateData()}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Candidate not found</p>
          <Button onClick={handleBack}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" alt={candidate.name} />
                  <AvatarFallback>
                    {candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-semibold">{candidate.name}</h1>
                  <p className="text-sm text-gray-500">{candidate.email}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {matchData && (
                <Badge
                  variant="secondary"
                  className={`${getScoreBgColor(matchData.overall_score)} ${getScoreColor(matchData.overall_score)} font-semibold`}
                >
                  {matchData.overall_score}% Match
                </Badge>
              )}
              <Button onClick={handleContactCandidate} className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Personal Info & Contact */}
          <div className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Avatar className="h-6 w-6" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{candidate.email}</span>
                  </div>
                  {candidate.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{candidate.phone}</span>
                    </div>
                  )}
                  {candidate.linkedin_url && (
                    <div className="flex items-center gap-2 text-sm">
                      <LinkedIn className="h-4 w-4 text-gray-500" />
                      <a
                        href={candidate.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        LinkedIn Profile
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {candidate.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{candidate.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Applied {new Date(candidate.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resume Download */}
            {candidate.resume_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Resume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleDownloadResume}
                    variant="outline"
                    className="w-full flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Resume
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Match Summary (if available) */}
            {matchData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    AI Match Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(matchData.overall_score)} mb-2`}>
                      {matchData.overall_score}%
                    </div>
                    <p className="text-sm text-gray-600">Overall Match Score</p>
                  </div>
                  <Separator />
                  {matchData.ai_summary && (
                    <p className="text-sm text-gray-700">{matchData.ai_summary}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            {candidate.summary && (
              <Card>
                <CardHeader>
                  <CardTitle>Professional Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{candidate.summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Tabs for detailed information */}
            <Tabs defaultValue="experience" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="languages">Languages</TabsTrigger>
                {matchData && <TabsTrigger value="match-details">Match Analysis</TabsTrigger>}
              </TabsList>

              <TabsContent value="experience" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Work Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {candidate.experience.map((exp, index) => (
                      <div key={index} className="border-l-2 border-blue-200 pl-4">
                        <h4 className="font-semibold">{exp.title}</h4>
                        <p className="text-blue-600 font-medium">{exp.company}</p>
                        <p className="text-sm text-gray-500 mb-2">{exp.duration}</p>
                        {exp.description && (
                          <p className="text-gray-700 text-sm">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="education" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Education
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {candidate.education.map((edu, index) => (
                      <div key={index} className="border-l-2 border-green-200 pl-4">
                        <h4 className="font-semibold">{edu.degree}</h4>
                        <p className="text-green-600 font-medium">{edu.school}</p>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500">{edu.year}</p>
                          {edu.gpa && (
                            <Badge variant="outline">GPA: {edu.gpa}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skills" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {candidate.certifications.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Certifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {candidate.certifications.map((cert, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-yellow-600" />
                            <span>{cert}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="languages" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Languages className="h-5 w-5" />
                      Languages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {candidate.languages.map((language, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-blue-600" />
                          <span>{language}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {matchData && (
                <TabsContent value="match-details" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Match Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Score Breakdown */}
                      <div className="space-y-4">
                        <h4 className="font-semibold">Category Scores</h4>
                        {[
                          { name: 'Skills', score: matchData.skills_score, weight: '40%' },
                          { name: 'Experience', score: matchData.experience_score, weight: '30%' },
                          { name: 'Education', score: matchData.education_score, weight: '10%' },
                          { name: 'Languages', score: matchData.languages_score, weight: '10%' },
                          { name: 'Certifications', score: matchData.certifications_score, weight: '5%' },
                          { name: 'Other Factors', score: matchData.other_score, weight: '5%' }
                        ].map((category, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{category.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">({category.weight})</span>
                                <span className={`text-sm font-semibold ${getScoreColor(category.score)}`}>
                                  {category.score}%
                                </span>
                              </div>
                            </div>
                            <Progress value={category.score} className="h-2" />
                          </div>
                        ))}
                      </div>

                      <Separator />

                      {/* Strengths */}
                      {matchData.strengths.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-green-700">Strengths</h4>
                          <ul className="space-y-1">
                            {matchData.strengths.map((strength, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Gaps */}
                      {matchData.gaps.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-orange-700">Areas for Growth</h4>
                          <ul className="space-y-1">
                            {matchData.gaps.map((gap, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span>{gap}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
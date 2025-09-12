"use client"

import { useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useJobs } from "@/hooks/use-jobs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowLeft, 
  Upload, 
  Link, 
  User, 
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Award,
  Briefcase,
  GraduationCap,
  Globe
} from "lucide-react"
import { useDropzone } from 'react-dropzone'

interface CandidateFormData {
  name: string
  email: string
  phone: string
  location: string
  skills: string
  experience_years: string
  education: string
  degree: string
  university: string
  graduation_year: string
  summary: string
  linkedin_url: string
  portfolio_url: string
  github_url: string
  languages: string
  certifications: string
  salary_expectation_min: string
  salary_expectation_max: string
  visa_status: string
  availability: string
}

export default function InviteCandidatesPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { getJobById } = useJobs()
  
  const jobId = params.id as string
  const job = jobId ? getJobById(jobId) : null

  const [activeTab, setActiveTab] = useState("upload")
  const [isProcessing, setIsProcessing] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [processedCandidate, setProcessedCandidate] = useState<any>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Manual form data
  const [formData, setFormData] = useState<CandidateFormData>({
    name: "",
    email: "",
    phone: "",
    location: "",
    skills: "",
    experience_years: "0",
    education: "",
    degree: "",
    university: "",
    graduation_year: "",
    summary: "",
    linkedin_url: "",
    portfolio_url: "",
    github_url: "",
    languages: "English",
    certifications: "",
    salary_expectation_min: "",
    salary_expectation_max: "",
    visa_status: "",
    availability: "available"
  })

  const handleInputChange = (field: keyof CandidateFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // File upload handling
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    const file = acceptedFiles[0]
    
    if (!file) {
      toast({
        title: "Error",
        description: "No file selected",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    
    try {
      console.log("📄 Uploading CV file:", file.name)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('jobId', jobId)
      
      const response = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log("✅ CV processed successfully:", result.candidate)
        setProcessedCandidate(result.candidate)
        setShowConfirmation(true)
        toast({
          title: "CV Processed",
          description: "CV uploaded and processed successfully"
        })
      } else {
        throw new Error(result.error || "Failed to process CV")
      }
      
    } catch (error: any) {
      console.error("❌ CV upload error:", error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload CV",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }, [jobId, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  // URL scraping handling
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    
    try {
      console.log("🌐 Scraping candidate profile from:", urlInput)
      
      const response = await fetch('/api/scrape-candidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: urlInput,
          jobId: jobId
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log("✅ Profile scraped successfully:", result.candidate)
        setProcessedCandidate(result.candidate)
        setShowConfirmation(true)
        toast({
          title: "Profile Scraped",
          description: "Profile imported successfully"
        })
      } else {
        throw new Error(result.error || "Failed to scrape profile")
      }
      
    } catch (error: any) {
      console.error("❌ Profile scraping error:", error)
      toast({
        title: "Import Failed", 
        description: error.message || "Failed to import profile",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Manual form submission
  const handleManualSubmit = async () => {
    // Validate required fields
    if (!formData.name || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Name and email are required",
        variant: "destructive"
      })
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)

    try {
      console.log("📝 Creating candidate from manual entry")
      
      // Convert form data to candidate format
      const candidateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        location: formData.location || null,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        experience_years: parseInt(formData.experience_years) || 0,
        education: formData.education || null,
        degree: formData.degree || null,
        university: formData.university || null,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
        summary: formData.summary || null,
        linkedin_url: formData.linkedin_url || null,
        portfolio_url: formData.portfolio_url || null,
        github_url: formData.github_url || null,
        languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean),
        certifications: formData.certifications.split(',').map(c => c.trim()).filter(Boolean),
        salary_expectation_min: formData.salary_expectation_min ? parseInt(formData.salary_expectation_min) : null,
        salary_expectation_max: formData.salary_expectation_max ? parseInt(formData.salary_expectation_max) : null,
        visa_status: formData.visa_status || null,
        availability: formData.availability,
        status: 'active',
        source: 'manual_entry',
        tags: ['manual'],
        organisation_id: 'demo-org-123' // TODO: Get from user context
      }

      // Save candidate directly to database 
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(candidateData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log("✅ Manual candidate created:", result.candidates[0])
        setProcessedCandidate(result.candidates[0])
        setShowConfirmation(true)
        toast({
          title: "Candidate Added",
          description: "Candidate profile created successfully"
        })
      } else {
        throw new Error(result.error || "Failed to create candidate")
      }
      
    } catch (error: any) {
      console.error("❌ Manual candidate creation error:", error)
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create candidate profile",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Confirm and invite candidate
  const handleConfirmInvite = async () => {
    if (!processedCandidate) return

    setIsProcessing(true)

    try {
      console.log("🤝 Inviting candidate to job")
      
      const response = await fetch('/api/invite-candidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: jobId,
          candidateId: processedCandidate.id
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log("✅ Candidate invited successfully:", result.match)
        toast({
          title: "Candidate Invited",
          description: `Candidate invited with ${result.match.score}% match score`
        })
        
        // Redirect back to job workspace
        router.push(`/dashboard/jobs/${jobId}/workspace?tab=applications`)
      } else {
        throw new Error(result.error || "Failed to invite candidate")
      }
      
    } catch (error: any) {
      console.error("❌ Candidate invitation error:", error)
      toast({
        title: "Invitation Failed",
        description: error.message || "Failed to invite candidate",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Job Not Found</h2>
            <p className="text-gray-600 mt-2">The requested job could not be loaded.</p>
          </div>
          <Button onClick={() => router.push("/dashboard/jobs")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
      </div>
    )
  }

  if (showConfirmation && processedCandidate) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setShowConfirmation(false)
                setProcessedCandidate(null)
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Confirm Candidate Invitation</h1>
              <p className="text-gray-600">Review candidate profile before inviting to {job.title}</p>
            </div>
          </div>
        </div>

        {/* Candidate Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Candidate Profile
            </CardTitle>
            <CardDescription>
              Review and confirm the candidate details below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{processedCandidate.name}</p>
                    <p className="text-sm text-gray-600">Full Name</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{processedCandidate.email}</p>
                    <p className="text-sm text-gray-600">Email Address</p>
                  </div>
                </div>
                
                {processedCandidate.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{processedCandidate.phone}</p>
                      <p className="text-sm text-gray-600">Phone Number</p>
                    </div>
                  </div>
                )}
                
                {processedCandidate.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{processedCandidate.location}</p>
                      <p className="text-sm text-gray-600">Location</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {processedCandidate.experience_years > 0 && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{processedCandidate.experience_years} years</p>
                      <p className="text-sm text-gray-600">Experience</p>
                    </div>
                  </div>
                )}
                
                {processedCandidate.education && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{processedCandidate.education}</p>
                      <p className="text-sm text-gray-600">Education</p>
                    </div>
                  </div>
                )}
                
                {processedCandidate.languages && processedCandidate.languages.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{processedCandidate.languages.join(', ')}</p>
                      <p className="text-sm text-gray-600">Languages</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            {processedCandidate.skills && processedCandidate.skills.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {processedCandidate.skills.map((skill: string, index: number) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {processedCandidate.summary && (
              <div>
                <h4 className="font-medium mb-2">Professional Summary</h4>
                <p className="text-gray-700 leading-relaxed">{processedCandidate.summary}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <Button 
                variant="outline"
                onClick={() => {
                  setShowConfirmation(false)
                  setProcessedCandidate(null)
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmInvite}
                disabled={isProcessing}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inviting...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Candidate
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/dashboard/jobs/${jobId}/workspace`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workspace
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invite Candidates</h1>
            <p className="text-gray-600">Add candidates to {job.title} at {job.company}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Job Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-lg">{job.title}</h4>
                <p className="text-gray-600">{job.company}</p>
              </div>
              
              {job.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </div>
              )}
              
              {job.salary_range && (
                <div className="text-sm text-gray-600">
                  <strong>Salary:</strong> {job.salary_range}
                </div>
              )}
              
              {job.technical_skills && (
                <div>
                  <h5 className="font-medium text-sm mb-2">Required Skills:</h5>
                  <div className="flex flex-wrap gap-1">
                    {job.technical_skills.split(',').slice(0, 6).map((skill: string, index: number) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Candidate Input */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload CV
              </TabsTrigger>
              <TabsTrigger value="url">
                <Link className="w-4 h-4 mr-2" />
                Import URL
              </TabsTrigger>
              <TabsTrigger value="manual">
                <User className="w-4 h-4 mr-2" />
                Manual Entry
              </TabsTrigger>
            </TabsList>

            {/* Upload CV Tab */}
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Candidate CV</CardTitle>
                  <CardDescription>
                    Upload a PDF, DOCX, or TXT file to automatically extract candidate information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive 
                        ? 'border-teal-500 bg-teal-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    <input {...getInputProps()} />
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    {isProcessing ? (
                      <div className="space-y-2">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        <p className="text-gray-600">Processing CV...</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-lg font-medium">
                          {isDragActive ? 'Drop the CV here' : 'Drag & drop a CV file here'}
                        </p>
                        <p className="text-gray-500">or click to select a file</p>
                        <p className="text-sm text-gray-400">
                          Supports PDF, DOCX, and TXT files (max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Import URL Tab */}
            <TabsContent value="url">
              <Card>
                <CardHeader>
                  <CardTitle>Import from LinkedIn or Profile URL</CardTitle>
                  <CardDescription>
                    Import candidate information from LinkedIn profiles or other professional websites
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="profile-url">Profile URL</Label>
                    <Input
                      id="profile-url"
                      type="url"
                      placeholder="https://linkedin.com/in/username or other profile URL"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleUrlSubmit}
                    disabled={isProcessing || !urlInput.trim()}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing Profile...
                      </>
                    ) : (
                      <>
                        <Link className="mr-2 h-4 w-4" />
                        Import Profile
                      </>
                    )}
                  </Button>
                  
                  <div className="text-sm text-gray-500">
                    <p className="font-medium mb-2">Supported platforms:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>LinkedIn profiles</li>
                      <li>Personal websites and portfolios</li>
                      <li>GitHub profiles</li>
                      <li>Other professional profile pages</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Manual Entry Tab */}
            <TabsContent value="manual">
              <Card>
                <CardHeader>
                  <CardTitle>Manual Candidate Entry</CardTitle>
                  <CardDescription>
                    Manually enter candidate information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h4 className="font-medium mb-4">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="John Doe"
                          disabled={isProcessing}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="john.doe@example.com"
                          disabled={isProcessing}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          disabled={isProcessing}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => handleInputChange("location", e.target.value)}
                          placeholder="San Francisco, CA"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div>
                    <h4 className="font-medium mb-4">Professional Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="experience_years">Years of Experience</Label>
                        <Input
                          id="experience_years"
                          type="number"
                          min="0"
                          max="50"
                          value={formData.experience_years}
                          onChange={(e) => handleInputChange("experience_years", e.target.value)}
                          disabled={isProcessing}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="availability">Availability</Label>
                        <select
                          id="availability"
                          value={formData.availability}
                          onChange={(e) => handleInputChange("availability", e.target.value)}
                          disabled={isProcessing}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="available">Available</option>
                          <option value="2_weeks">2 weeks notice</option>
                          <option value="1_month">1 month notice</option>
                          <option value="not_available">Not available</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Label htmlFor="skills">Skills (comma-separated)</Label>
                      <Textarea
                        id="skills"
                        value={formData.skills}
                        onChange={(e) => handleInputChange("skills", e.target.value)}
                        placeholder="JavaScript, React, Node.js, Python"
                        rows={3}
                        disabled={isProcessing}
                      />
                    </div>
                    
                    <div className="mt-4">
                      <Label htmlFor="summary">Professional Summary</Label>
                      <Textarea
                        id="summary"
                        value={formData.summary}
                        onChange={(e) => handleInputChange("summary", e.target.value)}
                        placeholder="Brief professional summary..."
                        rows={4}
                        disabled={isProcessing}
                      />
                    </div>
                  </div>

                  {/* Education */}
                  <div>
                    <h4 className="font-medium mb-4">Education</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="degree">Degree</Label>
                        <Input
                          id="degree"
                          value={formData.degree}
                          onChange={(e) => handleInputChange("degree", e.target.value)}
                          placeholder="Bachelor of Science"
                          disabled={isProcessing}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="university">University/Institution</Label>
                        <Input
                          id="university"
                          value={formData.university}
                          onChange={(e) => handleInputChange("university", e.target.value)}
                          placeholder="Stanford University"
                          disabled={isProcessing}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="graduation_year">Graduation Year</Label>
                        <Input
                          id="graduation_year"
                          type="number"
                          min="1950"
                          max={new Date().getFullYear() + 10}
                          value={formData.graduation_year}
                          onChange={(e) => handleInputChange("graduation_year", e.target.value)}
                          placeholder="2020"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>
                  </div>

                  {/* URLs & Additional Info */}
                  <div>
                    <h4 className="font-medium mb-4">Links & Additional Information</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
                        <Input
                          id="linkedin_url"
                          type="url"
                          value={formData.linkedin_url}
                          onChange={(e) => handleInputChange("linkedin_url", e.target.value)}
                          placeholder="https://linkedin.com/in/username"
                          disabled={isProcessing}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="portfolio_url">Portfolio Website</Label>
                        <Input
                          id="portfolio_url"
                          type="url"
                          value={formData.portfolio_url}
                          onChange={(e) => handleInputChange("portfolio_url", e.target.value)}
                          placeholder="https://portfolio.com"
                          disabled={isProcessing}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="github_url">GitHub Profile</Label>
                        <Input
                          id="github_url"
                          type="url"
                          value={formData.github_url}
                          onChange={(e) => handleInputChange("github_url", e.target.value)}
                          placeholder="https://github.com/username"
                          disabled={isProcessing}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="languages">Languages (comma-separated)</Label>
                        <Input
                          id="languages"
                          value={formData.languages}
                          onChange={(e) => handleInputChange("languages", e.target.value)}
                          placeholder="English, Spanish, French"
                          disabled={isProcessing}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                        <Input
                          id="certifications"
                          value={formData.certifications}
                          onChange={(e) => handleInputChange("certifications", e.target.value)}
                          placeholder="AWS Certified, PMP, Scrum Master"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleManualSubmit}
                    disabled={isProcessing || !formData.name || !formData.email}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Profile...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Candidate Profile
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
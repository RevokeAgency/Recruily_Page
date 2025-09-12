"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Briefcase, MapPin, DollarSign, Clock, Building, Link, Upload, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useJobs } from "@/hooks/use-jobs"
import { scrapeJobFromUrl, type ScrapedJobData } from "@/lib/scraper"
import { parseJobDescriptionFile, type ParsedJobData } from "@/lib/file-parser"

export default function SimpleJobForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { createJob, loading } = useJobs()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    requirements: "",
    salary_min: "",
    salary_max: "",
    employment_type: "full-time",
    experience_level: "mid-level",
    remote_ok: false,
  })
  
  const [skills, setSkills] = useState<string[]>([])
  const [currentSkill, setCurrentSkill] = useState("")
  
  // New state for URL scraping and file upload
  const [jobUrl, setJobUrl] = useState("")
  const [isScrapingUrl, setIsScrapingUrl] = useState(false)
  const [isParsingFile, setIsParsingFile] = useState(false)
  const [sourceType, setSourceType] = useState<"manual" | "url_scraping" | "file_upload">("manual")
  const [sourceUrl, setSourceUrl] = useState<string>("")
  const [sourceFilename, setSourceFilename] = useState<string>("")

  // Helper functions for mapping extracted values to form values
  const mapEmploymentType = (type: string): string => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('full') || lowerType.includes('permanent')) return 'full-time'
    if (lowerType.includes('part')) return 'part-time'
    if (lowerType.includes('contract') || lowerType.includes('freelance')) return 'contract'
    if (lowerType.includes('intern')) return 'internship'
    return 'full-time' // default
  }

  const mapExperienceLevel = (level: string): string => {
    const lowerLevel = level.toLowerCase()
    if (lowerLevel.includes('senior') || lowerLevel.includes('sr') || lowerLevel.includes('lead')) return 'senior-level'
    if (lowerLevel.includes('junior') || lowerLevel.includes('jr') || lowerLevel.includes('entry')) return 'entry-level'
    if (lowerLevel.includes('mid') || lowerLevel.includes('intermediate')) return 'mid-level'
    if (lowerLevel.includes('executive') || lowerLevel.includes('director')) return 'executive'
    return 'mid-level' // default
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills(prev => [...prev, currentSkill.trim()])
      setCurrentSkill("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove))
  }

  // Auto-populate form fields from scraped or parsed data
  const populateFormFromData = (data: ScrapedJobData | ParsedJobData, source: "url" | "file", sourceIdentifier?: string) => {
    console.log("🔄 Populating form with data:", data)
    
    if (data.title) setFormData(prev => ({ ...prev, title: data.title! }))
    if (data.company) setFormData(prev => ({ ...prev, company: data.company! }))
    if (data.location) setFormData(prev => ({ ...prev, location: data.location! }))
    if (data.description) setFormData(prev => ({ ...prev, description: data.description! }))
    if (data.requirements) setFormData(prev => ({ ...prev, requirements: data.requirements! }))
    // Handle employment type with mapping
    if (data.employmentType) {
      const mappedEmploymentType = mapEmploymentType(data.employmentType)
      setFormData(prev => ({ ...prev, employment_type: mappedEmploymentType }))
    }
    
    // Handle experience level with mapping
    if (data.experienceLevel) {
      const mappedExperienceLevel = mapExperienceLevel(data.experienceLevel)
      setFormData(prev => ({ ...prev, experience_level: mappedExperienceLevel }))
    }
    
    // Handle salary
    if (data.salary) {
      // Try to parse salary range
      const salaryMatch = data.salary.match(/\$?(\d{1,3}(?:,\d{3})*)\s*(?:-|to)\s*\$?(\d{1,3}(?:,\d{3})*)/)
      if (salaryMatch) {
        setFormData(prev => ({ 
          ...prev, 
          salary_min: salaryMatch[1].replace(/,/g, ""),
          salary_max: salaryMatch[2].replace(/,/g, "")
        }))
      } else {
        // Single salary or couldn't parse range
        const singleSalaryMatch = data.salary.match(/\$?(\d{1,3}(?:,\d{3})*)/)
        if (singleSalaryMatch) {
          setFormData(prev => ({ 
            ...prev, 
            salary_min: singleSalaryMatch[1].replace(/,/g, "")
          }))
        }
      }
    }
    
    // Handle skills
    if (data.skills && data.skills.length > 0) {
      setSkills(prev => {
        const newSkills = data.skills!.filter(skill => !prev.includes(skill))
        return [...prev, ...newSkills]
      })
    }
    
    // Set source tracking
    if (source === "url") {
      setSourceType("url_scraping")
      setSourceUrl(sourceIdentifier || "")
    } else if (source === "file") {
      setSourceType("file_upload")
      setSourceFilename(sourceIdentifier || "")
    }

    toast({
      title: "Form auto-filled!",
      description: `Job details have been extracted and populated from ${source === "url" ? "URL" : "file"}.`,
      variant: "default",
    })
  }

  // Handle URL scraping
  const handleUrlScrape = async () => {
    if (!jobUrl.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a job posting URL to scrape.",
        variant: "destructive",
      })
      return
    }

    setIsScrapingUrl(true)
    try {
      const result = await scrapeJobFromUrl(jobUrl.trim())
      
      if (result.success && result.data) {
        populateFormFromData(result.data, "url", jobUrl.trim())
      } else {
        toast({
          title: "Scraping failed",
          description: result.error || "Could not extract job data from the URL. Please try a different URL or fill the form manually.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Scraping error",
        description: `Failed to scrape URL: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsScrapingUrl(false)
    }
  }

  // Handle file upload and parsing
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsParsingFile(true)
    try {
      const result = await parseJobDescriptionFile(file)
      
      if (result.success && result.data) {
        populateFormFromData(result.data, "file", file.name)
      } else {
        toast({
          title: "File parsing failed",
          description: result.error || "Could not extract job data from the file. Please try a different file or fill the form manually.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "File parsing error",
        description: `Failed to parse file: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsParsingFile(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Clear form data
  const clearForm = () => {
    setFormData({
      title: "",
      company: "",
      location: "",
      description: "",
      requirements: "",
      salary_min: "",
      salary_max: "",
      employment_type: "full-time",
      experience_level: "mid-level",
      remote_ok: false,
    })
    setSkills([])
    setJobUrl("")
    setSourceType("manual")
    setSourceUrl("")
    setSourceFilename("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.company || !formData.description) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, company, and description.",
        variant: "destructive",
      })
      return
    }

    try {
      const jobData = {
        ...formData,
        type: formData.employment_type, // Map employment_type to type
        technical_skills: skills.join(", "), // Convert skills array to string
        requirements: formData.requirements.split("\n").filter(r => r.trim()), // Convert to array
        salary_range: formData.salary_min && formData.salary_max 
          ? `$${formData.salary_min} - $${formData.salary_max}`
          : formData.salary_min 
            ? `$${formData.salary_min}+`
            : undefined,
        status: 'active' as const,
        source_type: sourceType,
        source_url: sourceUrl || undefined,
        source_filename: sourceFilename || undefined,
      }

      await createJob(jobData)
      
      toast({
        title: "Job created successfully!",
        description: `"${formData.title}" has been posted.`,
        variant: "default",
      })
      
      router.push("/dashboard/jobs")
    } catch (error) {
      console.error("Error creating job:", error)
      toast({
        title: "Error creating job",
        description: "Failed to create the job. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Job</h1>
        <p className="text-gray-600 mt-2">Fill in the details to post a new job opening</p>
      </div>

      {/* Input Methods Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Input Methods
          </CardTitle>
          <CardDescription>
            Speed up job creation by importing from a URL or file, or continue with manual entry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL Scraping Section */}
          <div className="space-y-2">
            <Label htmlFor="job-url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Import from Job URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="job-url"
                placeholder="Paste job posting URL (LinkedIn, Indeed, Glassdoor, etc.)"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                disabled={isScrapingUrl || isParsingFile}
              />
              <Button 
                type="button" 
                onClick={handleUrlScrape}
                disabled={isScrapingUrl || isParsingFile || !jobUrl.trim()}
                variant="outline"
                className="shrink-0"
              >
                {isScrapingUrl ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scraping...</>
                ) : (
                  <><Link className="h-4 w-4 mr-2" /> Import</>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Supports LinkedIn, Indeed, Glassdoor, and other job boards
            </p>
          </div>

          {/* File Upload Section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Job Description File
            </Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={handleFileUpload}
                disabled={isScrapingUrl || isParsingFile}
                className="file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
              {isParsingFile && (
                <div className="flex items-center px-3 py-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Parsing...
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Supports PDF, DOCX, and TXT files (max 10MB)
            </p>
          </div>

          {/* Manual Entry Note */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-800">
              You can also continue filling the form manually below or modify auto-filled fields as needed.
            </p>
          </div>

          {/* Clear Form Button */}
          {(sourceType !== "manual" || formData.title || formData.company || formData.description) && (
            <Button 
              type="button" 
              onClick={clearForm}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All Fields
            </Button>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Essential details about the position
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Senior Frontend Developer"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  placeholder="e.g. TechCorp Inc."
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. San Francisco, CA or Remote"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Remote Work</Label>
                <Select 
                  value={formData.remote_ok ? "yes" : "no"} 
                  onValueChange={(value) => handleInputChange("remote_ok", value === "yes")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Office Only</SelectItem>
                    <SelectItem value="yes">Remote Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select value={formData.employment_type} onValueChange={(value) => handleInputChange("employment_type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select value={formData.experience_level} onValueChange={(value) => handleInputChange("experience_level", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry-level">Entry Level</SelectItem>
                    <SelectItem value="mid-level">Mid Level</SelectItem>
                    <SelectItem value="senior-level">Senior Level</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary_min">Minimum Salary ($)</Label>
                <Input
                  id="salary_min"
                  type="number"
                  placeholder="e.g. 70000"
                  value={formData.salary_min}
                  onChange={(e) => handleInputChange("salary_min", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary_max">Maximum Salary ($)</Label>
                <Input
                  id="salary_max"
                  type="number"
                  placeholder="e.g. 120000"
                  value={formData.salary_max}
                  onChange={(e) => handleInputChange("salary_max", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Required Skills</CardTitle>
            <CardDescription>
              Add skills and technologies required for this position
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g. React, TypeScript, Node.js"
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              />
              <Button type="button" onClick={addSkill} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Description & Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                placeholder="List the required qualifications, experience, and skills..."
                value={formData.requirements}
                onChange={(e) => handleInputChange("requirements", e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push("/dashboard/jobs")}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-teal-600 hover:bg-teal-700"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Job"}
          </Button>
        </div>
      </form>
    </div>
  )
}
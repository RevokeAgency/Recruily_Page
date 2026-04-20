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
import { 
  Upload, 
  Link, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  X,
  Plus,
  Edit3
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useJobs } from "@/hooks/use-jobs"

// ─── Local types (replaced deleted lib/scraper + lib/file-parser) ─────────────
interface ScrapedJobData {
  title?: string
  company?: string
  location?: string
  description?: string
  requirements?: string
  salary?: string
  skills?: string[]
  employmentType?: string
  experienceLevel?: string
  applicationDeadline?: string
}
type ParsedJobData = ScrapedJobData

// ── Shared response mapper for /api/jobs/import ─────────────────────────────
function mapImportResponse(result: any): ScrapedJobData {
  const hardSkills: string[] = Array.isArray(result.hard_skills) ? result.hard_skills : []
  const softSkills: string[] = Array.isArray(result.soft_skills) ? result.soft_skills : []
  return {
    title: result.title || undefined,
    company: result.company || undefined,
    location: result.location || undefined,
    description: result.description || undefined,
    requirements: Array.isArray(result.requirements)
      ? result.requirements.join("\n")
      : (result.requirements || undefined),
    salary: result.salary_range || undefined,
    skills: [...hardSkills, ...softSkills],
    employmentType: result.employment_type || undefined,
    experienceLevel: result.experience_level || undefined,
  }
}

// ── Inline scraper: calls /api/jobs/import for Gemini-powered extraction ─────
async function scrapeJobFromUrl(url: string): Promise<{ success: boolean; data?: ScrapedJobData; error?: string; blocked?: boolean }> {
  try {
    const res = await fetch("/api/jobs/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
    const result = await res.json()
    if (result.blocked) return { success: false, blocked: true, error: result.error }
    if (!result.success) return { success: false, error: result.error }
    return { success: true, data: mapImportResponse(result) }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ── File parser: sends file to /api/jobs/import for server-side PDF/DOCX parsing ──
async function parseJobDescriptionFile(file: File): Promise<{ success: boolean; data?: ParsedJobData; error?: string }> {
  try {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/jobs/import", {
      method: "POST",
      body: formData,
    })
    const result = await res.json()
    if (!result.success) return { success: false, error: result.error || "Failed to parse file" }
    return { success: true, data: mapImportResponse(result) }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

type InputMethod = "upload" | "url" | "manual"
type WizardStep = "input" | "review" | "activate"

interface JobFormData {
  title: string
  company: string
  location: string
  description: string
  requirements: string
  responsibilities: string
  benefits: string
  salary_min: string
  salary_max: string
  employment_type: string
  experience_level: string
  remote_ok: boolean
  technical_skills: string
  application_deadline: string
  source_type: "manual" | "url_scraping" | "file_upload"
  source_url?: string
  source_filename?: string
  department?: string
}

export default function JobCreationWizard() {
  const router = useRouter()
  const { toast } = useToast()
  const { createJob, loading } = useJobs()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>("input")
  const [selectedMethod, setSelectedMethod] = useState<InputMethod | null>(null)
  
  // Loading states
  const [isProcessing, setIsProcessing] = useState(false)
  const [isScrapingUrl, setIsScrapingUrl] = useState(false)
  const [isParsingFile, setIsParsingFile] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    company: "",
    location: "",
    description: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
    salary_min: "",
    salary_max: "",
    employment_type: "full-time",
    experience_level: "mid-level",
    remote_ok: false,
    technical_skills: "",
    application_deadline: "",
    source_type: "manual",
  })
  
  // Input fields
  const [jobUrl, setJobUrl] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [currentSkill, setCurrentSkill] = useState("")

  // Step navigation
  const steps = [
    { id: "input", label: "Input", number: 1 },
    { id: "review", label: "Review", number: 2 },
    { id: "activate", label: "Activate", number: 3 },
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)

  // Helper functions
  const handleInputChange = (field: keyof JobFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

  const populateFormFromData = (data: ScrapedJobData | ParsedJobData, source: "url" | "file", sourceIdentifier?: string) => {
    console.log("🔄 Populating form with extracted data:", data)
    
    const updates: Partial<JobFormData> = {}
    
    // Clean and populate text fields
    if (data.title && data.title.trim()) {
      updates.title = data.title.trim()
      console.log("📝 Title extracted:", updates.title)
    }
    
    if (data.company && data.company.trim()) {
      updates.company = data.company.trim()
      console.log("🏢 Company extracted:", updates.company)
    }
    
    if (data.location && data.location.trim()) {
      updates.location = data.location.trim()
      console.log("📍 Location extracted:", updates.location)
    }
    
    if (data.description && data.description.trim()) {
      updates.description = data.description.trim()
      console.log("📄 Description extracted (length):", updates.description.length)
    }
    
    if (data.requirements && data.requirements.trim()) {
      updates.requirements = data.requirements.trim()
      console.log("📋 Requirements extracted (length):", updates.requirements.length)
    }
    

    
    if (data.applicationDeadline && data.applicationDeadline.trim()) {
      updates.application_deadline = data.applicationDeadline.trim()
      console.log("📅 Application deadline extracted:", updates.application_deadline)
    }
    
    // Map employment type with better fallback
    if (data.employmentType) {
      updates.employment_type = mapEmploymentType(data.employmentType)
      console.log("💼 Employment type mapped:", data.employmentType, "→", updates.employment_type)
    }
    
    // Map experience level with better fallback  
    if (data.experienceLevel) {
      updates.experience_level = mapExperienceLevel(data.experienceLevel)
      console.log("📊 Experience level mapped:", data.experienceLevel, "→", updates.experience_level)
    }
    
    // Enhanced salary parsing with exact extraction
    if (data.salary && data.salary.trim()) {
      console.log("💰 Processing salary data:", data.salary)
      
      // Clean salary string first
      const salaryStr = data.salary.trim()
      
      // Simple and effective salary patterns
      const patterns = [
        // Range patterns: $80,000 - $120,000, $80k - $120k, 80k-120k
        /\$?\s*(\d{1,3}(?:,?\d{3})*)\s*k?\s*(?:\s*-\s*|\s+to\s+)\s*\$?\s*(\d{1,3}(?:,?\d{3})*)\s*k?/i,
        // Single salary: $100,000, $100k, 100000, 100k
        /\$?\s*(\d{1,3}(?:,?\d{3})*)\s*k?(?:\s*(?:annually|per\s*year|\/year))?/i
      ]
      
      let salaryParsed = false
      
      for (const pattern of patterns) {
        const match = salaryStr.match(pattern)
        if (match) {
          console.log("💰 Salary pattern matched:", match[0])
          
          const convertSalary = (val: string) => {
            if (!val) return ''
            
            // Remove commas and dollar signs
            let num = val.replace(/[,$\s]/g, '')
            
            // Handle k notation (convert to thousands)
            if (salaryStr.toLowerCase().includes('k')) {
              const baseNum = parseFloat(num)
              if (!isNaN(baseNum) && baseNum < 1000) {
                return (baseNum * 1000).toString()
              }
            }
            
            // Return as-is if it's already a full number
            return num
          }
          
          if (match[2]) { 
            // Range found (two values)
            updates.salary_min = convertSalary(match[1])
            updates.salary_max = convertSalary(match[2])
            console.log("💰 Salary range parsed:", updates.salary_min, "-", updates.salary_max)
          } else if (match[1]) { 
            // Single salary found
            updates.salary_min = convertSalary(match[1])
            console.log("💰 Single salary extracted:", updates.salary_min)
          }
          salaryParsed = true
          break
        }
      }
      
      if (!salaryParsed) {
        console.log("⚠️ Could not parse salary:", data.salary)
      }
    }
    
    // Set source tracking
    if (source === "url") {
      updates.source_type = "url_scraping"
      updates.source_url = sourceIdentifier
    } else if (source === "file") {
      updates.source_type = "file_upload"
      updates.source_filename = sourceIdentifier
    }
    
    // Update form data
    setFormData(prev => ({ 
      ...prev, 
      ...updates,
      technical_skills: data.skills ? data.skills.join(', ') : prev.technical_skills
    }))
    
    // Handle skills separately to update both form data and skills array
    if (data.skills && data.skills.length > 0) {
      console.log("🏷️ Skills extracted:", data.skills)
      setSkills(prev => {
        // Clear existing skills and set new ones from extracted data
        const cleanedSkills = data.skills!
          .filter(skill => skill && skill.trim())
          .map(skill => skill.trim())
        return [...cleanedSkills]
      })
    }

    console.log("✅ Form population complete for", source, "extraction")
  }

  const mapEmploymentType = (type: string): string => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('full') || lowerType.includes('permanent')) return 'full-time'
    if (lowerType.includes('part')) return 'part-time'
    if (lowerType.includes('contract') || lowerType.includes('freelance')) return 'contract'
    if (lowerType.includes('intern')) return 'internship'
    return 'full-time'
  }

  const mapExperienceLevel = (level: string): string => {
    const lowerLevel = level.toLowerCase()
    if (lowerLevel.includes('senior') || lowerLevel.includes('sr') || lowerLevel.includes('lead')) return 'senior-level'
    if (lowerLevel.includes('junior') || lowerLevel.includes('jr') || lowerLevel.includes('entry')) return 'entry-level'
    if (lowerLevel.includes('mid') || lowerLevel.includes('intermediate')) return 'mid-level'
    if (lowerLevel.includes('executive') || lowerLevel.includes('director')) return 'executive'
    return 'mid-level'
  }

  // Handle URL scraping
  const handleUrlScrape = async () => {
    if (!jobUrl.trim()) {
      toast({ title: "URL required", description: "Please enter a job posting URL.", variant: "destructive" })
      return
    }

    setIsScrapingUrl(true)
    try {
      let validUrl = jobUrl.trim()
      if (!validUrl.startsWith("http")) validUrl = "https://" + validUrl

      const result = await scrapeJobFromUrl(validUrl)

      if (result.blocked) {
        toast({
          title: "Seite nicht lesbar",
          description: "Diese Seite blockiert automatisches Lesen. Bitte kopiere den Stellentext manuell und wähle 'Manual'.",
          variant: "destructive",
        })
        setSelectedMethod("manual")
        return
      }

      if (result.success && result.data) {
        populateFormFromData(result.data, "url", validUrl)
        // Defer step change to avoid Radix portal removeChild crash
        setTimeout(() => {
          setCurrentStep("review")
          toast({ title: "Import erfolgreich!", description: "Überprüfe die extrahierten Jobdaten.", variant: "default" })
        }, 50)
      } else {
        toast({ title: "Import fehlgeschlagen", description: result.error || "URL konnte nicht verarbeitet werden.", variant: "destructive" })
      }
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" })
    } finally {
      setIsScrapingUrl(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsParsingFile(true)
    try {
      const result = await parseJobDescriptionFile(file)

      if (result.success && result.data) {
        populateFormFromData(result.data, "file", file.name)
        // Defer step change to avoid Radix portal removeChild crash
        setTimeout(() => {
          setCurrentStep("review")
          toast({ title: "Datei erfolgreich analysiert!", description: "Überprüfe die extrahierten Jobdaten.", variant: "default" })
        }, 50)
      } else {
        toast({ title: "Parsing fehlgeschlagen", description: result.error || "Datei konnte nicht verarbeitet werden.", variant: "destructive" })
      }
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" })
    } finally {
      setIsParsingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Navigation functions
  const handleNext = async () => {
    if (currentStep === "input" && selectedMethod) {
      setCurrentStep("review")
    } else if (currentStep === "review") {
      setCurrentStep("activate")
    }
  }

  const handleBack = () => {
    if (currentStep === "review") {
      setCurrentStep("input")
    } else if (currentStep === "activate") {
      setCurrentStep("review")
    }
  }

  const handleCancel = () => {
    router.push("/dashboard/jobs")
  }

  // Final submission
  const handleSubmit = async () => {
    if (!formData.title || !formData.company || !formData.description) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, company, and description.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const requirementsList = formData.requirements
        .split(/\n|\\n/)
        .map(r => r.trim())
        .filter(Boolean)

      const jobPayload = {
        ...formData,
        type: formData.employment_type,
        technical_skills: skills.join(", "),
        requirements: requirementsList,
        salary_range: formData.salary_min && formData.salary_max
          ? `${formData.salary_min} - ${formData.salary_max}`
          : formData.salary_min
            ? `${formData.salary_min}+`
            : undefined,
      }

      await createJob(jobPayload as any)

      toast({
        title: "Job erfolgreich erstellt!",
        description: `"${formData.title}" wurde hinzugefügt.`,
        variant: "default",
      })

      router.push("/dashboard/jobs")
    } catch (error: any) {
      console.error("Error creating job:", error)
      toast({
        title: "Fehler beim Erstellen",
        description: error.message || "Job konnte nicht erstellt werden.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
            ${currentStepIndex >= index ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'}
          `}>
            {currentStepIndex > index ? <CheckCircle2 className="w-5 h-5" /> : step.number}
          </div>
          {index < steps.length - 1 && (
            <div className={`w-16 h-0.5 mx-4 ${currentStepIndex > index ? 'bg-teal-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStepLabels = () => (
    <div className="flex justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className={`text-sm px-8 ${index === currentStepIndex ? 'font-semibold text-teal-600' : 'text-gray-500'}`}>
          {step.label}
        </div>
      ))}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Create New Job</h1>
        <p className="text-gray-600 text-center">
          {currentStep === "input" && "Choose how you want to provide job details"}
          {currentStep === "review" && "Review and edit your job details"}
          {currentStep === "activate" && "Confirm and activate your job posting"}
        </p>
      </div>

      {renderStepIndicator()}
      {renderStepLabels()}

      {/* Step 1: Input Method Selection */}
      {currentStep === "input" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Upload Option */}
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedMethod === "upload" ? "ring-2 ring-teal-500 bg-teal-50" : "hover:bg-gray-50"
              }`}
              onClick={() => setSelectedMethod("upload")}
            >
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Upload</CardTitle>
              </CardHeader>
            </Card>

            {/* URL Option */}
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedMethod === "url" ? "ring-2 ring-teal-500 bg-teal-50" : "hover:bg-gray-50"
              }`}
              onClick={() => setSelectedMethod("url")}
            >
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-lg flex items-center justify-center">
                  <Link className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">URL</CardTitle>
              </CardHeader>
            </Card>

            {/* Manual Option */}
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedMethod === "manual" ? "ring-2 ring-teal-500 bg-teal-50" : "hover:bg-gray-50"
              }`}
              onClick={() => setSelectedMethod("manual")}
            >
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Manual</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Input Method Content */}
          {selectedMethod === "upload" && (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-teal-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Drag & drop job description file here, or click to select
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports PDF, DOC, DOCX, and TXT formats up to 10 MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {isParsingFile && (
                      <div className="mt-4 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        <span className="text-sm text-gray-600">Parsing file...</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedMethod === "url" && (
            <Card>
              <CardContent className="p-8">
                <div className="space-y-4">
                  <Label htmlFor="job-url" className="text-lg font-medium">Job Posting URL</Label>
                  <div className="flex gap-3">
                    <Input
                      id="job-url"
                      placeholder="https://example.com/job-posting-url"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      className="flex-1"
                      disabled={isScrapingUrl}
                    />
                    <Button 
                      onClick={handleUrlScrape}
                      disabled={isScrapingUrl || !jobUrl.trim()}
                      className="bg-teal-600 hover:bg-teal-700 px-6"
                    >
                      {isScrapingUrl ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scraping...</>
                      ) : (
                        "Scrape URL"
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Enter any job posting URL (LinkedIn, Indeed, Glassdoor, company websites, etc.)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedMethod === "manual" && (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Manual Entry Selected
                  </p>
                  <p className="text-sm text-gray-500">
                    You'll be able to fill in all job details manually in the next step.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!selectedMethod || isScrapingUrl || isParsingFile}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Review Job Details */}
      {currentStep === "review" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Review Job Details</CardTitle>
              <CardDescription>
                Review and edit the job information below before publishing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="review-title">Job Title *</Label>
                  <div className="relative">
                    <Input
                      id="review-title"
                      placeholder="e.g. Senior Frontend Developer"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className="pr-10"
                    />
                    <Edit3 className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-company">Company *</Label>
                  <div className="relative">
                    <Input
                      id="review-company"
                      placeholder="e.g. TechCorp Inc."
                      value={formData.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      className="pr-10"
                    />
                    <Edit3 className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-location">Location</Label>
                  <div className="relative">
                    <Input
                      id="review-location"
                      placeholder="e.g. San Francisco, CA or Remote"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className="pr-10"
                    />
                    <Edit3 className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Job Type</Label>
                  <Select 
                    value={formData.employment_type} 
                    onValueChange={(value) => handleInputChange("employment_type", value)}
                  >
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
                  <Label htmlFor="review-salary-min">Salary Range</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="review-salary-min"
                      type="number"
                      placeholder="Min"
                      value={formData.salary_min}
                      onChange={(e) => handleInputChange("salary_min", e.target.value)}
                    />
                    <span className="text-gray-500">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={formData.salary_max}
                      onChange={(e) => handleInputChange("salary_max", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-deadline">Application Deadline</Label>
                  <Input
                    id="review-deadline"
                    type="date"
                    value={formData.application_deadline}
                    onChange={(e) => handleInputChange("application_deadline", e.target.value)}
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="review-department">Department</Label>
                <Input
                  id="review-department"
                  placeholder="e.g., Engineering, Marketing, Sales..."
                  value={formData.department}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                />
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <Label htmlFor="review-description">Job Description *</Label>
                <div className="relative">
                  <Textarea
                    id="review-description"
                    placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={12}
                    className="pr-10 whitespace-pre-wrap leading-relaxed resize-y min-h-[200px]"
                    style={{lineHeight: '1.6'}}
                  />
                  <Edit3 className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <Label htmlFor="review-requirements">Requirements</Label>
                <div className="relative">
                  <Textarea
                    id="review-requirements"
                    placeholder="List the required qualifications, experience, and skills..."
                    value={formData.requirements}
                    onChange={(e) => handleInputChange("requirements", e.target.value)}
                    rows={10}
                    className="pr-10 whitespace-pre-wrap leading-relaxed resize-y min-h-[160px]"
                    style={{lineHeight: '1.6'}}
                  />
                  <Edit3 className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>



              {/* Skills */}
              <div className="space-y-2">
                <Label>Skills</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add skills (e.g. React, TypeScript, Node.js)"
                      value={currentSkill}
                      onChange={(e) => setCurrentSkill(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      className="flex-1"
                    />
                    <Button type="button" onClick={addSkill} variant="outline" size="sm">
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
                </div>
              </div>


            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handleNext}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Activate Job Posting */}
      {currentStep === "activate" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Ready to Publish!</CardTitle>
              <CardDescription className="text-lg">
                Your job posting is ready to be added to your recruitment pipeline. Review the summary below and confirm to proceed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Job Summary */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{formData.title || "Job Title"}</h3>
                    <p className="text-gray-600">{formData.company || "Company Name"}</p>
                    <p className="text-sm text-gray-500">{formData.location || "Location"}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <Badge variant="outline" className="capitalize">
                        {formData.employment_type.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Source:</span>
                      <Badge variant="secondary" className="capitalize">
                        {formData.source_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    {(formData.salary_min || formData.salary_max) && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Salary:</span>
                        <span className="text-sm font-medium">
                          {formData.salary_min && formData.salary_max 
                            ? `$${formData.salary_min} - $${formData.salary_max}`
                            : formData.salary_min 
                              ? `$${formData.salary_min}+`
                              : "Not specified"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {skills.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600 mb-2 block">Required Skills:</span>
                    <div className="flex flex-wrap gap-2">
                      {skills.slice(0, 6).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {skills.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{skills.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Recruiter Notes */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Ready to Add to Your Job Pipeline</h4>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-teal-900">Job Ready for Your Pipeline</p>
                      <p className="text-sm text-teal-700 mt-1">
                        This job posting will be added to your recruitment dashboard where you can manage applications, track candidates, and coordinate with your team.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <Button 
                  onClick={handleSubmit}
                  disabled={isProcessing || loading}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-lg py-6"
                >
                  {(isProcessing || loading) ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Job...</>
                  ) : (
                    <><CheckCircle2 className="w-5 h-5 mr-2" /> Add to Pipeline</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Review
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Save as Draft
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
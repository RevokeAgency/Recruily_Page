"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { FileText, Check, ArrowRight, Loader2, X, Upload, Globe, FormInput } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/hooks/use-auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface JobData {
  title: string
  company?: string
  location: string
  description: string
  requirements: string[]
  skills: string[]
  jobType: string
  salaryRange: string
  benefits?: string[]
  applicationDeadline?: string
}

export function JobDescriptionUploader() {
  const { language } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [jobUrl, setJobUrl] = useState("")
  const [jobText, setJobText] = useState("")
  const [activeTab, setActiveTab] = useState("upload")
  const [jobData, setJobData] = useState<JobData>({
    title: "",
    company: "",
    location: "",
    description: "",
    requirements: [],
    skills: [],
    jobType: "full-time",
    salaryRange: "",
    benefits: [],
    applicationDeadline: "",
  })

  // Helper function to get user organization ID
  const getUserOrgId = (): string => {
    // Try to get from localStorage first
    const storedUser = localStorage.getItem("recruitify_user")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        if (user.email) {
          return user.email.replace("@", "_").replace(".", "_")
        }
      } catch (e) {
        console.error("Error parsing stored user:", e)
      }
    }

    // Try to get from auth context
    if (user && user.email) {
      return user.email.replace("@", "_").replace(".", "_")
    }

    return "demo-org-123"
  }

  // Handle file selection
  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    setIsProcessingFile(true)

    try {
      // Read the first file
      const file = e.target.files[0]
      const text = await file.text()

      // Set the job text
      setJobText(text)

      toast({
        title: language === "EN" ? "File uploaded successfully" : "Datei erfolgreich hochgeladen",
        description:
          language === "EN"
            ? "Job description has been extracted from the file."
            : "Stellenbeschreibung wurde aus der Datei extrahiert.",
        variant: "default",
      })

      // Parse the job text automatically
      await handleParseJobText(text)
    } catch (error) {
      console.error("Error processing file:", error)

      toast({
        title: language === "EN" ? "Error processing file" : "Fehler bei der Verarbeitung der Datei",
        description:
          language === "EN"
            ? "Failed to extract job description from the file."
            : "Fehler beim Extrahieren der Stellenbeschreibung aus der Datei.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingFile(false)
    }
  }

  // Handle URL scraping - FIXED VERSION
  const handleScrapeUrl = async () => {
    if (!jobUrl) return

    setIsLoading(true)

    try {
      console.log("🌐 Starting URL scraping for:", jobUrl)

      // Validate URL format
      let validUrl = jobUrl
      if (!jobUrl.startsWith("http://") && !jobUrl.startsWith("https://")) {
        validUrl = "https://" + jobUrl
      }

      // Test if URL is reachable
      try {
        new URL(validUrl)
      } catch (urlError) {
        throw new Error("Invalid URL format. Please enter a valid URL.")
      }

      // Call the enhanced scraping API
      const response = await fetch("/api/scrape-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: validUrl }),
      })

      console.log("📡 API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ Enhanced scraping successful:", data.success)

      if (!data.success) {
        throw new Error(data.error || "Failed to scrape URL")
      }

      // Update job text with scraped content
      setJobText(data.content || "")

      toast({
        title: language === "EN" ? "URL scraped successfully" : "URL erfolgreich gescrapt",
        description:
          language === "EN"
            ? `Job data extracted from ${data.siteType} site with enhanced parsing.`
            : `Jobdaten von ${data.siteType}-Seite mit verbessertem Parsing extrahiert.`,
        variant: "default",
      })

      // Parse the scraped content with enhanced structured data
      console.log("📝 Parsing scraped content with structured data")
      await handleParseJobText(data.content, data.structuredData)
    } catch (error) {
      console.error("❌ Error scraping URL:", error)

      toast({
        title: language === "EN" ? "Error scraping URL" : "Fehler beim Scrapen der URL",
        description:
          language === "EN"
            ? error instanceof Error
              ? error.message
              : "Failed to extract job description from the URL. Please check the URL and try again."
            : "Fehler beim Extrahieren der Stellenbeschreibung aus der URL. Bitte überprüfen Sie die URL und versuchen Sie es erneut.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle job text parsing - ENHANCED VERSION
  const handleParseJobText = async (textToProcess?: string, structuredData?: any) => {
    const textContent = textToProcess || jobText
    if (!textContent) {
      console.error("No text content to process")
      toast({
        title: language === "EN" ? "No content to parse" : "Kein Inhalt zum Parsen",
        description:
          language === "EN"
            ? "Please provide job description text to parse."
            : "Bitte geben Sie Stellenbeschreibungstext zum Parsen an.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log("🔍 Enhanced parsing job text with length:", textContent.length)
      if (structuredData) {
        console.log("📊 Using structured data for enhanced parsing:", structuredData)
      }

      // Call the enhanced job parsing API
      const response = await fetch("/api/parse-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          text: textContent,
          structuredData: structuredData 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || "Failed to parse job description")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to parse job description")
      }

      console.log("✅ Job parsing successful")

      // Update job data with parsed content
      setJobData({
        title: data.title || "",
        company: data.company || "",
        location: data.location || "",
        description: data.description || "",
        requirements: Array.isArray(data.requirements) ? data.requirements : [],
        skills: Array.isArray(data.skills) ? data.skills : [],
        jobType: data.jobType || "full-time",
        salaryRange: data.salaryRange || "",
        benefits: Array.isArray(data.benefits) ? data.benefits : [],
        applicationDeadline: data.applicationDeadline || "",
      })

      toast({
        title: language === "EN" ? "Job description parsed successfully" : "Stellenbeschreibung erfolgreich analysiert",
        description:
          language === "EN"
            ? `Job information extracted using ${data.method} method with enhanced accuracy.`
            : `Jobinformationen mit ${data.method}-Methode und verbesserter Genauigkeit extrahiert.`,
        variant: "default",
      })

      // Move to next step
      setStep(2)
    } catch (error) {
      console.error("❌ Error parsing job text:", error)

      toast({
        title: language === "EN" ? "Error parsing job description" : "Fehler beim Parsen der Stellenbeschreibung",
        description:
          language === "EN"
            ? error instanceof Error
              ? error.message
              : "Failed to extract information from the job description."
            : "Fehler beim Extrahieren von Informationen aus der Stellenbeschreibung.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle job creation with comprehensive error handling
  const handleCreateJob = async () => {
    console.log("=== STARTING JOB CREATION ===")
    console.log("Current job data:", jobData)

    if (!jobData.title || !jobData.description) {
      console.error("Missing required fields:", { title: !!jobData.title, description: !!jobData.description })
      toast({
        title: language === "EN" ? "Missing required fields" : "Erforderliche Felder fehlen",
        description:
          language === "EN"
            ? "Please fill in the job title and description."
            : "Bitte füllen Sie den Jobtitel und die Beschreibung aus.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const userOrgId = getUserOrgId()
      console.log("Using organization ID:", userOrgId)

      // Prepare job data for API with proper data types
      const jobPayload = {
        title: String(jobData.title).trim(),
        description: String(jobData.description).trim(),
        requirements: Array.isArray(jobData.requirements)
          ? jobData.requirements.join("\n")
          : String(jobData.requirements || ""),
        location: String(jobData.location || ""),
        jobType: String(jobData.jobType || "full-time"),
        salaryRange: String(jobData.salaryRange || ""),
        organisationId: userOrgId, // Use user-specific org ID
        skills: Array.isArray(jobData.skills) ? jobData.skills.join(", ") : String(jobData.skills || ""),
        benefits: Array.isArray(jobData.benefits)
          ? (jobData.benefits || []).join(", ")
          : String(jobData.benefits || ""),
        company: String(jobData.company || ""),
        applicationDeadline: jobData.applicationDeadline || null,
      }

      console.log("Sending job payload:", jobPayload)

      // Create job via API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobPayload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log("API response status:", response.status)

      // Handle response
      let result
      const responseText = await response.text()
      console.log("Raw response:", responseText)

      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError)
        throw new Error(`Invalid response from server: ${responseText.substring(0, 100)}...`)
      }

      console.log("Parsed API response data:", result)

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`)
      }

      // Show success message
      toast({
        title: language === "EN" ? "Job created successfully!" : "Job erfolgreich erstellt!",
        description:
          language === "EN"
            ? "Your job has been created and you'll be redirected to the workspace."
            : "Ihr Job wurde erstellt und Sie werden zum Arbeitsbereich weitergeleitet.",
        variant: "default",
      })

      console.log("Job creation successful, redirecting to workspace...")

      // Get the job ID from the response
      const jobId = result.job?.id || result.id

      if (jobId) {
        // Wait a moment for the user to see the success message, then redirect to the job workspace
        setTimeout(() => {
          router.push(`/dashboard/jobs/${jobId}/workspace`)
        }, 1500)
      } else {
        // Fallback to jobs page if no ID is returned
        setTimeout(() => {
          router.push("/dashboard/jobs")
        }, 1500)
      }
    } catch (error) {
      console.error("=== JOB CREATION ERROR ===")
      console.error("Error creating job:", error)

      let errorMessage = "Failed to create the job. Please try again."

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "Request timed out. Please try again."
        } else {
          errorMessage = error.message
        }
      }

      toast({
        title: language === "EN" ? "Error creating job" : "Fehler beim Erstellen des Jobs",
        description:
          language === "EN" ? errorMessage : "Fehler beim Erstellen des Jobs. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle skill removal
  const handleRemoveSkill = (index: number) => {
    setJobData({
      ...jobData,
      skills: jobData.skills.filter((_, i) => i !== index),
    })
  }

  // Handle requirement removal
  const handleRemoveRequirement = (index: number) => {
    setJobData({
      ...jobData,
      requirements: jobData.requirements.filter((_, i) => i !== index),
    })
  }

  // Handle benefit removal
  const handleRemoveBenefit = (index: number) => {
    setJobData({
      ...jobData,
      benefits: (jobData.benefits || []).filter((_, i) => i !== index),
    })
  }

  // Handle adding a new skill
  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value) {
      e.preventDefault()
      setJobData({
        ...jobData,
        skills: [...jobData.skills, e.currentTarget.value],
      })
      e.currentTarget.value = ""
    }
  }

  // Handle adding a new requirement
  const handleAddRequirement = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value) {
      e.preventDefault()
      setJobData({
        ...jobData,
        requirements: [...jobData.requirements, e.currentTarget.value],
      })
      e.currentTarget.value = ""
    }
  }

  // Handle adding a new benefit
  const handleAddBenefit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value) {
      e.preventDefault()
      setJobData({
        ...jobData,
        benefits: [...(jobData.benefits || []), e.currentTarget.value],
      })
      e.currentTarget.value = ""
    }
  }

  // Handle manual form submission
  const handleManualFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const title = formData.get("title") as string
    const location = formData.get("location") as string
    const description = formData.get("description") as string
    const jobType = formData.get("jobType") as string
    const salaryRange = formData.get("salaryRange") as string

    // Update job data
    setJobData({
      ...jobData,
      title,
      location,
      description,
      jobType,
      salaryRange,
    })

    // Move to next step
    setStep(2)
  }

  return (
    <div className="w-full max-w-3xl">
      {/* Stepper */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              step >= 1 ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            {step > 1 ? <Check className="h-4 w-4" /> : "1"}
          </div>
          <div className={`h-1 w-16 ${step > 1 ? "bg-teal-600" : "bg-gray-200"}`}></div>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              step >= 2 ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            {step > 2 ? <Check className="h-4 w-4" /> : "2"}
          </div>
          <div className={`h-1 w-16 ${step > 2 ? "bg-teal-600" : "bg-gray-200"}`}></div>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              step >= 3 ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            3
          </div>
        </div>
      </div>

      {/* Step labels */}
      <div className="flex items-center justify-center text-sm mb-8">
        <div className="flex items-center justify-between w-[240px]">
          <span className={step >= 1 ? "font-medium" : "text-muted-foreground"}>
            {language === "EN" ? "Input" : "Eingabe"}
          </span>
          <span className={step >= 2 ? "font-medium" : "text-muted-foreground"}>
            {language === "EN" ? "Review" : "Überprüfen"}
          </span>
          <span className={step >= 3 ? "font-medium" : "text-muted-foreground"}>
            {language === "EN" ? "Activate" : "Aktivieren"}
          </span>
        </div>
      </div>

      {/* Step 1: Upload/Input */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{language === "EN" ? "Create New Job" : "Neuen Job erstellen"}</CardTitle>
            <CardDescription>
              {language === "EN"
                ? "Upload a job description, provide a URL, or manually enter job details."
                : "Laden Sie eine Stellenbeschreibung hoch, geben Sie eine URL an oder geben Sie die Jobdetails manuell ein."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {language === "EN" ? "Upload" : "Hochladen"}
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {language === "EN" ? "URL" : "URL"}
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <FormInput className="h-4 w-4" />
                  {language === "EN" ? "Manual" : "Manuell"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4 mt-4">
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={handleFileSelect}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    disabled={isLoading || isProcessingFile}
                  />
                  <FileText className="h-12 w-12 mx-auto mb-4 text-teal-600" />
                  <p className="text-sm font-medium mb-2">
                    {language === "EN"
                      ? "Drag & drop job description file here, or click to select"
                      : "Stellenbeschreibungsdatei hier ablegen oder klicken, um auszuwählen"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "EN"
                      ? "PDF, DOC, DOCX and TXT files (max 10MB)"
                      : "PDF-, DOC-, DOCX- und TXT-Dateien (max. 10MB)"}
                  </p>

                  {isProcessingFile && (
                    <div className="mt-4 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-teal-600 mr-2" />
                      <span className="text-sm text-teal-600">
                        {language === "EN" ? "Processing file..." : "Datei wird verarbeitet..."}
                      </span>
                    </div>
                  )}
                </div>

                {jobText && !isProcessingFile && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium">
                        {language === "EN" ? "Extracted Text" : "Extrahierter Text"}
                      </h3>
                      <Button variant="outline" size="sm" onClick={() => handleParseJobText()} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {language === "EN" ? "Processing..." : "Verarbeitung..."}
                          </>
                        ) : (
                          <>{language === "EN" ? "Parse Text" : "Text analysieren"}</>
                        )}
                      </Button>
                    </div>
                    <div className="bg-muted p-3 rounded-md max-h-[200px] overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap">{jobText}</pre>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="url" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {language === "EN" ? "Job Posting URL" : "URL der Stellenausschreibung"}
                    </label>
                    <div className="flex space-x-2">
                      <Input
                        placeholder={
                          language === "EN"
                            ? "https://example.com/jobs/software-engineer"
                            : "https://beispiel.de/jobs/softwareentwickler"
                        }
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        disabled={isLoading}
                      />
                      <Button
                        onClick={handleScrapeUrl}
                        disabled={!jobUrl || isLoading}
                        className="whitespace-nowrap bg-teal-600 hover:bg-teal-700"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {language === "EN" ? "Scraping..." : "Scraping..."}
                          </>
                        ) : (
                          <>
                            <Globe className="mr-2 h-4 w-4" />
                            {language === "EN" ? "Scrape URL" : "URL scrapen"}
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === "EN"
                        ? "Enter any job posting URL (LinkedIn, Indeed, company websites, etc.)"
                        : "Geben Sie eine beliebige Stellenausschreibungs-URL ein (LinkedIn, Indeed, Unternehmenswebsites, etc.)"}
                    </p>
                  </div>

                  {jobText && !isProcessingFile && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium">
                          {language === "EN" ? "Extracted Text" : "Extrahierter Text"}
                        </h3>
                        <Button variant="outline" size="sm" onClick={() => handleParseJobText()} disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {language === "EN" ? "Processing..." : "Verarbeitung..."}
                            </>
                          ) : (
                            <>{language === "EN" ? "Parse Text" : "Text analysieren"}</>
                          )}
                        </Button>
                      </div>
                      <div className="bg-muted p-3 rounded-md max-h-[200px] overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap">{jobText}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4 mt-4">
                <form onSubmit={handleManualFormSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">
                      {language === "EN" ? "Job Title" : "Jobtitel"} *
                    </label>
                    <Input
                      id="title"
                      name="title"
                      required
                      placeholder={
                        language === "EN" ? "e.g. Senior Software Engineer" : "z.B. Senior Softwareentwickler"
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="location" className="text-sm font-medium">
                      {language === "EN" ? "Location" : "Standort"}
                    </label>
                    <Input
                      id="location"
                      name="location"
                      placeholder={language === "EN" ? "e.g. Berlin, Germany" : "z.B. Berlin, Deutschland"}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                      {language === "EN" ? "Job Description" : "Jobbeschreibung"} *
                    </label>
                    <Textarea
                      id="description"
                      name="description"
                      required
                      placeholder={
                        language === "EN"
                          ? "Describe the role, responsibilities, and company culture"
                          : "Beschreiben Sie die Rolle, Verantwortlichkeiten und Unternehmenskultur"
                      }
                      className="min-h-[150px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="jobType" className="text-sm font-medium">
                        {language === "EN" ? "Job Type" : "Beschäftigungsart"}
                      </label>
                      <select
                        id="jobType"
                        name="jobType"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        defaultValue="full-time"
                      >
                        <option value="full-time">{language === "EN" ? "Full-time" : "Vollzeit"}</option>
                        <option value="part-time">{language === "EN" ? "Part-time" : "Teilzeit"}</option>
                        <option value="contract">{language === "EN" ? "Contract" : "Vertrag"}</option>
                        <option value="freelance">{language === "EN" ? "Freelance" : "Freiberuflich"}</option>
                        <option value="internship">{language === "EN" ? "Internship" : "Praktikum"}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="salaryRange" className="text-sm font-medium">
                        {language === "EN" ? "Salary Range" : "Gehaltsbereich"}
                      </label>
                      <Input
                        id="salaryRange"
                        name="salaryRange"
                        placeholder={language === "EN" ? "e.g. €60,000 - €80,000" : "z.B. €60.000 - €80.000"}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {language === "EN" ? "Processing..." : "Verarbeitung..."}
                        </>
                      ) : (
                        <>
                          {language === "EN" ? "Continue to Review" : "Weiter zur Überprüfung"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()} disabled={isLoading || isProcessingFile}>
              {language === "EN" ? "Cancel" : "Abbrechen"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{language === "EN" ? "Review Job Details" : "Jobdetails überprüfen"}</CardTitle>
            <CardDescription>
              {language === "EN"
                ? "Review and edit the extracted job information."
                : "Überprüfen und bearbeiten Sie die extrahierten Jobinformationen."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{language === "EN" ? "Job Title" : "Jobtitel"}</label>
                <Input
                  value={jobData.title}
                  onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                  placeholder={language === "EN" ? "Job Title" : "Jobtitel"}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{language === "EN" ? "Company" : "Unternehmen"}</label>
                <Input
                  value={jobData.company || ""}
                  onChange={(e) => setJobData({ ...jobData, company: e.target.value })}
                  placeholder={language === "EN" ? "Company Name" : "Unternehmensname"}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{language === "EN" ? "Location" : "Standort"}</label>
                <Input
                  value={jobData.location}
                  onChange={(e) => setJobData({ ...jobData, location: e.target.value })}
                  placeholder={language === "EN" ? "Location" : "Standort"}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{language === "EN" ? "Job Type" : "Beschäftigungsart"}</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={jobData.jobType}
                  onChange={(e) => setJobData({ ...jobData, jobType: e.target.value })}
                >
                  <option value="full-time">{language === "EN" ? "Full-time" : "Vollzeit"}</option>
                  <option value="part-time">{language === "EN" ? "Part-time" : "Teilzeit"}</option>
                  <option value="contract">{language === "EN" ? "Contract" : "Vertrag"}</option>
                  <option value="freelance">{language === "EN" ? "Freelance" : "Freiberuflich"}</option>
                  <option value="internship">{language === "EN" ? "Internship" : "Praktikum"}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{language === "EN" ? "Salary Range" : "Gehaltsbereich"}</label>
                <Input
                  value={jobData.salaryRange}
                  onChange={(e) => setJobData({ ...jobData, salaryRange: e.target.value })}
                  placeholder={language === "EN" ? "e.g. €60,000 - €80,000" : "z.B. €60.000 - €80.000"}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === "EN" ? "Application Deadline" : "Bewerbungsfrist"}
                </label>
                <Input
                  value={jobData.applicationDeadline || ""}
                  onChange={(e) => setJobData({ ...jobData, applicationDeadline: e.target.value })}
                  placeholder={language === "EN" ? "e.g. December 31, 2024" : "z.B. 31. Dezember 2024"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{language === "EN" ? "Description" : "Beschreibung"}</label>
              <Textarea
                value={jobData.description}
                onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                placeholder={language === "EN" ? "Job Description" : "Jobbeschreibung"}
                className="min-h-[150px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{language === "EN" ? "Skills" : "Fähigkeiten"}</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {jobData.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full p-0 hover:bg-muted"
                      onClick={() => handleRemoveSkill(index)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </Badge>
                ))}
              </div>
              <Input
                placeholder={language === "EN" ? "Add skill (press Enter)" : "Fähigkeit hinzufügen (Enter drücken)"}
                onKeyDown={handleAddSkill}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{language === "EN" ? "Requirements" : "Anforderungen"}</label>
              <div className="space-y-2 mb-2">
                {jobData.requirements.map((req, index) => (
                  <div key={index} className="flex items-center justify-between rounded-md border p-2">
                    <span className="text-sm">{req}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full p-0 hover:bg-muted"
                      onClick={() => handleRemoveRequirement(index)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                ))}
              </div>
              <Input
                placeholder={
                  language === "EN" ? "Add requirement (press Enter)" : "Anforderung hinzufügen (Enter drücken)"
                }
                onKeyDown={handleAddRequirement}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{language === "EN" ? "Benefits" : "Vorteile"}</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(jobData.benefits || []).map((benefit, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {benefit}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full p-0 hover:bg-muted"
                      onClick={() => handleRemoveBenefit(index)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </Badge>
                ))}
              </div>
              <Input
                placeholder={language === "EN" ? "Add benefit (press Enter)" : "Vorteil hinzufügen (Enter drücken)"}
                onKeyDown={handleAddBenefit}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} disabled={isLoading}>
              {language === "EN" ? "Back" : "Zurück"}
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!jobData.title || isLoading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {language === "EN" ? "Continue" : "Weiter"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Activate */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{language === "EN" ? "Activate Job" : "Job aktivieren"}</CardTitle>
            <CardDescription>
              {language === "EN"
                ? "Review your job posting and activate it to start matching with candidates."
                : "Überprüfen Sie Ihre Stellenausschreibung und aktivieren Sie sie, um mit dem Matching von Kandidaten zu beginnen."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md border p-4 space-y-4">
              <div>
                <h3 className="font-medium">{jobData.title}</h3>
                {jobData.company && <p className="text-sm text-muted-foreground">{jobData.company}</p>}
                <p className="text-sm text-muted-foreground">{jobData.location}</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {jobData.jobType === "full-time"
                    ? language === "EN"
                      ? "Full-time"
                      : "Vollzeit"
                    : jobData.jobType === "part-time"
                      ? language === "EN"
                        ? "Part-time"
                        : "Teilzeit"
                      : jobData.jobType === "contract"
                        ? language === "EN"
                          ? "Contract"
                          : "Vertrag"
                        : jobData.jobType === "freelance"
                          ? language === "EN"
                            ? "Freelance"
                            : "Freiberuflich"
                          : language === "EN"
                            ? "Internship"
                            : "Praktikum"}
                </Badge>
                {jobData.salaryRange && <Badge variant="outline">{jobData.salaryRange}</Badge>}
                {jobData.applicationDeadline && (
                  <Badge variant="outline">
                    {language === "EN" ? "Deadline: " : "Frist: "}
                    {jobData.applicationDeadline}
                  </Badge>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">{language === "EN" ? "Description" : "Beschreibung"}</h4>
                <p className="text-sm">{jobData.description}</p>
              </div>

              {jobData.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">{language === "EN" ? "Skills" : "Fähigkeiten"}</h4>
                  <div className="flex flex-wrap gap-2">
                    {jobData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {jobData.requirements.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">{language === "EN" ? "Requirements" : "Anforderungen"}</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {jobData.requirements.map((req, index) => (
                      <li key={index} className="text-sm">
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {jobData.benefits && jobData.benefits.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">{language === "EN" ? "Benefits" : "Vorteile"}</h4>
                  <div className="flex flex-wrap gap-2">
                    {jobData.benefits.map((benefit, index) => (
                      <Badge key={index} variant="outline">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)} disabled={isLoading}>
              {language === "EN" ? "Back" : "Zurück"}
            </Button>
            <Button onClick={handleCreateJob} disabled={isLoading} className="bg-teal-600 hover:bg-teal-700">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "EN" ? "Creating Job..." : "Job wird erstellt..."}
                </>
              ) : (
                <>
                  {language === "EN" ? "Create Job & Open Workspace" : "Job erstellen & Arbeitsbereich öffnen"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

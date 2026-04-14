"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { FileText, LinkIcon, Check, ArrowRight, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/contexts/language-context"
import { supabase } from "@/lib/supabase.client"
import { useAuth } from "@/hooks/use-auth"

interface JobData {
  title: string
  location: string
  description: string
  requirements: string[]
  skills: string[]
  jobType?: string
  salaryRange?: string
}

export function JobDescriptionUpload() {
  const { language } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  // Use centralized Supabase client
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [jobUrl, setJobUrl] = useState("")
  const [jobText, setJobText] = useState("")
  const [jobData, setJobData] = useState<JobData>({
    title: "",
    location: "",
    description: "",
    requirements: [],
    skills: [],
    jobType: "full-time",
    salaryRange: "",
  })

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

  // Handle URL scraping - NOW FUNCTIONAL
  const handleScrapeUrl = async () => {
    if (!jobUrl) return

    setIsLoading(true)

    try {
      // Call the scraping API
      const response = await fetch("/api/scrape-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: jobUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to scrape URL")
      }

      // Update job text with scraped content
      setJobText(data.content)

      toast({
        title: language === "EN" ? "URL scraped successfully" : "URL erfolgreich gescrapt",
        description:
          language === "EN"
            ? "Job description has been extracted from the URL."
            : "Stellenbeschreibung wurde aus der URL extrahiert.",
        variant: "default",
      })

      // Parse the job text automatically
      await handleParseJobText(data.content)
    } catch (error) {
      console.error("Error scraping URL:", error)

      toast({
        title: language === "EN" ? "Error scraping URL" : "Fehler beim Scrapen der URL",
        description:
          language === "EN"
            ? error instanceof Error
              ? error.message
              : "Failed to extract job description from the URL."
            : "Fehler beim Extrahieren der Stellenbeschreibung aus der URL.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle job text parsing - NOW USES REAL AI
  const handleParseJobText = async (textToProcess?: string) => {
    const textContent = textToProcess || jobText
    if (!textContent) return

    setIsLoading(true)

    try {
      // Call the parsing API
      const response = await fetch("/api/parse-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: textContent }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse job description")
      }

      // Update job data with parsed content
      setJobData({
        title: data.title || "",
        location: data.location || "",
        description: data.description || "",
        requirements: data.requirements || [],
        skills: data.skills || [],
        jobType: data.jobType || "full-time",
        salaryRange: data.salaryRange || "",
      })

      toast({
        title: language === "EN" ? "Job description parsed successfully" : "Stellenbeschreibung erfolgreich analysiert",
        description:
          language === "EN"
            ? "Job information has been extracted and structured."
            : "Jobinformationen wurden extrahiert und strukturiert.",
        variant: "default",
      })

      // Move to next step
      setStep(2)
    } catch (error) {
      console.error("Error parsing job text:", error)

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

  // Handle job creation
  const handleCreateJob = async () => {
    if (!user) return

    setIsLoading(true)

    try {
      // In a real app, this would call an API to create the job
      // For now, we'll simulate job creation with a timeout
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Get the current jobs from local storage or initialize an empty array
      const storedJobs = localStorage.getItem("recruitify_jobs")
      const jobs = storedJobs ? JSON.parse(storedJobs) : []

      // Create a new job object
      const newJob = {
        id: Date.now().toString(),
        title: jobData.title,
        location: jobData.location,
        description: jobData.description,
        requirements: jobData.requirements,
        skills: jobData.skills,
        job_type: jobData.jobType,
        salary_range: jobData.salaryRange,
        org_id: user.app_metadata?.org_id || "default_org",
        status: "active",
        created_at: new Date().toISOString(),
      }

      // Add the new job to the array
      jobs.push(newJob)

      // Save the updated jobs array to local storage
      localStorage.setItem("recruitify_jobs", JSON.stringify(jobs))

      toast({
        title: language === "EN" ? "Job created successfully" : "Job erfolgreich erstellt",
        description:
          language === "EN"
            ? "Your job has been created and is ready for matching."
            : "Ihr Job wurde erstellt und ist bereit für den Abgleich.",
        variant: "default",
      })

      // Navigate to matches page with the new job selected
      router.push(`/dashboard/matches?job=${newJob.id}`)
    } catch (error) {
      console.error("Error creating job:", error)

      toast({
        title: language === "EN" ? "Error creating job" : "Fehler beim Erstellen des Jobs",
        description:
          language === "EN"
            ? "Failed to create the job. Please try again."
            : "Fehler beim Erstellen des Jobs. Bitte versuchen Sie es erneut.",
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
            {language === "EN" ? "Upload" : "Hochladen"}
          </span>
          <span className={step >= 2 ? "font-medium" : "text-muted-foreground"}>
            {language === "EN" ? "Review" : "Überprüfen"}
          </span>
          <span className={step >= 3 ? "font-medium" : "text-muted-foreground"}>
            {language === "EN" ? "Activate" : "Aktivieren"}
          </span>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{language === "EN" ? "Upload Job Description" : "Stellenbeschreibung hochladen"}</CardTitle>
            <CardDescription>
              {language === "EN"
                ? "Paste job description text or provide a URL to scrape."
                : "Fügen Sie den Text der Stellenbeschreibung ein oder geben Sie eine URL zum Scrapen an."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">
                    {language === "EN" ? "Upload job description file" : "Stellenbeschreibungsdatei hochladen"}
                  </h3>
                </div>
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
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    {language === "EN"
                      ? "Drag & drop job description file here, or click to select"
                      : "Stellenbeschreibungsdatei hier ablegen oder klicken, um auszuwählen"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "EN"
                      ? "PDF, DOC, DOCX and TXT files (max 10MB)"
                      : "PDF-, DOC-, DOCX- und TXT-Dateien (max. 10MB)"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">
                    {language === "EN" ? "Or scrape from URL" : "Oder von URL scrapen"}
                  </h3>
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder={language === "EN" ? "Enter job posting URL" : "URL der Stellenausschreibung eingeben"}
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    disabled={isLoading || isProcessingFile}
                  />
                  <Button
                    onClick={handleScrapeUrl}
                    disabled={!jobUrl || isLoading || isProcessingFile}
                    className="whitespace-nowrap"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {language === "EN" ? "Scraping..." : "Scraping..."}
                      </>
                    ) : language === "EN" ? (
                      "Scrape URL"
                    ) : (
                      "URL scrapen"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === "EN"
                    ? "Enter any job posting URL (LinkedIn, Indeed, company websites, etc.)"
                    : "Geben Sie eine beliebige Stellenausschreibungs-URL ein (LinkedIn, Indeed, Unternehmenswebsites, etc.)"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">
                    {language === "EN" ? "Or paste job description" : "Oder Stellenbeschreibung einfügen"}
                  </h3>
                </div>
                <Textarea
                  placeholder={
                    language === "EN"
                      ? "Paste job description text here..."
                      : "Fügen Sie hier den Text der Stellenbeschreibung ein..."
                  }
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  className="min-h-[200px]"
                  disabled={isLoading || isProcessingFile}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()} disabled={isLoading || isProcessingFile}>
              {language === "EN" ? "Cancel" : "Abbrechen"}
            </Button>
            <Button
              onClick={() => handleParseJobText()}
              disabled={!jobText || isLoading || isProcessingFile}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isLoading || isProcessingFile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === "EN" ? "Processing..." : "Verarbeitung..."}
                </>
              ) : (
                <>
                  {language === "EN" ? "Continue" : "Weiter"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
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
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === "EN" ? "Job Title" : "Jobtitel"}</label>
              <Input
                value={jobData.title}
                onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                placeholder={language === "EN" ? "Job Title" : "Jobtitel"}
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
                <p className="text-sm text-muted-foreground">{jobData.location}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">{language === "EN" ? "Description" : "Beschreibung"}</h4>
                <p className="text-sm">{jobData.description}</p>
              </div>

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
                  {language === "EN" ? "Creating..." : "Wird erstellt..."}
                </>
              ) : (
                <>
                  {language === "EN" ? "Create Job & Start Matching" : "Job erstellen & Matching starten"}
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

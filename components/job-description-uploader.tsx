"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { FileText, Check, ArrowRight, Loader2, X, Upload, Globe, FormInput, AlertTriangle } from "lucide-react"
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
  description_html?: string
  hard_skills?: string[]
  soft_skills?: string[]
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
  const { session } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [jobUrl, setJobUrl] = useState("")
  const [jobText, setJobText] = useState("")
  const [urlBlocked, setUrlBlocked] = useState(false)
  const [blockedPasteText, setBlockedPasteText] = useState("")
  const [activeTab, setActiveTab] = useState("upload")
  const [jobData, setJobData] = useState<JobData>({
    title: "",
    company: "",
    location: "",
    description: "",
    description_html: "",
    hard_skills: [],
    soft_skills: [],
    requirements: [],
    skills: [],
    jobType: "full-time",
    salaryRange: "",
    benefits: [],
    applicationDeadline: "",
  })

  const applyParsedData = (data: any) => {
    const hardSkills = Array.isArray(data.hard_skills) ? data.hard_skills : []
    const softSkills = Array.isArray(data.soft_skills) ? data.soft_skills : []
    setJobData({
      title: data.title || "",
      company: data.company || "",
      location: data.location || "",
      description: data.description || "",
      description_html: data.description_html || "",
      hard_skills: hardSkills,
      soft_skills: softSkills,
      skills: [...hardSkills, ...softSkills],
      requirements: Array.isArray(data.requirements) ? data.requirements : [],
      jobType: data.employment_type || "full-time",
      salaryRange: data.salary_range || "",
      benefits: Array.isArray(data.benefits) ? data.benefits : [],
      applicationDeadline: "",
    })
  }

  // Handle file selection
  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  // Handle file upload — sends file to /api/jobs/import for server-side parsing + Gemini
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setIsProcessingFile(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/jobs/import", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to parse file")
      }

      applyParsedData(data)

      toast({
        title: language === "EN" ? "File parsed successfully" : "Datei erfolgreich analysiert",
        description:
          language === "EN"
            ? `Job data extracted from ${file.name}`
            : `Jobdaten aus ${file.name} extrahiert`,
        variant: "default",
      })

      setStep(2)
    } catch (error) {
      console.error("Error processing file:", error)
      toast({
        title: language === "EN" ? "Error processing file" : "Fehler bei der Verarbeitung der Datei",
        description:
          error instanceof Error
            ? error.message
            : language === "EN"
              ? "Failed to extract job description from the file."
              : "Fehler beim Extrahieren der Stellenbeschreibung aus der Datei.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingFile(false)
    }
  }

  // Handle URL import — calls /api/jobs/import, shows paste fallback on block
  const handleScrapeUrl = async () => {
    if (!jobUrl) return

    setIsLoading(true)
    setUrlBlocked(false)

    try {
      let validUrl = jobUrl
      if (!jobUrl.startsWith("http://") && !jobUrl.startsWith("https://")) {
        validUrl = "https://" + jobUrl
      }
      new URL(validUrl) // validate format

      const response = await fetch("/api/jobs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: validUrl }),
      })

      const data = await response.json()

      if (data.blocked) {
        setUrlBlocked(true)
        return
      }

      if (!data.success) {
        throw new Error(data.error || "Import failed")
      }

      applyParsedData(data)

      toast({
        title: language === "EN" ? "URL imported successfully" : "URL erfolgreich importiert",
        description:
          language === "EN"
            ? `Job data extracted from ${data.siteType} site`
            : `Jobdaten von ${data.siteType}-Seite extrahiert`,
        variant: "default",
      })

      setStep(2)
    } catch (error) {
      console.error("Error importing URL:", error)
      // Treat any network/parse error as a block — show the paste fallback
      setUrlBlocked(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle raw text parsing via /api/jobs/import
  const handleParseJobText = async (textToProcess?: string) => {
    const textContent = textToProcess || jobText || blockedPasteText
    if (!textContent) {
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
      const response = await fetch("/api/jobs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textContent }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to parse job description")
      }

      applyParsedData(data)

      toast({
        title: language === "EN" ? "Job description parsed successfully" : "Stellenbeschreibung erfolgreich analysiert",
        variant: "default",
      })

      setStep(2)
    } catch (error) {
      console.error("Error parsing job text:", error)
      toast({
        title: language === "EN" ? "Error parsing job description" : "Fehler beim Parsen der Stellenbeschreibung",
        description:
          error instanceof Error
            ? error.message
            : language === "EN"
              ? "Failed to extract information from the job description."
              : "Fehler beim Extrahieren von Informationen aus der Stellenbeschreibung.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle job creation
  const handleFinalSave = async () => {
    if (!session?.access_token) {
      alert("Nicht angemeldet. Bitte neu einloggen.")
      return
    }

    setIsLoading(true)

    try {
      const allSkills = [
        ...(jobData.hard_skills || []),
        ...(jobData.soft_skills || []),
        ...jobData.skills,
      ].filter((s, i, a) => s && a.indexOf(s) === i)

      const payload = {
        title: String(jobData.title).trim(),
        description: String(jobData.description).trim(),
        description_html: jobData.description_html || null,
        hard_skills: jobData.hard_skills || [],
        soft_skills: jobData.soft_skills || [],
        requirements: Array.isArray(jobData.requirements)
          ? jobData.requirements.join("\n")
          : String(jobData.requirements || ""),
        location: String(jobData.location || ""),
        employment_type: String(jobData.jobType || "full-time"),
        salary_range: String(jobData.salaryRange || ""),
        skills: allSkills,
        benefits: Array.isArray(jobData.benefits) ? jobData.benefits : [],
        company: String(jobData.company || ""),
      }

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        window.location.assign("/dashboard")
      } else {
        const errorData = await res.json()
        alert("Fehler beim Speichern in Datenbank: " + (errorData.error || res.status))
        setIsLoading(false)
      }
    } catch {
      alert("Netzwerkfehler beim Speichern.")
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

    setJobData({
      ...jobData,
      title,
      location,
      description,
      jobType,
      salaryRange,
    })

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
                        onChange={(e) => { setJobUrl(e.target.value); setUrlBlocked(false) }}
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
                            {language === "EN" ? "Importing..." : "Importieren..."}
                          </>
                        ) : (
                          <>
                            <Globe className="mr-2 h-4 w-4" />
                            {language === "EN" ? "Import URL" : "URL importieren"}
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === "EN"
                        ? "Enter any job posting URL (karriere.at, LinkedIn, company websites, etc.)"
                        : "Beliebige Stellenausschreibungs-URL eingeben (karriere.at, LinkedIn, Unternehmenswebsites, etc.)"}
                    </p>
                  </div>

                  {/* Blocked URL fallback — shown when the site can't be read automatically */}
                  {urlBlocked && (
                    <div className="space-y-3">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">
                            {language === "EN"
                              ? "Link could not be read automatically"
                              : "Link konnte nicht automatisch gelesen werden"}
                          </p>
                          <p className="text-sm text-amber-700 mt-1">
                            {language === "EN"
                              ? "Please copy the job ad text manually and paste it below."
                              : "Bitte kopiere den Text der Anzeige manuell hier hinein."}
                          </p>
                        </div>
                      </div>
                      <Textarea
                        placeholder={
                          language === "EN"
                            ? "Paste the full job description text here..."
                            : "Vollständigen Text der Stellenanzeige hier einfügen..."
                        }
                        value={blockedPasteText}
                        onChange={(e) => setBlockedPasteText(e.target.value)}
                        className="min-h-[200px]"
                      />
                      <Button
                        onClick={() => handleParseJobText(blockedPasteText)}
                        disabled={!blockedPasteText || isLoading}
                        className="w-full bg-teal-600 hover:bg-teal-700"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {language === "EN" ? "Processing..." : "Verarbeitung..."}
                          </>
                        ) : (
                          <>
                            {language === "EN" ? "Parse & Import" : "Analysieren & Importieren"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
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
                {jobData.description_html ? (
                  <div
                    className="text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: jobData.description_html }}
                  />
                ) : (
                  <p className="text-sm">{jobData.description}</p>
                )}
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
            <Button onClick={handleFinalSave} disabled={isLoading} className="bg-teal-600 hover:bg-teal-700">
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

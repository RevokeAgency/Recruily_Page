"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Briefcase,
  Timer,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"

interface JobData {
  id: string
  title: string
  description: string
  requirements: string[]
  skills: string[]
  location?: string
  experienceLevel?: string
}

interface Candidate {
  id: string
  name: string
  email: string
  phone?: string
  position: string
  location?: string
  yearsOfExperience: number
  skills: string[]
  education?: string
  summary?: string
  workExperience?: Array<{
    company: string
    position: string
    duration: string
    description: string
  }>
  certifications?: string[]
  languages?: string[]
  match: number
  status: string
  applied: string
  jobId?: string
  source: string
  addToGlobalList?: boolean
}

interface FileUploadState {
  file: File
  status: "pending" | "processing" | "completed" | "error" | "retrying"
  progress: number
  candidate?: Candidate
  error?: string
  retryAttempt?: number
  retryDelay?: number
}

interface CVUploadEnhancedProps {
  jobId?: string
  jobData?: JobData
  onComplete?: () => void
  maxFiles?: number
}

export function CVUploadEnhanced({ onComplete, jobId, jobData, maxFiles = 10 }: CVUploadEnhancedProps) {
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadState[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [apiStatus, setApiStatus] = useState<{
    available: boolean
    connectionWorking: boolean
    message?: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { language } = useLanguage()

  // Check API status on component mount
  useEffect(() => {
    checkApiStatus()
  }, [])

  const checkApiStatus = async () => {
    try {
      console.log("🔍 Checking API status...")
      const response = await fetch("/api/analyze-cv", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })

      console.log(`📊 API response status: ${response.status}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("❌ Non-JSON response:", text.substring(0, 200))
        throw new Error("Server returned non-JSON response")
      }

      const data = await response.json()
      console.log("✅ API status data:", data)

      setApiStatus({
        available: data.apiAvailable,
        connectionWorking: data.connectionWorking,
        message: data.status,
      })
    } catch (error: any) {
      console.error("❌ Failed to check API status:", error)
      setApiStatus({
        available: false,
        connectionWorking: false,
        message: `API check failed: ${error.message}`,
      })
    }
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: FileUploadState[] = acceptedFiles.slice(0, maxFiles - uploadedFiles.length).map((file) => ({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: "pending" as const,
        progress: 0,
      }))

      setUploadedFiles((prev) => [...prev, ...newFiles])
      processFiles(newFiles)
    },
    [uploadedFiles.length, maxFiles],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    handleFiles(selectedFiles)
  }, [])

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ]
      const maxSize = 10 * 1024 * 1024 // 10MB

      if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
        toast({
          title: language === "EN" ? "Invalid file type" : "Ungültiger Dateityp",
          description:
            language === "EN"
              ? `${file.name} is not a supported file type. Please upload PDF, DOC, DOCX, or TXT files.`
              : `${file.name} ist kein unterstützter Dateityp. Bitte laden Sie PDF-, DOC-, DOCX- oder TXT-Dateien hoch.`,
          variant: "destructive",
        })
        return false
      }

      if (file.size > maxSize) {
        toast({
          title: language === "EN" ? "File too large" : "Datei zu groß",
          description:
            language === "EN"
              ? `${file.name} is larger than 10MB. Please upload a smaller file.`
              : `${file.name} ist größer als 10MB. Bitte laden Sie eine kleinere Datei hoch.`,
          variant: "destructive",
        })
        return false
      }

      return true
    })

    const fileStates: FileUploadState[] = validFiles.map((file) => ({
      file,
      status: "pending",
      progress: 0,
    }))

    setUploadedFiles((prev) => [...prev, ...fileStates])

    if (validFiles.length > 0) {
      processFiles(fileStates)
    }
  }

  const processFiles = async (fileStates: FileUploadState[]) => {
    setIsProcessing(true)

    for (const fileState of fileStates) {
      await processFileWithExponentialBackoff(fileState)
    }

    setIsProcessing(false)
  }

  // Enhanced processFile with Exponential Backoff
  const processFileWithExponentialBackoff = async (fileState: FileUploadState) => {
    const maxRetries = 5
    const initialDelay = 1000 // 1 second
    const maxDelay = 32000 // 32 seconds
    const backoffMultiplier = 2

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Update status to show retry attempt
        if (attempt > 0) {
          updateFileState(fileState.file, {
            status: "retrying",
            progress: 10,
            retryAttempt: attempt,
            error: `Retry attempt ${attempt}/${maxRetries}...`,
          })
        }

        await processFile(fileState)
        break // Success, exit retry loop
      } catch (error: any) {
        const errorMessage = error.message || String(error)
        console.error(`❌ Processing attempt ${attempt + 1} failed:`, errorMessage)

        // Check if this is a retryable error
        const isRetryable =
          errorMessage.includes("429") || // Too Many Requests
          errorMessage.includes("rate limit") ||
          errorMessage.includes("quota") ||
          errorMessage.includes("503") || // Service Unavailable
          errorMessage.includes("overloaded") ||
          errorMessage.includes("temporarily unavailable") ||
          errorMessage.includes("try again later") ||
          errorMessage.includes("network") ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("connection")

        if (isRetryable && attempt < maxRetries) {
          // Calculate exponential backoff delay
          const delay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt), maxDelay)

          console.log(`⏳ Exponential backoff: waiting ${delay}ms before retry (attempt ${attempt + 1})`)

          // Update UI to show countdown
          updateFileState(fileState.file, {
            status: "retrying",
            progress: 25,
            retryAttempt: attempt + 1,
            retryDelay: delay,
            error: `Rate limited. Retrying in ${Math.ceil(delay / 1000)}s... (${attempt + 1}/${maxRetries})`,
          })

          // Show countdown in real-time
          let remainingTime = delay
          const countdownInterval = setInterval(() => {
            remainingTime -= 1000
            if (remainingTime > 0) {
              updateFileState(fileState.file, {
                error: `Rate limited. Retrying in ${Math.ceil(remainingTime / 1000)}s... (${attempt + 1}/${maxRetries})`,
              })
            } else {
              clearInterval(countdownInterval)
            }
          }, 1000)

          await new Promise((resolve) => setTimeout(resolve, delay))
          clearInterval(countdownInterval)
        } else {
          // Max retries reached or non-retryable error
          updateFileState(fileState.file, {
            status: "error",
            progress: 0,
            error:
              attempt >= maxRetries
                ? `Processing failed after ${maxRetries} attempts: ${errorMessage}`
                : `Processing failed: ${errorMessage}`,
          })
          break
        }
      }
    }
  }

  const processFile = async (fileState: FileUploadState) => {
    updateFileState(fileState.file, { status: "processing", progress: 10 })

    try {
      // Prepare form data
      const formData = new FormData()
      formData.append("file", fileState.file)
      formData.append("jobId", jobId || "")

      // Add job data for matching if available
      if (jobData) {
        formData.append("jobData", JSON.stringify(jobData))
      }

      updateFileState(fileState.file, { progress: 30 })

      // Call API
      console.log("📤 Calling /api/analyze-cv for file:", fileState.file.name)
      const response = await fetch("/api/analyze-cv", {
        method: "POST",
        body: formData,
      })

      updateFileState(fileState.file, { progress: 60 })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      updateFileState(fileState.file, { progress: 90 })

      if (result.success && result.candidate) {
        // Ensure the candidate has the current date and jobId
        const candidate = {
          ...result.candidate,
          jobId: jobId || result.candidate.jobId,
          applied: new Date().toISOString().split("T")[0],
        }

        updateFileState(fileState.file, {
          status: "completed",
          progress: 100,
          candidate,
        })

        // Save to localStorage with detailed logging
        console.log("💾 Saving candidate to localStorage:", candidate.name)
        saveToLocalStorage(candidate)

        toast({
          title: language === "EN" ? "CV processed successfully" : "Lebenslauf erfolgreich verarbeitet",
          description:
            language === "EN"
              ? `${candidate.name} added with ${candidate.match}% match`
              : `${candidate.name} mit ${candidate.match}% Übereinstimmung hinzugefügt`,
        })
      } else {
        throw new Error(result.error || "Failed to process CV")
      }
    } catch (error: any) {
      console.error("CV processing error:", error)
      throw error // Re-throw to trigger retry logic
    }
  }

  const saveToLocalStorage = (candidate: Candidate) => {
    try {
      // Save to job-specific candidates
      const existingCandidates = JSON.parse(localStorage.getItem("recruitify_candidates") || "[]")

      // Check for duplicates by ID and email
      const isDuplicate = existingCandidates.some(
        (existing: any) => existing.id === candidate.id || existing.email === candidate.email,
      )

      if (!isDuplicate) {
        const updatedCandidates = [...existingCandidates, candidate]
        localStorage.setItem("recruitify_candidates", JSON.stringify(updatedCandidates))
        console.log("✅ Candidate saved to localStorage. New total count:", updatedCandidates.length)

        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent("candidatesUpdated"))
      } else {
        console.warn("⚠️ Duplicate candidate detected, not saving:", candidate.name)
      }
    } catch (error) {
      console.error("Error saving candidate to localStorage:", error)
    }
  }

  const updateFileState = (file: File, updates: Partial<FileUploadState>) => {
    setUploadedFiles((prev) => prev.map((f) => (f.file === file ? { ...f, ...updates } : f)))
  }

  const removeFile = (file: File) => {
    setUploadedFiles((prev) => prev.filter((f) => f.file !== file))
  }

  const retryFile = (fileState: FileUploadState) => {
    updateFileState(fileState.file, {
      status: "pending",
      progress: 0,
      error: undefined,
      candidate: undefined,
      retryAttempt: undefined,
      retryDelay: undefined,
    })
    processFileWithExponentialBackoff({ ...fileState, status: "pending", progress: 0 })
  }

  const clearCompleted = () => {
    setUploadedFiles((prev) => prev.filter((f) => f.status !== "completed"))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-emerald-600" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "processing":
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      case "retrying":
        return <Timer className="h-5 w-5 text-orange-500 animate-pulse" />
      default:
        return <Clock className="h-5 w-5 text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 shadow-emerald-100"
      case "error":
        return "border-red-200 bg-gradient-to-br from-red-50 to-rose-50 shadow-red-100"
      case "processing":
        return "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-blue-100 animate-pulse"
      case "retrying":
        return "border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-orange-100 animate-pulse"
      default:
        return "border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50 shadow-slate-100"
    }
  }

  const getMatchBadgeColor = (match: number) => {
    if (match >= 85) return "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-200"
    if (match >= 70) return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-200"
    if (match >= 55) return "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200"
    return "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-200"
  }

  const completedFiles = uploadedFiles.filter((f) => f.status === "completed")
  const errorFiles = uploadedFiles.filter((f) => f.status === "error")
  const processingFiles = uploadedFiles.filter((f) => f.status === "processing" || f.status === "retrying")

  return (
    <div className="space-y-8 p-6">
      {/* API Status Alert with enhanced styling - Only show fallback message */}
      {apiStatus && !apiStatus.connectionWorking && (
        <div className="animate-slideInUp">
          <Alert className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <AlertDescription className="font-medium">
                {language === "EN"
                  ? "🔄 Smart Fallback Mode with Exponential Backoff - High-quality candidate profiles will be generated using advanced algorithms with intelligent retry logic"
                  : "🔄 Intelligenter Fallback-Modus mit Exponential Backoff - Hochwertige Kandidatenprofile werden mit erweiterten Algorithmen und intelligenter Retry-Logik generiert"}
              </AlertDescription>
            </div>
          </Alert>
        </div>
      )}

      {/* Enhanced Upload Area */}
      <div className="animate-slideInUp" style={{ animationDelay: "0.1s" }}>
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-blue-500/5"></div>
          <CardHeader className="relative pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl shadow-lg">
                <Upload className="h-6 w-6 text-white" />
              </div>
              {language === "EN" ? "Upload Candidate CVs" : "Kandidaten-CVs hochladen"}
            </CardTitle>
            <CardDescription className="text-slate-600 text-lg">
              {language === "EN"
                ? "Upload PDF, DOC, DOCX, or TXT files. Our AI will extract candidate information with intelligent retry logic and exponential backoff for maximum reliability."
                : "Laden Sie PDF-, DOC-, DOCX- oder TXT-Dateien hoch. Unsere KI extrahiert Kandidateninformationen mit intelligenter Retry-Logik und Exponential Backoff für maximale Zuverlässigkeit."}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? "border-teal-400 bg-gradient-to-br from-teal-50 to-blue-50 scale-105 shadow-xl"
                  : isProcessing
                    ? "opacity-60 cursor-not-allowed border-slate-300 bg-slate-50"
                    : "border-slate-300 hover:border-teal-400 hover:bg-gradient-to-br hover:from-teal-50 hover:to-blue-50 hover:shadow-lg hover:scale-102"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
              />

              <div className="space-y-6">
                <div
                  className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center shadow-xl transition-transform duration-300 cursor-pointer ${isDragActive ? "scale-110" : "hover:scale-105"}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                >
                  <Upload className="h-10 w-10 text-white" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-800">
                    {isDragActive
                      ? language === "EN"
                        ? "Drop files here to analyze"
                        : "Dateien hier ablegen zum Analysieren"
                      : language === "EN"
                        ? "Drag & drop CV files here"
                        : "CV-Dateien hier hineinziehen"}
                  </h3>
                  <p className="text-slate-600 text-lg">
                    {language === "EN"
                      ? "or click to select files from your computer"
                      : "oder klicken, um Dateien von Ihrem Computer auszuwählen"}
                  </p>
                </div>

                <Button
                  size="lg"
                  disabled={isProcessing}
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                  className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  {language === "EN" ? "Select Files" : "Dateien auswählen"}
                </Button>

                <div className="flex items-center justify-center gap-6 text-sm text-slate-500 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>PDF, DOC, DOCX, TXT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>
                      {language === "EN" ? "Max" : "Max"} {maxFiles} {language === "EN" ? "files" : "Dateien"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>{language === "EN" ? "Up to 10MB each" : "Bis zu 10MB pro Datei"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>{language === "EN" ? "Auto-retry with backoff" : "Auto-Retry mit Backoff"}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Processing Stats */}
      {uploadedFiles.length > 0 && (
        <div className="animate-slideInUp" style={{ animationDelay: "0.2s" }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-white hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      {language === "EN" ? "Total Files" : "Dateien gesamt"}
                    </p>
                    <p className="text-3xl font-bold text-slate-800 metric-counter">{uploadedFiles.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <RefreshCw className={`h-6 w-6 text-white ${processingFiles.length > 0 ? "animate-spin" : ""}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      {language === "EN" ? "Processing" : "In Bearbeitung"}
                    </p>
                    <p className="text-3xl font-bold text-blue-800 metric-counter">{processingFiles.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-white hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-600">
                      {language === "EN" ? "Completed" : "Abgeschlossen"}
                    </p>
                    <p className="text-3xl font-bold text-emerald-800 metric-counter">{completedFiles.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-white hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-600">{language === "EN" ? "Errors" : "Fehler"}</p>
                    <p className="text-3xl font-bold text-red-800 metric-counter">{errorFiles.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Enhanced File List */}
      {uploadedFiles.length > 0 && (
        <div className="animate-slideInUp" style={{ animationDelay: "0.3s" }}>
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg">
                    <RefreshCw className="h-5 w-5 text-white" />
                  </div>
                  {language === "EN"
                    ? "Processing Queue with Exponential Backoff"
                    : "Verarbeitungswarteschlange mit Exponential Backoff"}
                </CardTitle>
                <div className="flex gap-3">
                  {completedFiles.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCompleted}
                      className="hover:bg-slate-100 transition-colors bg-transparent"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {language === "EN" ? "Clear Completed" : "Abgeschlossene löschen"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkApiStatus}
                    className="hover:bg-slate-100 transition-colors bg-transparent"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {language === "EN" ? "Check Status" : "Status prüfen"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {uploadedFiles.map((fileState, index) => (
                  <div
                    key={index}
                    className={`border rounded-2xl p-6 transition-all duration-500 hover:shadow-lg ${getStatusColor(fileState.status)} dashboard-card-enter`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {getStatusIcon(fileState.status)}
                          {(fileState.status === "processing" || fileState.status === "retrying") && (
                            <div className="absolute -inset-2 bg-blue-400 rounded-full opacity-20 animate-ping"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-lg">{fileState.file.name}</p>
                          <p className="text-sm text-slate-600 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {(fileState.file.size / 1024 / 1024).toFixed(2)} MB
                            {fileState.retryAttempt && (
                              <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300">
                                <Timer className="h-3 w-3 mr-1" />
                                Retry {fileState.retryAttempt}/5
                              </Badge>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {fileState.status === "error" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryFile(fileState)}
                            className="bg-white hover:bg-red-50 border-red-200 text-red-600 hover:text-red-700 transition-colors"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {language === "EN" ? "Retry" : "Wiederholen"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFile(fileState.file)}
                          className="hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {(fileState.status === "processing" || fileState.status === "retrying") && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-600">
                            {fileState.status === "retrying"
                              ? language === "EN"
                                ? "Retrying with exponential backoff..."
                                : "Wiederholung mit Exponential Backoff..."
                              : language === "EN"
                                ? "Processing..."
                                : "Wird verarbeitet..."}
                          </span>
                          <span className="text-sm font-medium text-blue-600">{fileState.progress}%</span>
                        </div>
                        <Progress value={fileState.progress} className="h-3 bg-blue-100">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 pipeline-bar-fill"></div>
                        </Progress>
                      </div>
                    )}

                    {fileState.error && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {fileState.error}
                        </p>
                      </div>
                    )}

                    {fileState.candidate && (
                      <div className="mt-4 p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-lg">{fileState.candidate.name}</h4>
                              <p className="text-slate-600 flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                {fileState.candidate.position}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={`px-4 py-2 text-sm font-bold ${getMatchBadgeColor(fileState.candidate.match)}`}
                          >
                            {fileState.candidate.match}% {language === "EN" ? "match" : "Übereinstimmung"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="h-4 w-4 text-teal-500" />
                            <span>{fileState.candidate.email}</span>
                          </div>
                          {fileState.candidate.phone && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="h-4 w-4 text-blue-500" />
                              <span>{fileState.candidate.phone}</span>
                            </div>
                          )}
                          {fileState.candidate.location && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <MapPin className="h-4 w-4 text-purple-500" />
                              <span>{fileState.candidate.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="h-4 w-4 text-orange-500" />
                            <span>
                              {fileState.candidate.yearsOfExperience}{" "}
                              {language === "EN" ? "years experience" : "Jahre Erfahrung"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <Award className="h-4 w-4 text-yellow-500" />
                              {language === "EN" ? "Key Skills" : "Hauptfähigkeiten"}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {fileState.candidate.skills.slice(0, 6).map((skill, skillIndex) => (
                                <Badge
                                  key={skillIndex}
                                  variant="secondary"
                                  className="bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 hover:from-slate-200 hover:to-gray-200 transition-colors"
                                >
                                  {skill}
                                </Badge>
                              ))}
                              {fileState.candidate.skills.length > 6 && (
                                <Badge
                                  variant="secondary"
                                  className="bg-gradient-to-r from-teal-100 to-blue-100 text-teal-700"
                                >
                                  +{fileState.candidate.skills.length - 6} {language === "EN" ? "more" : "weitere"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Action Buttons */}
      {uploadedFiles.length > 0 && (
        <div className="animate-slideInUp flex justify-between items-center pt-6" style={{ animationDelay: "0.4s" }}>
          <Button
            variant="outline"
            onClick={() => setUploadedFiles([])}
            disabled={isProcessing}
            className="px-6 py-3 hover:bg-slate-100 transition-colors"
          >
            <X className="mr-2 h-4 w-4" />
            {language === "EN" ? "Clear All" : "Alle löschen"}
          </Button>
          <div className="flex gap-4">
            {completedFiles.length > 0 && onComplete && (
              <Button
                onClick={onComplete}
                className="px-8 py-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <User className="mr-2 h-5 w-5" />
                {language === "EN" ? "View Candidates" : "Kandidaten anzeigen"} ({completedFiles.length})
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

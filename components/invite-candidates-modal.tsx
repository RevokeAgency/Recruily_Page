"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, User, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { cn } from "@/lib/utils"

interface InviteCandidatesModalProps {
  jobId: string
  jobTitle: string
  onCandidateAdded?: (candidate: any) => void
  trigger?: React.ReactNode
}

interface UploadState {
  uploading: boolean
  processing: boolean
  progress: number
  error: string | null
  success: boolean
  candidate: any | null
}

export function InviteCandidatesModal({
  jobId,
  jobTitle,
  onCandidateAdded,
  trigger
}: InviteCandidatesModalProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    processing: false,
    progress: 0,
    error: null,
    success: false,
    candidate: null
  })
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [manualData, setManualData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    skills: "",
    experience: "",
    summary: ""
  })

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploadState({
      uploading: true,
      processing: false,
      progress: 0,
      error: null,
      success: false,
      candidate: null
    })

    try {
      // Simulate upload progress
      setUploadState(prev => ({ ...prev, progress: 30 }))

      const formData = new FormData()
      formData.append('file', file)
      formData.append('jobId', jobId)

      setUploadState(prev => ({ ...prev, progress: 60, processing: true, uploading: false }))

      const response = await fetch('/api/parse-cv', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to process CV')
      }

      setUploadState(prev => ({ ...prev, progress: 90 }))

      // Auto-match candidate to job
      const matchResponse = await fetch('/api/match-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: jobId,
          candidateId: result.candidate.id
        })
      })

      const matchResult = await matchResponse.json()

      setUploadState({
        uploading: false,
        processing: false,
        progress: 100,
        error: null,
        success: true,
        candidate: {
          ...result.candidate,
          match_score: matchResult.success ? matchResult.match.score : result.candidate.match_score
        }
      })

      // Notify parent component
      if (onCandidateAdded) {
        onCandidateAdded({
          ...result.candidate,
          match_score: matchResult.success ? matchResult.match.score : result.candidate.match_score
        })
      }

      // Auto-close modal after success
      setTimeout(() => {
        setOpen(false)
        resetState()
      }, 3000)

    } catch (error) {
      console.error('CV upload error:', error)
      setUploadState({
        uploading: false,
        processing: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Failed to process CV',
        success: false,
        candidate: null
      })
    }
  }, [jobId, onCandidateAdded])

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploadState.uploading || uploadState.processing
  })

  const resetState = () => {
    setUploadState({
      uploading: false,
      processing: false,
      progress: 0,
      error: null,
      success: false,
      candidate: null
    })
    setLinkedinUrl("")
    setManualData({
      name: "",
      email: "",
      phone: "",
      location: "",
      skills: "",
      experience: "",
      summary: ""
    })
  }

  const handleLinkedinSubmit = async () => {
    if (!linkedinUrl.trim()) return

    setUploadState({
      uploading: false,
      processing: true,
      progress: 50,
      error: null,
      success: false,
      candidate: null
    })

    try {
      // Placeholder for LinkedIn URL processing
      // In a real implementation, you would scrape the LinkedIn profile
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setUploadState({
        uploading: false,
        processing: false,
        progress: 100,
        error: "LinkedIn URL processing is not yet implemented. Please use CV upload instead.",
        success: false,
        candidate: null
      })
    } catch (error) {
      setUploadState({
        uploading: false,
        processing: false,
        progress: 0,
        error: "Failed to process LinkedIn URL",
        success: false,
        candidate: null
      })
    }
  }

  const handleManualSubmit = async () => {
    if (!manualData.name || !manualData.email) {
      setUploadState(prev => ({
        ...prev,
        error: "Name and email are required"
      }))
      return
    }

    setUploadState({
      uploading: false,
      processing: true,
      progress: 50,
      error: null,
      success: false,
      candidate: null
    })

    try {
      const candidateData = {
        name: manualData.name,
        email: manualData.email,
        phone: manualData.phone,
        location: manualData.location,
        skills: manualData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0),
        experience_years: 0,
        summary: manualData.summary,
        source: 'manual_entry',
        organisation_id: 'demo-org-123'
      }

      // Create candidate record
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateData)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create candidate')
      }

      // Auto-match candidate to job
      const matchResponse = await fetch('/api/match-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: jobId,
          candidateId: result.candidate.id
        })
      })

      const matchResult = await matchResponse.json()

      setUploadState({
        uploading: false,
        processing: false,
        progress: 100,
        error: null,
        success: true,
        candidate: {
          ...result.candidate,
          match_score: matchResult.success ? matchResult.match.score : 50
        }
      })

      // Notify parent component
      if (onCandidateAdded) {
        onCandidateAdded({
          ...result.candidate,
          match_score: matchResult.success ? matchResult.match.score : 50
        })
      }

      // Auto-close modal after success
      setTimeout(() => {
        setOpen(false)
        resetState()
      }, 3000)

    } catch (error) {
      console.error('Manual candidate creation error:', error)
      setUploadState({
        uploading: false,
        processing: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Failed to create candidate',
        success: false,
        candidate: null
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-2">
            <User className="h-4 w-4" />
            Invite Candidates
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Invite Candidates to: {jobTitle}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload CV</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn URL</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
                  (uploadState.uploading || uploadState.processing) && "cursor-not-allowed opacity-50"
                )}
              >
                <input {...getInputProps()} />
                
                {uploadState.success ? (
                  <div className="space-y-3">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <div>
                      <h3 className="font-semibold text-lg">CV Processed Successfully!</h3>
                      <p className="text-gray-600">
                        Candidate: <strong>{uploadState.candidate?.name}</strong>
                      </p>
                      <p className="text-gray-600">
                        Match Score: <strong>{uploadState.candidate?.match_score}%</strong>
                      </p>
                    </div>
                  </div>
                ) : uploadState.uploading || uploadState.processing ? (
                  <div className="space-y-3">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
                    <div>
                      <h3 className="font-semibold">
                        {uploadState.uploading ? "Uploading CV..." : "Processing with AI..."}
                      </h3>
                      <Progress value={uploadState.progress} className="w-full max-w-xs mx-auto mt-2" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <h3 className="font-semibold">
                        {isDragActive ? "Drop CV here" : "Upload Candidate CV"}
                      </h3>
                      <p className="text-gray-600">
                        Drag and drop or click to select PDF, DOCX, or TXT files
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Maximum file size: 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {uploadState.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadState.error}</AlertDescription>
                </Alert>
              )}

              {acceptedFiles.length > 0 && !uploadState.success && (
                <div className="text-sm text-gray-600">
                  <p>Selected file: {acceptedFiles[0].name}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="linkedin" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="linkedin-url">LinkedIn Profile URL</Label>
                <Input
                  id="linkedin-url"
                  type="url"
                  placeholder="https://www.linkedin.com/in/candidate-name"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  disabled={uploadState.processing}
                />
              </div>

              <Button 
                onClick={handleLinkedinSubmit}
                disabled={!linkedinUrl.trim() || uploadState.processing}
                className="w-full"
              >
                {uploadState.processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing LinkedIn Profile...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Import from LinkedIn
                  </>
                )}
              </Button>

              {uploadState.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadState.error}</AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={manualData.name}
                  onChange={(e) => setManualData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={uploadState.processing}
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={manualData.email}
                  onChange={(e) => setManualData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={uploadState.processing}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={manualData.phone}
                  onChange={(e) => setManualData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={uploadState.processing}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={manualData.location}
                  onChange={(e) => setManualData(prev => ({ ...prev, location: e.target.value }))}
                  disabled={uploadState.processing}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                placeholder="JavaScript, React, Node.js, Sales, Marketing"
                value={manualData.skills}
                onChange={(e) => setManualData(prev => ({ ...prev, skills: e.target.value }))}
                disabled={uploadState.processing}
              />
            </div>

            <div>
              <Label htmlFor="experience">Experience Summary</Label>
              <Textarea
                id="experience"
                placeholder="Brief summary of work experience..."
                value={manualData.experience}
                onChange={(e) => setManualData(prev => ({ ...prev, experience: e.target.value }))}
                disabled={uploadState.processing}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="summary">Professional Summary</Label>
              <Textarea
                id="summary"
                placeholder="Professional summary or bio..."
                value={manualData.summary}
                onChange={(e) => setManualData(prev => ({ ...prev, summary: e.target.value }))}
                disabled={uploadState.processing}
                rows={3}
              />
            </div>

            <Button 
              onClick={handleManualSubmit}
              disabled={!manualData.name || !manualData.email || uploadState.processing}
              className="w-full"
            >
              {uploadState.processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Candidate...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Create Candidate Profile
                </>
              )}
            </Button>

            {uploadState.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadState.error}</AlertDescription>
              </Alert>
            )}

            {uploadState.success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Candidate created successfully! Match Score: {uploadState.candidate?.match_score}%
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
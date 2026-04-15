"use client"

import React, { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, User, CheckCircle, AlertCircle, Loader2, X } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface InviteCandidatesModalProps {
  isOpen?: boolean
  onClose?: () => void
  jobId: string
  jobTitle?: string
  onCandidateAdded?: (candidate: any) => void
  onUploadCompleted?: (completedCount: number) => void
  trigger?: React.ReactNode
}

interface FileProcessingState {
  file: File
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  candidate?: any
  error?: string
}

interface UploadState {
  processing: boolean
  files: FileProcessingState[]
  completedCount: number
  errorCount: number
  overallProgress: number
}

function InviteCandidatesModal({
  isOpen = false,
  onClose,
  jobId,
  jobTitle = "Job Position",
  onCandidateAdded,
  onUploadCompleted,
  trigger
}: InviteCandidatesModalProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(isOpen)
  const [activeTab, setActiveTab] = useState("upload")
  const [uploadState, setUploadState] = useState<UploadState>({
    processing: false,
    files: [],
    completedCount: 0,
    errorCount: 0,
    overallProgress: 0
  })

  // Handle external state changes
  React.useEffect(() => {
    if (isOpen !== undefined) {
      setOpen(isOpen)
    }
  }, [isOpen])

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      setOpen(false)
    }
    resetState()
  }

  const resetState = () => {
    setUploadState({
      processing: false,
      files: [],
      completedCount: 0,
      errorCount: 0,
      overallProgress: 0
    })
  }

  const removeFile = (index: number) => {
    setUploadState(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }))
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    console.log(`🚀 Starting processing of ${acceptedFiles.length} CV files`)

    // Initialize file processing states
    const fileStates: FileProcessingState[] = acceptedFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0
    }))

    setUploadState({
      processing: true,
      files: fileStates,
      completedCount: 0,
      errorCount: 0,
      overallProgress: 0
    })

    try {
      // Process files sequentially to avoid overwhelming the API
      for (let i = 0; i < fileStates.length; i++) {
        const fileState = fileStates[i]
        
        console.log(`📄 Processing file ${i + 1}/${fileStates.length}: ${fileState.file.name}`)
        
        // Update file status to processing
        setUploadState(prev => ({
          ...prev,
          files: prev.files.map((f, index) => 
            index === i ? { ...f, status: 'processing', progress: 10 } : f
          )
        }))

        try {
          // Step 1: Parse CV with enhanced API
          const parseResult = await processSingleCV(fileState.file, jobId, (progress) => {
            setUploadState(prev => ({
              ...prev,
              files: prev.files.map((f, index) => 
                index === i ? { ...f, progress } : f
              )
            }))
          })

          if (parseResult.success) {
            console.log(`✅ Successfully processed: ${parseResult.candidate.name}`)
            
            // Update file state with success
            setUploadState(prev => ({
              ...prev,
              files: prev.files.map((f, index) => 
                index === i ? { 
                  ...f, 
                  status: 'completed', 
                  progress: 100,
                  candidate: parseResult.candidate
                } : f
              ),
              completedCount: prev.completedCount + 1
            }))

            // Notify parent component
            if (onCandidateAdded) {
              onCandidateAdded(parseResult.candidate)
            }

          } else {
            console.error(`❌ Failed to process: ${fileState.file.name}`)
            
            // Check if it's an API key issue
            if (parseResult.needsApiKey) {
              // Show API key setup instructions
              alert(`⚠️ ${parseResult.error}\n\nTo fix this:\n${parseResult.instructions.steps.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}\n\nAfter setting up the API key, refresh the page and try again.`)
            }
            
            // Update file state with error
            setUploadState(prev => ({
              ...prev,
              files: prev.files.map((f, index) => 
                index === i ? { 
                  ...f, 
                  status: 'error', 
                  progress: 0,
                  error: parseResult.needsApiKey ? 'API Key Required - See Instructions' : parseResult.error
                } : f
              ),
              errorCount: prev.errorCount + 1
            }))
          }

          // Update overall progress
          setUploadState(prev => ({
            ...prev,
            overallProgress: ((i + 1) / fileStates.length) * 100
          }))

        } catch (error) {
          console.error(`❌ Error processing ${fileState.file.name}:`, error)
          
          // Check if it's a network error that might indicate API issues
          const errorMessage = error instanceof Error ? error.message : 'Processing failed'
          const isApiError = errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')
          
          if (isApiError) {
            alert(`⚠️ API Configuration Issue\n\nPlease ensure your Gemini API key is properly configured:\n1. Visit https://aistudio.google.com/app/apikey\n2. Create a free API key\n3. Add GEMINI_API_KEY=your_key to .env.local\n4. Restart the application`)
          }
          
          setUploadState(prev => ({
            ...prev,
            files: prev.files.map((f, index) => 
              index === i ? { 
                ...f, 
                status: 'error', 
                progress: 0,
                error: isApiError ? 'API Key Configuration Required' : errorMessage
              } : f
            ),
            errorCount: prev.errorCount + 1,
            overallProgress: ((i + 1) / fileStates.length) * 100
          }))
        }

        // Small delay between files to prevent API overwhelming
        if (i < fileStates.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      // Final processing state with proper counting
      let finalCompletedCount = 0
      setUploadState(prev => {
        const completedCount = prev.files.filter(f => f.status === 'completed').length
        const errorCount = prev.files.filter(f => f.status === 'error').length
        finalCompletedCount = completedCount

        console.log(`🎉 Batch processing completed: ${completedCount} success, ${errorCount} errors`)

        // Notify parent about completion
        if (onUploadCompleted && completedCount > 0) {
          setTimeout(() => {
            console.log('🔄 Triggering onUploadCompleted callback with count:', completedCount)
            onUploadCompleted(completedCount)
          }, 500) // Small delay to ensure UI updates
        }

        return {
          ...prev,
          processing: false,
          overallProgress: 100,
          completedCount,
          errorCount
        }
      })

      // Auto-close modal after successful processing if no callback
      if (finalCompletedCount > 0 && !onUploadCompleted) {
        setTimeout(() => {
          handleClose()
        }, 3000)
      }

    } catch (batchError) {
      console.error('❌ Batch processing error:', batchError)
      setUploadState(prev => ({
        ...prev,
        processing: false
      }))
    }
  }, [jobId, onCandidateAdded, onUploadCompleted])

  // Process a single CV file
  async function processSingleCV(file: File, jobId: string, onProgress: (progress: number) => void) {
    // Continuous ticker: advances +3% every 3s up to 85%, so user always sees movement
    let tickValue = 10
    onProgress(tickValue)
    const progressTick = setInterval(() => {
      tickValue = Math.min(tickValue + 3, 85)
      onProgress(tickValue)
    }, 3000)

    try {
      // Resolve org ID
      let orgId = user?.app_metadata?.org_id || user?.user_metadata?.org_id || null
      if (!orgId) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const orgResponse = await fetch('/api/get-org-id', {
            headers: { 'Authorization': `Bearer ${session?.access_token}` }
          })
          if (orgResponse.ok) {
            const orgData = await orgResponse.json()
            orgId = orgData.orgId || null
          }
        } catch (err) {
          console.warn("get-org-id fetch error:", err)
        }
      }
      if (!orgId) {
        return { success: false, error: 'Organisation not found — please re-login' }
      }

      onProgress(25)

      // Step 1: Parse CV
      const formData = new FormData()
      formData.append('file', file)
      formData.append('jobId', jobId)
      formData.append('orgId', orgId)

      onProgress(35)

      const parseResponse = await fetch('/api/parse-cv', { method: 'POST', body: formData })
      const parseResult = await parseResponse.json()

      if (!parseResponse.ok || !parseResult.success) {
        return {
          success: false,
          error: parseResult.error || 'Failed to parse CV',
          needsApiKey: parseResult.needsApiKey,
          instructions: parseResult.instructions
        }
      }

      // Step 2: Add candidate to job with integrated matching
      let addResult = { success: false, candidateMatch: null }
      try {
        const addResponse = await fetch(`/api/jobs/${jobId}/add-candidate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateData: parseResult.candidate,
            extractedData: parseResult.extractedData
          })
        })
        addResult = await addResponse.json()
        if (!addResponse.ok) {
          console.warn('⚠️ Add candidate failed, continuing with basic data:', (addResult as any).error)
        }
      } catch (addError) {
        console.warn('⚠️ Add candidate API error, using fallback:', addError)
      }

      onProgress(100)

      const cm = addResult.candidateMatch as any
      return {
        success: true,
        candidate: {
          ...parseResult.candidate,
          match_score: addResult.success ? (cm?.score ?? 75) : (parseResult.extractedData?.matching?.overallScore || 75),
          skills_score: addResult.success ? (cm?.skill_matches?.skills_score ?? 0) : 0,
          experience_score: addResult.success ? (cm?.experience_match ?? cm?.skill_matches?.experience_score ?? 0) : 0,
          filename: file.name,
          strengths: addResult.success ? (Array.isArray(cm?.strengths) ? cm.strengths : []) : (parseResult.extractedData?.matching?.strengths || []),
          gaps: addResult.success ? (Array.isArray(cm?.weaknesses) ? cm.weaknesses : []) : (parseResult.extractedData?.matching?.gaps || []),
          recommendations: addResult.success ? (cm?.skill_matches?.recommendations || []) : [],
          job_match_created: addResult.success
        },
        candidateMatch: addResult.success ? addResult.candidateMatch : null
      }
    } finally {
      clearInterval(progressTick)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024,
    disabled: uploadState.processing
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => val ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-2">
            <User className="h-4 w-4" />
            Invite Candidates
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Invite Candidates to: {jobTitle}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload CVs</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn URL</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* Upload Area */}
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
                uploadState.processing && "cursor-not-allowed opacity-50"
              )}
            >
              <input {...getInputProps()} />
              
              <div className="space-y-3">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <h3 className="font-semibold text-lg">
                    {isDragActive ? "Drop CV files here" : "Upload Multiple CVs"}
                  </h3>
                  <p className="text-gray-600">
                    Drag and drop up to 10 CV files (PDF, DOC, DOCX, TXT)
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Maximum file size: 10MB each • Real-time AI extraction
                  </p>
                </div>
              </div>
            </div>

            {/* Processing Status */}
            {uploadState.processing && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Processing CVs...</h4>
                  <span className="text-sm text-gray-500">
                    {uploadState.completedCount + uploadState.errorCount} / {uploadState.files.length}
                  </span>
                </div>
                <Progress value={uploadState.overallProgress} className="w-full" />
              </div>
            )}

            {/* File List */}
            {uploadState.files.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Files ({uploadState.files.length})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {uploadState.files.map((fileState, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(fileState.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{fileState.file.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500">
                              {Math.round(fileState.file.size / 1024)} KB
                            </p>
                            {fileState.candidate && (
                              <p className="text-xs text-green-600 font-medium">
                                → {fileState.candidate.name} ({fileState.candidate.match_score}% match)
                              </p>
                            )}
                            {fileState.error && (
                              <p className="text-xs text-red-600">{fileState.error}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {fileState.status === 'processing' && (
                        <div className="flex items-center gap-2">
                          <Progress value={fileState.progress} className="w-20" />
                          <span className="text-xs text-gray-500">{fileState.progress}%</span>
                        </div>
                      )}
                      
                      {fileState.status === 'pending' && !uploadState.processing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results Summary */}
            {!uploadState.processing && uploadState.files.length > 0 && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{uploadState.completedCount}</div>
                  <div className="text-sm text-gray-600">Successfully Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{uploadState.errorCount}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {!uploadState.processing && uploadState.completedCount > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  🎉 Successfully processed {uploadState.completedCount} CV{uploadState.completedCount > 1 ? 's' : ''} with real data extraction and job matching!
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="linkedin" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                LinkedIn URL processing is not yet implemented. Please use CV upload for now.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Manual entry is available in the existing interface. Use CV upload for automated data extraction.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export { InviteCandidatesModal }
export default InviteCandidatesModal
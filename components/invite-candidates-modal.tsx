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

interface InviteCandidatesModalProps {
  isOpen?: boolean
  onClose?: () => void
  jobId: string
  jobTitle?: string
  onCandidateAdded?: (candidate: any) => void
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
  trigger
}: InviteCandidatesModalProps) {
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
            
            // Update file state with error
            setUploadState(prev => ({
              ...prev,
              files: prev.files.map((f, index) => 
                index === i ? { 
                  ...f, 
                  status: 'error', 
                  progress: 0,
                  error: parseResult.error
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
          
          setUploadState(prev => ({
            ...prev,
            files: prev.files.map((f, index) => 
              index === i ? { 
                ...f, 
                status: 'error', 
                progress: 0,
                error: error instanceof Error ? error.message : 'Processing failed'
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

      // Final processing state
      setUploadState(prev => ({
        ...prev,
        processing: false,
        overallProgress: 100
      }))

      console.log(`🎉 Batch processing completed: ${uploadState.completedCount} success, ${uploadState.errorCount} errors`)

      // Auto-close modal after successful processing
      if (uploadState.completedCount > 0) {
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
  }, [jobId, onCandidateAdded, uploadState.completedCount, uploadState.errorCount])

  // Process a single CV file
  async function processSingleCV(file: File, jobId: string, onProgress: (progress: number) => void) {
    onProgress(20)

    // Step 1: Parse CV data
    const formData = new FormData()
    formData.append('file', file)
    formData.append('jobId', jobId)

    onProgress(40)

    const parseResponse = await fetch('/api/parse-cv', {
      method: 'POST',
      body: formData
    })

    const parseResult = await parseResponse.json()

    if (!parseResponse.ok || !parseResult.success) {
      throw new Error(parseResult.error || 'Failed to parse CV')
    }

    onProgress(70)

    // Step 2: Create match
    const matchResponse = await fetch('/api/match-candidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: parseResult.candidate.id,
        jobId: jobId,
        extractedData: parseResult.extractedData
      })
    })

    const matchResult = await matchResponse.json()

    onProgress(100)

    // Return combined result
    return {
      success: true,
      candidate: {
        ...parseResult.candidate,
        match_score: matchResult.success ? matchResult.match.overall_score : 75,
        filename: file.name
      },
      match: matchResult.success ? matchResult.match : null
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
    <Dialog open={open} onOpenChange={handleClose}>
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
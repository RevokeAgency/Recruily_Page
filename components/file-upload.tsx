"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, FileText, Check, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/contexts/language-context"

interface FileWithProgress {
  file: File
  progress: number
  status: "idle" | "uploading" | "success" | "error"
  message?: string
}

interface FileUploadProps {
  onUploadComplete: (files: File[]) => void
  acceptedFileTypes?: Record<string, string[]>
  maxFiles?: number
  maxSize?: number
  uploadText?: string
  uploadSubtext?: string
  isProcessing?: boolean
}

export default function FileUpload({
  onUploadComplete,
  acceptedFileTypes = {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "text/plain": [".txt"],
  },
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  uploadText,
  uploadSubtext,
  isProcessing = false,
}: FileUploadProps) {
  const { language } = useLanguage()
  const { toast } = useToast()
  const [files, setFiles] = useState<FileWithProgress[]>([])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Check if adding these files would exceed maxFiles
      if (files.length + acceptedFiles.length > maxFiles) {
        toast({
          title: language === "EN" ? "Too many files" : "Zu viele Dateien",
          description:
            language === "EN"
              ? `You can upload a maximum of ${maxFiles} files at once.`
              : `Sie können maximal ${maxFiles} Dateien auf einmal hochladen.`,
          variant: "destructive",
        })
        return
      }

      const newFiles = acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: "idle" as const,
      }))
      setFiles((prev) => [...prev, ...newFiles])
    },
    [files.length, language, maxFiles, toast],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize,
    maxFiles,
  })

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = () => {
    if (files.length === 0) return

    // Pass the files to the parent component
    onUploadComplete(files.map((f) => f.file))

    // Reset files after upload
    setFiles([])
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-teal-500 bg-teal-50" : "border-gray-300 hover:border-teal-500"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            {isDragActive
              ? language === "EN"
                ? "Drop the files here..."
                : "Dateien hier ablegen..."
              : uploadText ||
                (language === "EN"
                  ? "Drag & drop files here, or click to select files"
                  : "Dateien hier ablegen oder klicken, um Dateien auszuwählen")}
          </p>
          <p className="text-xs text-muted-foreground">
            {uploadSubtext ||
              (language === "EN"
                ? `PDF, DOC, DOCX and TXT files only (max ${maxSize / 1024 / 1024}MB)`
                : `Nur PDF-, DOC-, DOCX- und TXT-Dateien (max. ${maxSize / 1024 / 1024}MB)`)}
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{language === "EN" ? "Files to upload" : "Hochzuladende Dateien"}</p>
          <div className="max-h-[200px] overflow-y-auto space-y-2">
            {files.map((fileWithProgress, index) => (
              <div key={index} className="flex items-center justify-between rounded-md border p-2">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileWithProgress.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(fileWithProgress.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {fileWithProgress.status === "idle" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        removeFile(index)
                      }}
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  )}
                  {fileWithProgress.status === "uploading" && (
                    <div className="w-16">
                      <Progress value={fileWithProgress.progress} className="h-1" />
                    </div>
                  )}
                  {fileWithProgress.status === "success" && <Check className="h-5 w-5 text-green-500" />}
                  {fileWithProgress.status === "error" && (
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-1" />
                      <span className="text-xs text-red-500 max-w-[150px] truncate">
                        {fileWithProgress.message || "Error"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || isProcessing}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {language === "EN" ? "Processing..." : "Wird verarbeitet..."}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {language === "EN" ? "Upload & Process" : "Hochladen & Verarbeiten"}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

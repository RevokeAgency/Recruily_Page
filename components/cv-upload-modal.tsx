"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/language-context"
import { CVUploadEnhanced } from "./cv-upload-enhanced"
import { Upload } from "lucide-react"

interface JobData {
  id: string
  title: string
  description: string
  requirements: string[]
  skills: string[]
  location?: string
  experienceLevel?: string
}

interface CVUploadModalProps {
  jobId?: string
  jobData?: JobData
  onComplete?: () => void
  trigger?: React.ReactNode
  maxFiles?: number
}

export function CVUploadModal({ jobId, jobData, onComplete, trigger, maxFiles = 10 }: CVUploadModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { language } = useLanguage()

  const handleComplete = () => {
    if (onComplete) {
      onComplete()
    }
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <Upload className="mr-2 h-4 w-4" />
            {language === "EN" ? "Upload CVs" : "CVs hochladen"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-slate-50 border-0 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-slate-200">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl shadow-lg">
              <Upload className="h-6 w-6 text-white" />
            </div>
            {language === "EN" ? "Upload Candidate CVs" : "Kandidaten-CVs hochladen"}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          <CVUploadEnhanced jobId={jobId} jobData={jobData} onComplete={handleComplete} maxFiles={maxFiles} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

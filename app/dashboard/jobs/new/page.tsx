"use client"
import { JobDescriptionUploader } from "@/components/job-description-uploader"

export default function NewJobPage() {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h1 className="text-2xl font-bold tracking-tight">Create New Job</h1>
        <JobDescriptionUploader />
      </div>
    </div>
  )
}

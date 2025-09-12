"use client"
import dynamic from "next/dynamic"
import { Suspense } from "react"

// Dynamically import the wizard to improve loading performance
const JobCreationWizard = dynamic(() => import("@/components/job-creation-wizard"), {
  loading: () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4 mx-auto"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-8 mx-auto"></div>
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="w-16 h-0.5 bg-gray-200 mx-4"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="w-16 h-0.5 bg-gray-200 mx-4"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-6">
                <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-3"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
})

export default function NewJobPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job creation wizard...</p>
        </div>
      </div>
    }>
      <JobCreationWizard />
    </Suspense>
  )
}

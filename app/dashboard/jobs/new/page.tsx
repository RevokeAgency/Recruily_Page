"use client"
import dynamic from "next/dynamic"
import { Suspense } from "react"

// Dynamically import the form to improve loading performance
const SimpleJobForm = dynamic(() => import("@/components/simple-job-form"), {
  loading: () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
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
          <p className="text-gray-600">Loading create job form...</p>
        </div>
      </div>
    }>
      <SimpleJobForm />
    </Suspense>
  )
}

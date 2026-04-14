"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { v4 as uuidv4 } from "uuid"
import { supabase } from "@/lib/supabase.client"
import { useAuth } from "@/contexts/auth-context"

export interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  description: string
  requirements: string[]
  technical_skills: string
  experience_level: string
  salary_range?: string
  posted_date: string
  status: "active" | "paused" | "closed"
  applications_count: number
  matches_count: number
  organization_id?: string
  created_at?: string
  updated_at?: string
  source_type?: "manual" | "url_scraping" | "file_upload"
  source_url?: string
  source_filename?: string
}

// Use centralized Supabase client

// Helper function to load jobs from localStorage with multiple fallback keys
const loadJobsFromStorage = (orgId: string): Job[] => {
  if (typeof window === "undefined") return []

  const possibleKeys = [
    "recruitify_jobs",
    `recruitify_jobs_${orgId}`,
    "recruitify_jobs_sample",
    "recruitify_jobs_office_example_com",
  ]

  let allJobs: any[] = []

  for (const key of possibleKeys) {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          console.log(`Found ${parsed.length} jobs in ${key}`)

          // Transform API format to our Job interface
          const transformedJobs = parsed.map((job: any) => ({
            id: job.id,
            title: job.title || "Untitled Job",
            company: job.company || "Company",
            location: job.location || "Remote",
            type: job.job_type || job.type || "Full-time",
            description: job.description || "",
            requirements: Array.isArray(job.requirements)
              ? job.requirements
              : job.requirements
                ? job.requirements.split("\n").filter(Boolean)
                : [],
            technical_skills: job.technical_skills || job.skills || "",
            experience_level: job.experience_level || "Mid-level",
            salary_range: job.salary_range || job.salaryRange,
            posted_date: job.created_at
              ? new Date(job.created_at).toISOString().split("T")[0]
              : job.posted_date || new Date().toISOString().split("T")[0],
            status: job.status || "active",
            applications_count: job.applications_count || 0,
            matches_count: job.matches_count || 0,
            organization_id: job.organisation_id || job.organization_id,
            created_at: job.created_at,
            updated_at: job.updated_at,
          }))

          // Merge without duplicates
          const newJobs = transformedJobs.filter((job: Job) => !allJobs.some((existing) => existing.id === job.id))
          allJobs = [...allJobs, ...newJobs]
        }
      }
    } catch (e) {
      console.error(`Error parsing ${key}:`, e)
    }
  }

  console.log(`📋 Total loaded ${allJobs.length} jobs from localStorage`)
  return allJobs
}

// Helper function to save jobs to localStorage
const saveJobsToStorage = (jobs: Job[], orgId: string): void => {
  if (typeof window === "undefined") return

  try {
    // Save to multiple keys for redundancy
    const keys = ["recruitify_jobs", `recruitify_jobs_${orgId}`]

    for (const key of keys) {
      localStorage.setItem(key, JSON.stringify(jobs))
    }
    console.log(`💾 Saved ${jobs.length} jobs to localStorage`)
  } catch (error) {
    console.error("Error saving jobs to localStorage:", error)
  }
}

// Mock data for fallback
const createMockJobs = (): Job[] => [
  {
    id: "job_1753952346309_960",
    title: "Senior Frontend Developer",
    company: "TechCorp Solutions",
    location: "San Francisco, CA",
    type: "Full-time",
    description:
      "We are looking for a Senior Frontend Developer to join our dynamic team. You will be responsible for developing user-facing web applications using modern JavaScript frameworks.",
    requirements: [
      "5+ years of experience in frontend development",
      "Expert knowledge of React, TypeScript, and modern CSS",
      "Experience with state management libraries (Redux, Zustand)",
      "Strong understanding of responsive design principles",
      "Experience with testing frameworks (Jest, Cypress)",
    ],
    technical_skills: "React, TypeScript, JavaScript, HTML5, CSS3, Redux, Next.js, Tailwind CSS, Git, Webpack",
    experience_level: "Senior",
    salary_range: "$120,000 - $160,000",
    posted_date: "2024-01-15",
    status: "active",
    applications_count: 24,
    matches_count: 8,
    organization_id: "org_1",
  },
  {
    id: "job_1753952346310_961",
    title: "Marketing Manager",
    company: "Growth Dynamics",
    location: "New York, NY",
    type: "Full-time",
    description:
      "Join our marketing team as a Marketing Manager to drive brand awareness and lead generation through innovative campaigns and strategic partnerships.",
    requirements: [
      "3+ years of marketing experience",
      "Experience with digital marketing campaigns",
      "Strong analytical and project management skills",
      "Knowledge of marketing automation tools",
      "Excellent communication and leadership abilities",
    ],
    technical_skills: "Google Analytics, HubSpot, Salesforce, Adobe Creative Suite, Social Media Management, SEO, SEM",
    experience_level: "Mid-level",
    salary_range: "$80,000 - $110,000",
    posted_date: "2024-01-12",
    status: "active",
    applications_count: 18,
    matches_count: 6,
    organization_id: "org_1",
  },
]

export function useJobs(organisationId?: string) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Memoize the organization ID to prevent unnecessary re-renders
  const orgId = useMemo(
    () => organisationId || user?.app_metadata?.org_id || "local",
    [organisationId, user],
  )

  // Load jobs function
  const loadJobs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("📋 Loading jobs for orgId:", orgId)

      // First, try to load from localStorage
      const storedJobs = loadJobsFromStorage(orgId)
      console.log(`Found ${storedJobs.length} stored jobs`)

      // Always set jobs, even if empty initially
      setJobs(storedJobs)

      // If no stored jobs, create mock data
      if (storedJobs.length === 0) {
        console.log("🎭 No stored jobs found, creating mock data...")
        const mockJobs = createMockJobs()
        setJobs(mockJobs)
        saveJobsToStorage(mockJobs, orgId)
        console.log(`✅ Created and stored ${mockJobs.length} mock jobs`)
      } else {
        console.log(`✅ Loaded ${storedJobs.length} jobs from localStorage`)
      }

      // Try to sync with API in the background (don't block UI)
      setTimeout(async () => {
        try {
          const response = await fetch("/api/jobs", {
            method: "GET",
            credentials: "include", // Session cookies sent automatically
          })
          if (!response.ok) return

          const result = await response.json()
          const apiJobs: any[] = result.jobs ?? []
          if (apiJobs.length === 0) return

          const transformedJobs = apiJobs.map((job: any) => ({
            id: job.id,
            title: job.title,
            company: job.company || "Company",
            location: job.location || "Remote",
            type: job.employment_type || "Full-time",
            description: job.description || "",
            requirements: Array.isArray(job.requirements)
              ? job.requirements
              : job.requirements?.split("\n").filter(Boolean) || [],
            technical_skills: Array.isArray(job.skills) ? job.skills.join(", ") : job.skills || "",
            experience_level: job.experience_level || "Mid-level",
            salary_range:
              job.salary_min && job.salary_max
                ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                : undefined,
            posted_date: job.created_at
              ? new Date(job.created_at).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            status: job.status === "open" ? "active" : job.status || "active",
            applications_count: 0,
            matches_count: 0,
            organization_id: job.organisation_id,
            created_at: job.created_at,
            updated_at: job.updated_at,
          }))

          setJobs(transformedJobs)
          saveJobsToStorage(transformedJobs, orgId)
          console.log(`✅ Synced ${transformedJobs.length} jobs from API`)
        } catch (err) {
          console.warn("⚠️ API sync failed, using localStorage data:", err)
        }
      }, 100) // Small delay to not block initial render
    } catch (error: any) {
      console.error("❌ Error loading jobs:", error)
      setError(error.message || "Failed to load jobs")

      // Even on error, try to provide some jobs
      const fallbackJobs = loadJobsFromStorage(orgId)
      if (fallbackJobs.length === 0) {
        const mockJobs = createMockJobs()
        setJobs(mockJobs)
        saveJobsToStorage(mockJobs, orgId)
      } else {
        setJobs(fallbackJobs)
      }
    } finally {
      setLoading(false)
    }
  }, [orgId])

  // Match candidates function
  const matchCandidates = useCallback(
    async (jobId: string): Promise<void> => {
      try {
        console.log("🎯 Matching candidates for job:", jobId)

        const response = await fetch("/api/jobs/match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ jobId }),
        })

        if (!response.ok) {
          throw new Error("Failed to match candidates")
        }

        const result = await response.json()
        console.log(`✅ Successfully matched ${result.count} candidates`)

        // Update the job's matches count
        setJobs((prevJobs) => {
          const updatedJobs = prevJobs.map((job) => (job.id === jobId ? { ...job, matches_count: result.count } : job))
          saveJobsToStorage(updatedJobs, orgId)
          return updatedJobs
        })
      } catch (error: any) {
        console.error("❌ Error matching candidates:", error)
        throw new Error(error.message || "Failed to match candidates")
      }
    },
    [orgId],
  )

  // Add job function
  const createJob = useCallback(
    async (jobData: Partial<Job>): Promise<Job> => {
      try {
        console.log("➕ Creating job:", jobData.title)

        const jobId = uuidv4()

        const newJobData = {
          id: jobId,
          title: jobData.title || "New Position",
          company: jobData.company || "Company Name",
          location: jobData.location || "Remote",
          job_type: jobData.type || "Full-time",
          description: jobData.description || "Job description",
          requirements: Array.isArray(jobData.requirements)
            ? jobData.requirements.join("\n")
            : jobData.requirements || "",
          technical_skills: jobData.technical_skills || "",
          skills: jobData.technical_skills || "",
          experience_level: jobData.experience_level || "Mid-level",
          salary_range: jobData.salary_range,
          status: "active",
          organisation_id: orgId,
          created_by: orgId,
          applications_count: 0,
          matches_count: 0,
          source_type: jobData.source_type || "manual",
          source_url: jobData.source_url,
          source_filename: jobData.source_filename,
        }

        // Create the job object in our interface format
        const newJob: Job = {
          id: jobId,
          title: jobData.title || "New Position",
          company: jobData.company || "Company Name",
          location: jobData.location || "Remote",
          type: jobData.type || "Full-time",
          description: jobData.description || "Job description",
          requirements: jobData.requirements || [],
          technical_skills: jobData.technical_skills || "",
          experience_level: jobData.experience_level || "Mid-level",
          salary_range: jobData.salary_range,
          posted_date: new Date().toISOString().split("T")[0],
          status: "active",
          applications_count: 0,
          matches_count: 0,
          organization_id: orgId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          source_type: jobData.source_type || "manual",
          source_url: jobData.source_url,
          source_filename: jobData.source_filename,
        }

        // Save via API route (session cookies handle auth)
        console.log("createJob fetch starting, orgId:", orgId)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)
        let response: Response
        try {
          response = await fetch("/api/jobs", {
            method: "POST",
            signal: controller.signal,
            credentials: "include", // Session cookies sent automatically
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(newJobData),
          })
        } catch (fetchErr: any) {
          clearTimeout(timeoutId)
          if (fetchErr.name === "AbortError") throw new Error("Job creation timed out — please try again")
          throw fetchErr
        }
        clearTimeout(timeoutId)
        console.log("createJob response status:", response.status)
        const responseText = await response.text()
        console.log("createJob response body:", responseText)
        const result = responseText ? JSON.parse(responseText) : {}
        if (!response.ok) {
          throw new Error(result.error || `Failed to create job (HTTP ${response.status})`)
        }

        // Use the UUID assigned by the API
        const finalJob: Job = { ...newJob, id: result.job.id }

        setJobs((prevJobs) => {
          const updatedJobs = [finalJob, ...prevJobs]
          saveJobsToStorage(updatedJobs, orgId)
          return updatedJobs
        })

        console.log("✅ Job created and saved to Supabase:", result.job.id)

        // Refresh from API in background so F5 always shows current Supabase state
        setTimeout(() => loadJobs(), 500)

        return finalJob
      } catch (error: any) {
        console.error("❌ Error creating job:", error)
        throw new Error(error.message || "Failed to create job")
      }
    },
    [orgId],
  )

  // Update job function
  const updateJob = useCallback(
    async (jobId: string, updates: Partial<Job>): Promise<Job> => {
      try {
        console.log("✏️ Updating job:", jobId)

        let updatedJob: Job | undefined

        // Update local state immediately
        setJobs((prevJobs) => {
          const updatedJobs = prevJobs.map((job) =>
            job.id === jobId ? { ...job, ...updates, updated_at: new Date().toISOString() } : job,
          )
          updatedJob = updatedJobs.find((job) => job.id === jobId)
          saveJobsToStorage(updatedJobs, orgId)
          return updatedJobs
        })

        if (!updatedJob) throw new Error("Job not found")

        // Try to update in Supabase in the background
        try {
          const updateData: any = {}
          if (updates.title) updateData.title = updates.title
          if (updates.company) updateData.company = updates.company
          if (updates.location) updateData.location = updates.location
          if (updates.type) updateData.job_type = updates.type
          if (updates.description) updateData.description = updates.description
          if (updates.requirements)
            updateData.requirements = Array.isArray(updates.requirements)
              ? updates.requirements.join("\n")
              : updates.requirements
          if (updates.technical_skills) updateData.technical_skills = updates.technical_skills
          if (updates.experience_level) updateData.experience_level = updates.experience_level
          if (updates.salary_range) updateData.salary_range = updates.salary_range
          if (updates.status) updateData.status = updates.status

          updateData.updated_at = new Date().toISOString()

          const updateResponse = await fetch(`/api/jobs/${jobId}`, {
            method: "PUT",
            credentials: "include", // Session cookies sent automatically
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateData),
          })
          if (!updateResponse.ok) {
            console.warn("⚠️ API update failed, job updated locally")
          } else {
            console.log("✅ Job also updated via API")
          }
        } catch (supabaseError) {
          console.warn("⚠️ API update failed, job updated locally:", supabaseError)
        }

        console.log("✅ Job updated:", updatedJob.title)
        return updatedJob
      } catch (error: any) {
        console.error("❌ Error updating job:", error)
        throw new Error(error.message || "Failed to update job")
      }
    },
    [orgId],
  )

  // Delete job function
  const deleteJob = useCallback(
    async (jobId: string): Promise<void> => {
      try {
        console.log("🗑️ Deleting job:", jobId)

        // Update local state immediately
        setJobs((prevJobs) => {
          const updatedJobs = prevJobs.filter((job) => job.id !== jobId)
          saveJobsToStorage(updatedJobs, orgId)
          return updatedJobs
        })

        // Try to delete from Supabase in the background
        try {
          const deleteResponse = await fetch(`/api/jobs/${jobId}`, {
            method: "DELETE",
            credentials: "include", // Session cookies sent automatically
          })
          if (!deleteResponse.ok) {
            console.warn("⚠️ API delete failed, job deleted locally")
          } else {
            console.log("✅ Job also deleted via API")
          }
        } catch (supabaseError) {
          console.warn("⚠️ API delete failed, job deleted locally:", supabaseError)
        }

        console.log("✅ Job deleted locally:", jobId)
      } catch (error: any) {
        console.error("❌ Error deleting job:", error)
        throw new Error(error.message || "Failed to delete job")
      }
    },
    [orgId],
  )

  const getJobById = useCallback(
    (jobId: string): Job | undefined => {
      return jobs.find((job) => job.id === jobId)
    },
    [jobs],
  )

  // Load jobs only once when the hook is initialized
  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  return {
    jobs,
    loading,
    error,
    createJob,
    updateJob,
    deleteJob,
    getJobById,
    matchCandidates,
    refetch: loadJobs,
  }
}

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"
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

      // Try to sync with Supabase in the background (don't block UI)
      setTimeout(async () => {
        try {
          const { data: supabaseJobs, error: supabaseError } = await supabase
            .from("jobs")
            .select("*")
            .order("created_at", { ascending: false })

          if (!supabaseError && supabaseJobs && supabaseJobs.length > 0) {
            console.log(`Found ${supabaseJobs.length} jobs in Supabase`)

            // Transform Supabase data to match our interface
            const transformedJobs = supabaseJobs.map((job: any) => ({
              id: job.id,
              title: job.title,
              company: job.company || "Company",
              location: job.location || "Remote",
              type: job.job_type || "Full-time",
              description: job.description || "",
              requirements: Array.isArray(job.requirements)
                ? job.requirements
                : job.requirements?.split("\n").filter(Boolean) || [],
              technical_skills: job.technical_skills || job.skills || "",
              experience_level: job.experience_level || "Mid-level",
              salary_range: job.salary_range,
              posted_date: job.created_at
                ? new Date(job.created_at).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
              status: job.status || "active",
              applications_count: job.applications_count || 0,
              matches_count: job.matches_count || 0,
              organization_id: job.organisation_id,
              created_at: job.created_at,
              updated_at: job.updated_at,
            }))

            // Merge with existing jobs, prioritizing Supabase data
            const mergedJobs = [...transformedJobs]

            // Add any localStorage-only jobs that aren't in Supabase
            storedJobs.forEach((localJob) => {
              if (!transformedJobs.find((supaJob) => supaJob.id === localJob.id)) {
                mergedJobs.push(localJob as any)
              }
            })

            setJobs(mergedJobs)
            saveJobsToStorage(mergedJobs, orgId)
            console.log(`✅ Synced with Supabase: ${mergedJobs.length} total jobs`)
          }
        } catch (supabaseError) {
          console.warn("⚠️ Supabase sync failed, using localStorage data:", supabaseError)
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

        const jobId = `job_${Date.now()}_${Math.floor(Math.random() * 1000)}`

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

        // Update local state immediately
        setJobs((prevJobs) => {
          const updatedJobs = [newJob, ...prevJobs]
          saveJobsToStorage(updatedJobs, orgId)
          return updatedJobs
        })

        // Try to save to Supabase in the background
        try {
          const { data: savedJob, error: supabaseError } = await (supabase as any)
            .from("jobs")
            .insert(newJobData)
            .select()
            .single()

          if (supabaseError) {
            console.warn("⚠️ Supabase save failed, job saved locally:", supabaseError.message)
          } else {
            console.log("✅ Job also saved to Supabase:", savedJob.id)
          }
        } catch (supabaseError) {
          console.warn("⚠️ Supabase save failed, job saved locally:", supabaseError)
        }

        console.log("✅ Job created:", newJob.id)
        return newJob
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

          const { error: supabaseError } = await (supabase as any).from("jobs").update(updateData).eq("id", jobId)

          if (supabaseError) {
            console.warn("⚠️ Supabase update failed, job updated locally:", supabaseError.message)
          } else {
            console.log("✅ Job also updated in Supabase")
          }
        } catch (supabaseError) {
          console.warn("⚠️ Supabase update failed, job updated locally:", supabaseError)
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
          const { error: supabaseError } = await (supabase as any).from("jobs").delete().eq("id", jobId)

          if (supabaseError) {
            console.warn("⚠️ Supabase delete failed, job deleted locally:", supabaseError.message)
          } else {
            console.log("✅ Job also deleted from Supabase")
          }
        } catch (supabaseError) {
          console.warn("⚠️ Supabase delete failed, job deleted locally:", supabaseError)
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

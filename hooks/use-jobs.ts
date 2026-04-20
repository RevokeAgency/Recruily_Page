"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { v4 as uuidv4 } from "uuid"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

export interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  description: string
  requirements: string | string[]
  technical_skills?: string
  skills?: string[]
  experience_level?: string
  salary_range?: string
  salary_min?: number
  salary_max?: number
  posted_date: string
  status: "active" | "open" | "paused" | "closed" | "draft"
  applications_count: number
  matches_count: number
  organization_id?: string
  created_at?: string
  updated_at?: string
  source_type?: "manual" | "url_scraping" | "file_upload"
}

// ─── Token helper ──────────────────────────────────────────────────────────────

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

// ─── Shape API job to local Job interface ──────────────────────────────────────

function toJob(raw: any): Job {
  return {
    id: raw.id,
    title: raw.title || "Untitled Job",
    company: raw.company || "",
    location: raw.location || "Remote",
    type: raw.employment_type || "full-time",
    description: raw.description || "",
    requirements: Array.isArray(raw.requirements)
      ? raw.requirements
      : raw.requirements?.split("\n").filter(Boolean) ?? [],
    technical_skills: Array.isArray(raw.skills) ? raw.skills.join(", ") : raw.skills || "",
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    experience_level: raw.experience_level || "",
    salary_range:
      raw.salary_min && raw.salary_max
        ? `€${raw.salary_min.toLocaleString()} – €${raw.salary_max.toLocaleString()}`
        : undefined,
    salary_min: raw.salary_min,
    salary_max: raw.salary_max,
    posted_date: raw.created_at
      ? new Date(raw.created_at).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    status: raw.status === "open" ? "active" : raw.status || "active",
    applications_count: 0,
    matches_count: 0,
    organization_id: raw.organisation_id,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useJobs(organisationId?: string) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const orgId = useMemo(
    () => organisationId || user?.app_metadata?.org_id || null,
    [organisationId, user],
  )

  // ── Load jobs from API ───────────────────────────────────────────────────────
  const loadJobs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await getToken()
      if (!token) {
        setJobs([])
        return
      }

      const response = await fetch("/api/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error(`Jobs API returned ${response.status}`)
      }

      const result = await response.json()
      const apiJobs: Job[] = (result.jobs ?? []).map(toJob)
      setJobs(apiJobs)
      console.log(`✅ Loaded ${apiJobs.length} jobs from API`)
    } catch (err: any) {
      console.error("❌ loadJobs error:", err)
      setError(err.message || "Failed to load jobs")
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Create job ───────────────────────────────────────────────────────────────
  const createJob = useCallback(async (jobData: Partial<Job>): Promise<Job> => {
    const token = await getToken()
    if (!token) throw new Error("Not authenticated")

    const payload = {
      title: jobData.title || "New Position",
      company: jobData.company || "",
      location: jobData.location || "Remote",
      employment_type: jobData.type || "full-time",
      description: jobData.description || "",
      requirements: Array.isArray(jobData.requirements)
        ? jobData.requirements.join("\n")
        : jobData.requirements || "",
      skills: jobData.skills || (jobData.technical_skills
        ? jobData.technical_skills.split(",").map(s => s.trim()).filter(Boolean)
        : []),
      experience_level: jobData.experience_level || null,
      salary_min: jobData.salary_min || null,
      salary_max: jobData.salary_max || null,
      status: "open",
    }

    console.log("➕ Creating job:", payload.title)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    let response: Response
    try {
      response = await fetch("/api/jobs", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
    } finally {
      clearTimeout(timeoutId)
    }

    const result = await response.json()
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`)

    const newJob = toJob(result.job)
    setJobs(prev => [newJob, ...prev])
    console.log("✅ Job created:", newJob.id)
    return newJob
  }, [])

  // ── Update job ───────────────────────────────────────────────────────────────
  const updateJob = useCallback(async (jobId: string, updates: Partial<Job>): Promise<Job> => {
    const token = await getToken()
    if (!token) throw new Error("Not authenticated")

    // Optimistic update
    let optimisticJob: Job | undefined
    setJobs(prev => {
      const next = prev.map(j => {
        if (j.id !== jobId) return j
        optimisticJob = { ...j, ...updates, updated_at: new Date().toISOString() }
        return optimisticJob
      })
      return next
    })
    if (!optimisticJob) throw new Error("Job not found")

    try {
      const response = await fetch("/api/jobs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: jobId, ...updates }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`)

      const updatedJob = toJob(result.job)
      setJobs(prev => prev.map(j => (j.id === jobId ? updatedJob : j)))
      console.log("✅ Job updated:", jobId)
      return updatedJob
    } catch (err: any) {
      // Revert optimistic update on failure
      await loadJobs()
      throw new Error(err.message || "Failed to update job")
    }
  }, [loadJobs])

  // ── Delete job ───────────────────────────────────────────────────────────────
  const deleteJob = useCallback(async (jobId: string): Promise<void> => {
    const token = await getToken()
    if (!token) throw new Error("Not authenticated")

    // Optimistic delete
    setJobs(prev => prev.filter(j => j.id !== jobId))

    try {
      const response = await fetch(`/api/jobs?id=${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`)
      console.log("✅ Job deleted:", jobId)
    } catch (err: any) {
      // Revert optimistic delete on failure
      await loadJobs()
      throw new Error(err.message || "Failed to delete job")
    }
  }, [loadJobs])

  // ── Get job by ID ────────────────────────────────────────────────────────────
  const getJobById = useCallback(
    (jobId: string): Job | undefined => jobs.find(j => j.id === jobId),
    [jobs],
  )

  // ── Match candidates (stub — kept for compatibility) ─────────────────────────
  const matchCandidates = useCallback(async (jobId: string): Promise<void> => {
    console.log("🎯 matchCandidates called for:", jobId)
    // Matching is now triggered per-CV via /api/matches/create
  }, [])

  // ── Listen for external job updates ─────────────────────────────────────────
  useEffect(() => {
    const handler = () => loadJobs()
    window.addEventListener("jobsUpdated", handler)
    return () => window.removeEventListener("jobsUpdated", handler)
  }, [loadJobs])

  // ── Initial load ─────────────────────────────────────────────────────────────
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

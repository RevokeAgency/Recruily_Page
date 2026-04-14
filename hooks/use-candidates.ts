"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { isSupabaseConfigured } from "@/lib/env"

interface Candidate {
  id: string
  name: string
  email: string
  phone?: string
  position: string
  experience: string
  skills: string[]
  summary: string
  location?: string
  education: string[]
  certifications: string[]
  languages: string[]
  match: number
  status: string
  applied: string
  jobId?: string
  source?: string
  yearsOfExperience?: number
  workExperience?: any[]
  job_title?: string
  experience_level?: string
  created_at?: string
  added_date?: string
  avatar?: string
}

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

export function useCandidates(organisationId?: string) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const orgId = useMemo(() => organisationId || null, [organisationId])

  const loadCandidates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!isSupabaseConfigured()) {
        // Fallback: load from localStorage
        try {
          const stored = localStorage.getItem("recruitify_candidates")
          const local: Candidate[] = stored ? JSON.parse(stored) : []
          setCandidates(local)
        } catch {
          setCandidates([])
        }
        return
      }

      const token = await getToken()
      if (!token) {
        setCandidates([])
        return
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      try {
        const response = await fetch("/api/candidates", {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        })
        const result = await response.json()
        if (result?.success && Array.isArray(result.candidates)) {
          const mapped: Candidate[] = result.candidates.map((c: any) => ({
            id: c.id,
            name: c.name || "Unknown Candidate",
            email: c.email,
            phone: c.phone,
            position: "Unknown Position",
            experience: c.experience_years ? `${c.experience_years} years` : "Not specified",
            skills: Array.isArray(c.skills) ? c.skills : [],
            summary: c.summary || "No summary available",
            location: c.location,
            education: Array.isArray(c.education) ? c.education : [],
            certifications: Array.isArray(c.certifications) ? c.certifications : [],
            languages: Array.isArray(c.languages) ? c.languages : ["English"],
            match: 0,
            status: c.status || "Applied",
            applied: c.created_at
              ? new Date(c.created_at).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            source: "Database",
            yearsOfExperience: c.experience_years || 0,
            created_at: c.created_at,
          }))
          setCandidates(mapped)
        } else {
          setCandidates([])
        }
      } finally {
        clearTimeout(timeout)
      }
    } catch (error: any) {
      console.error("❌ Error loading candidates:", error)
      setError(error.message || "Failed to load candidates")
      setCandidates([])
    } finally {
      setLoading(false)
    }
  }, [orgId])

  const updateCandidateStatus = useCallback(
    async (candidateId: string, newStatus: string): Promise<void> => {
      try {
        // Optimistic update
        setCandidates((prev) =>
          prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c)),
        )

        const token = await getToken()
        if (token) {
          await fetch("/api/candidates", {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: candidateId, status: newStatus }),
          })
        }
      } catch (error: any) {
        console.error("❌ Error updating candidate status:", error)
        throw new Error(error.message || "Failed to update candidate status")
      }
    },
    [],
  )

  const updateCandidate = useCallback(
    async (id: string, updates: Partial<Candidate>) => {
      try {
        setCandidates((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        )

        const token = await getToken()
        if (token) {
          await fetch("/api/candidates", {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id, ...updates }),
          })
        }
      } catch (error: any) {
        console.error("❌ Error updating candidate:", error)
        throw error
      }
    },
    [],
  )

  const deleteCandidate = useCallback(
    async (id: string) => {
      try {
        setCandidates((prev) => prev.filter((c) => c.id !== id))

        const token = await getToken()
        if (token) {
          await fetch(`/api/candidates?id=${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          })
        }
      } catch (error: any) {
        console.error("❌ Error deleting candidate:", error)
        throw error
      }
    },
    [],
  )

  const addCandidate = useCallback(
    async (candidate: Candidate) => {
      const newCandidate: Candidate = {
        ...candidate,
        id: candidate.id || `candidate_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        applied: candidate.applied || new Date().toISOString().split("T")[0],
        status: candidate.status || "Applied",
        job_title: candidate.position,
        experience_level: candidate.experience_level || "Mid-level",
        created_at: new Date().toISOString(),
      }

      setCandidates((prev) => [newCandidate, ...prev])
      return newCandidate
    },
    [],
  )

  const getCandidatesByJob = useCallback(
    (jobId: string): Candidate[] => candidates.filter((c) => c.jobId === jobId),
    [candidates],
  )

  const getCandidatesByStatus = useCallback(
    (status: string): Candidate[] => candidates.filter((c) => c.status === status),
    [candidates],
  )

  useEffect(() => {
    const handleCandidatesUpdated = () => {
      loadCandidates()
    }
    window.addEventListener("candidatesUpdated", handleCandidatesUpdated)
    return () => window.removeEventListener("candidatesUpdated", handleCandidatesUpdated)
  }, [loadCandidates])

  useEffect(() => {
    loadCandidates()
  }, [loadCandidates])

  return {
    candidates,
    loading,
    error,
    updateCandidateStatus,
    getCandidatesByJob,
    getCandidatesByStatus,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    refetch: loadCandidates,
  }
}

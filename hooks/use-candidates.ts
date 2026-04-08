"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"
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

export function useCandidates(organisationId?: string) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoize the orgId to prevent infinite loops
  const orgId = useMemo(() => organisationId || null, [organisationId])

  const loadCandidates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("👥 Loading candidates...")

      // Fetch candidates via API (uses service role to bypass RLS)
      let supabaseCandidates: Candidate[] = []
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Candidates fetch timed out")), 8000)
        )
        const fetchPromise = fetch("/api/candidates", {
          headers: { "Authorization": `Bearer ${session?.access_token}` }
        }).then(r => r.json())
        const result = await Promise.race([fetchPromise, timeoutPromise]) as any

        if (result?.success && Array.isArray(result.candidates)) {
          supabaseCandidates = result.candidates.map((candidate: any) => ({
            id: candidate.id,
            name: candidate.name || "Unknown Candidate",
            email: candidate.email,
            phone: candidate.phone,
            position: "Unknown Position",
            experience: candidate.experience_years ? `${candidate.experience_years} years` : "Not specified",
            skills: Array.isArray(candidate.skills) ? candidate.skills : [],
            summary: candidate.summary || "No summary available",
            location: candidate.location,
            education: Array.isArray(candidate.education) ? candidate.education : [],
            certifications: Array.isArray(candidate.certifications) ? candidate.certifications : [],
            languages: Array.isArray(candidate.languages) ? candidate.languages : ["English"],
            match: 0,
            status: "Applied",
            applied: candidate.created_at
              ? new Date(candidate.created_at).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            source: "Database",
            yearsOfExperience: candidate.experience_years || 0,
            created_at: candidate.created_at,
          }))
          console.log(`🗄️ Found ${supabaseCandidates.length} candidates`)
        } else {
          console.warn("⚠️ Candidates API returned no results:", result?.error)
        }
      } catch (fetchError) {
        console.warn("⚠️ Candidates fetch failed:", fetchError)
      }

      if (isSupabaseConfigured()) {
        setCandidates(supabaseCandidates)
        console.log(`✅ Loaded ${supabaseCandidates.length} candidates`)
      } else {
        // Supabase not configured at all — fall back to localStorage
        const storedCandidates = localStorage.getItem("recruitify_candidates")
        let localCandidates: Candidate[] = []
        if (storedCandidates) {
          try {
            localCandidates = JSON.parse(storedCandidates)
            console.log(`📦 Fallback: ${localCandidates.length} candidates from localStorage`)
          } catch (e) {
            console.warn("Could not parse localStorage candidates:", e)
          }
        }
        setCandidates(localCandidates)
        console.log(`✅ Loaded ${localCandidates.length} candidates from localStorage fallback`)
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
        console.log(`✏️ Updating candidate ${candidateId} status to ${newStatus}`)

        // Try to update in Supabase first
        // Use centralized Supabase client
        const { error: supabaseError } = await (supabase as any)
          .from("candidates")
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", candidateId)

        if (supabaseError) {
          console.warn("⚠️ Supabase update failed, using localStorage:", supabaseError.message)
        } else {
          console.log("✅ Candidate status updated in Supabase")
        }

        // Always update local state and localStorage
        const updatedCandidates = candidates.map((candidate) =>
          candidate.id === candidateId ? { ...candidate, status: newStatus } : candidate,
        )

        setCandidates(updatedCandidates)
        localStorage.setItem("recruitify_candidates", JSON.stringify(updatedCandidates))

        console.log(`✅ Updated candidate ${candidateId} status to ${newStatus}`)
      } catch (error: any) {
        console.error("❌ Error updating candidate status:", error)
        throw new Error(error.message || "Failed to update candidate status")
      }
    },
    [candidates],
  )

  const getCandidatesByJob = useCallback(
    (jobId: string): Candidate[] => {
      return candidates.filter((candidate) => candidate.jobId === jobId)
    },
    [candidates],
  )

  const getCandidatesByStatus = useCallback(
    (status: string): Candidate[] => {
      return candidates.filter((candidate) => candidate.status === status)
    },
    [candidates],
  )

  const addCandidate = useCallback(
    async (candidate: Candidate) => {
      try {
        // Add to local state immediately
        const newCandidate = {
          ...candidate,
          id: candidate.id || `candidate_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          applied: candidate.applied || new Date().toISOString().split("T")[0],
          status: candidate.status || "Applied",
          job_title: candidate.position,
          experience_level: candidate.experience_level || "Mid-level",
          created_at: new Date().toISOString(),
        }

        setCandidates((prev) => [newCandidate, ...prev])

        // Try to save to Supabase
        // Use centralized Supabase client
        const candidateData = {
          id: newCandidate.id,
          organisation_id: orgId,
          first_name: newCandidate.name.split(" ")[0] || newCandidate.name,
          last_name: newCandidate.name.split(" ").slice(1).join(" ") || "",
          email: newCandidate.email,
          phone: newCandidate.phone,
          location: newCandidate.location,
          status: newCandidate.status,
          notes: JSON.stringify({
            position: newCandidate.position,
            experience: newCandidate.experience,
            skills: newCandidate.skills,
            summary: newCandidate.summary,
            education: newCandidate.education,
            certifications: newCandidate.certifications,
            languages: newCandidate.languages,
            match: newCandidate.match,
            jobId: newCandidate.jobId,
            source: newCandidate.source,
            yearsOfExperience: newCandidate.yearsOfExperience,
            workExperience: newCandidate.workExperience,
            experience_level: newCandidate.experience_level,
            avatar: newCandidate.avatar,
          }),
          created_by: orgId || "",
        }

        const { error: supabaseError } = await (supabase as any).from("candidates").insert(candidateData)

        if (supabaseError) {
          console.warn("⚠️ Supabase save failed, using localStorage:", supabaseError)
        } else {
          console.log("✅ Candidate saved to Supabase")
        }

        // Always save to localStorage as backup
        const updatedCandidates = [newCandidate, ...candidates]
        localStorage.setItem("recruitify_candidates", JSON.stringify(updatedCandidates))

        return newCandidate
      } catch (err) {
        console.error("❌ Error adding candidate:", err)
        throw err
      }
    },
    [candidates, orgId],
  )

  const updateCandidate = useCallback(
    async (id: string, updates: Partial<Candidate>) => {
      try {
        setCandidates((prev) =>
          prev.map((candidate) => (candidate.id === id ? { ...candidate, ...updates } : candidate)),
        )

        // Update localStorage
        const updatedCandidates = candidates.map((candidate) =>
          candidate.id === id ? { ...candidate, ...updates } : candidate,
        )
        localStorage.setItem("recruitify_candidates", JSON.stringify(updatedCandidates))

        // Try to update in Supabase
        // Use centralized Supabase client
        const { error: supabaseError } = await (supabase as any)
          .from("candidates")
          .update({
            status: updates.status,
            notes: JSON.stringify({
              ...JSON.parse(localStorage.getItem(`candidate_${id}_notes`) || "{}"),
              ...updates,
            }),
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)

        if (supabaseError) {
          console.warn("⚠️ Supabase update failed:", supabaseError)
        }
      } catch (err) {
        console.error("❌ Error updating candidate:", err)
        throw err
      }
    },
    [candidates],
  )

  const deleteCandidate = useCallback(
    async (id: string) => {
      try {
        setCandidates((prev) => prev.filter((candidate) => candidate.id !== id))

        // Update localStorage
        const updatedCandidates = candidates.filter((candidate) => candidate.id !== id)
        localStorage.setItem("recruitify_candidates", JSON.stringify(updatedCandidates))

        // Try to delete from Supabase
        // Use centralized Supabase client
        const { error: supabaseError } = await (supabase as any).from("candidates").delete().eq("id", id)

        if (supabaseError) {
          console.warn("⚠️ Supabase delete failed:", supabaseError)
        }
      } catch (err) {
        console.error("❌ Error deleting candidate:", err)
        throw err
      }
    },
    [candidates],
  )

  // Listen for candidate updates from CV upload
  useEffect(() => {
    const handleCandidatesUpdated = () => {
      console.log("🔄 Candidates updated event received, reloading...")
      loadCandidates()
    }

    window.addEventListener("candidatesUpdated", handleCandidatesUpdated)

    return () => {
      window.removeEventListener("candidatesUpdated", handleCandidatesUpdated)
    }
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

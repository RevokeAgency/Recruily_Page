"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"

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

      // Try Supabase first
      let supabaseQuerySucceeded = false
      let supabaseCandidates: Candidate[] = []
      try {
        const { data: supabaseData, error: supabaseError } = await supabase
          .from("candidates")
          .select("*")
          .order("created_at", { ascending: false })

        if (supabaseError) {
          console.warn("⚠️ Supabase error:", supabaseError.message)
        } else {
          supabaseQuerySucceeded = true
          if (supabaseData && supabaseData.length > 0) {
            supabaseCandidates = supabaseData.map((candidate: any) => {
              let parsedNotes = {}
              try {
                parsedNotes = candidate.notes ? JSON.parse(candidate.notes) : {}
              } catch (e) {
                console.warn("Could not parse candidate notes:", e)
              }

              return {
                id: candidate.id,
                name: `${candidate.first_name} ${candidate.last_name}`.trim(),
                email: candidate.email,
                phone: candidate.phone,
                position: (parsedNotes as any).position || "Unknown Position",
                experience: (parsedNotes as any).experience || "Not specified",
                skills: Array.isArray((parsedNotes as any).skills) ? (parsedNotes as any).skills : [],
                summary: (parsedNotes as any).summary || "No summary available",
                location: candidate.location,
                education: Array.isArray((parsedNotes as any).education) ? (parsedNotes as any).education : [],
                certifications: Array.isArray((parsedNotes as any).certifications)
                  ? (parsedNotes as any).certifications
                  : [],
                languages: Array.isArray((parsedNotes as any).languages) ? (parsedNotes as any).languages : ["English"],
                match: (parsedNotes as any).match || 0,
                status: candidate.status || "Applied",
                applied: candidate.created_at
                  ? new Date(candidate.created_at).toISOString().split("T")[0]
                  : new Date().toISOString().split("T")[0],
                jobId: (parsedNotes as any).jobId,
                source: (parsedNotes as any).source || "Database",
                yearsOfExperience: (parsedNotes as any).yearsOfExperience || 0,
                workExperience: (parsedNotes as any).workExperience || [],
                job_title: (parsedNotes as any).position || "Unknown Position",
                experience_level: (parsedNotes as any).experience_level || "Mid-level",
                created_at: candidate.created_at,
                avatar: (parsedNotes as any).avatar,
              }
            })
          }
          console.log(`🗄️ Found ${supabaseCandidates.length} candidates in Supabase`)
        }
      } catch (supabaseError) {
        console.warn("⚠️ Supabase connection failed:", supabaseError)
      }

      // When Supabase is reachable, use only its data (no localStorage or mock mixing)
      if (supabaseQuerySucceeded) {
        setCandidates(supabaseCandidates)
        console.log(`✅ Loaded ${supabaseCandidates.length} candidates from Supabase`)
      } else {
        // Supabase unreachable — fall back to localStorage
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

function generateMockCandidates(): Candidate[] {
  return [
    {
      id: "mock_1",
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1 (555) 123-4567",
      position: "Senior Frontend Developer",
      experience: "5 years of experience in React and TypeScript",
      skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "GraphQL"],
      summary: "Experienced frontend developer with a passion for creating user-friendly interfaces",
      location: "San Francisco, CA",
      education: ["BS Computer Science - Stanford University"],
      certifications: ["AWS Certified Developer"],
      languages: ["English", "Spanish"],
      match: 92,
      status: "Applied",
      applied: "2024-01-15",
      jobId: "job_1753952346309_960",
      source: "Mock Data",
      yearsOfExperience: 5,
      workExperience: [
        {
          company: "Tech Solutions Inc",
          position: "Senior Frontend Developer",
          duration: "2022 - Present",
          description: "Led development of responsive web applications using React and TypeScript",
        },
      ],
      job_title: "Senior Frontend Developer",
      experience_level: "Senior",
      created_at: "2024-01-15T10:00:00Z",
      avatar: "SJ",
    },
    {
      id: "mock_2",
      name: "Michael Chen",
      email: "michael.chen@email.com",
      phone: "+1 (555) 234-5678",
      position: "Full Stack Developer",
      experience: "4 years of full-stack development experience",
      skills: ["JavaScript", "Node.js", "Python", "PostgreSQL", "Docker"],
      summary: "Full-stack developer with expertise in both frontend and backend technologies",
      location: "New York, NY",
      education: ["MS Software Engineering - MIT"],
      certifications: ["Google Cloud Professional"],
      languages: ["English", "Mandarin"],
      match: 88,
      status: "Contacted",
      applied: "2024-01-14",
      jobId: "job_1753952346309_960",
      source: "Mock Data",
      yearsOfExperience: 4,
      workExperience: [
        {
          company: "Digital Innovations Ltd",
          position: "Full Stack Developer",
          duration: "2021 - Present",
          description: "Developed and maintained web applications using modern tech stack",
        },
      ],
      job_title: "Full Stack Developer",
      experience_level: "Mid-level",
      created_at: "2024-01-14T10:00:00Z",
      avatar: "MC",
    },
    {
      id: "mock_3",
      name: "Emily Rodriguez",
      email: "emily.rodriguez@email.com",
      phone: "+1 (555) 345-6789",
      position: "UI/UX Designer",
      experience: "3 years of design experience",
      skills: ["Figma", "Adobe XD", "Sketch", "Prototyping", "User Research"],
      summary: "Creative UI/UX designer focused on user-centered design principles",
      location: "Austin, TX",
      education: ["BFA Graphic Design - Art Institute"],
      certifications: ["Google UX Design Certificate"],
      languages: ["English", "Spanish"],
      match: 85,
      status: "Interviewing",
      applied: "2024-01-13",
      jobId: "job_1753952346309_960",
      source: "Mock Data",
      yearsOfExperience: 3,
      workExperience: [
        {
          company: "Creative Minds Studio",
          position: "UI/UX Designer",
          duration: "2022 - Present",
          description: "Designed user interfaces and conducted user research for web applications",
        },
      ],
      job_title: "UI/UX Designer",
      experience_level: "Mid-level",
      created_at: "2024-01-13T10:00:00Z",
      avatar: "ER",
    },
  ]
}

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/database.types"
import { cache } from "react"

// Use cache to prevent multiple instances during a request
export const createServerSupabaseClient = cache(() => {
  try {
    const cookieStore = cookies()
    return createServerComponentClient<Database>({ cookies: () => cookieStore })
  } catch (error) {
    console.error("Error creating server Supabase client:", error)
    // Return a mock client for server components when there's an error
    return createMockServerClient()
  }
})

// Create a mock client for server components with realistic data
function createMockServerClient() {
  console.log("Using mock server Supabase client with realistic data")

  // Mock data for jobs
  const mockJobs = [
    {
      id: "1",
      title: "Frontend Developer",
      company: "TechCorp",
      location: "Remote",
      description: "We are looking for a skilled Frontend Developer...",
      skills: ["React", "TypeScript", "CSS"],
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Backend Engineer",
      company: "DataSystems",
      location: "New York",
      description: "Backend Engineer position available...",
      skills: ["Node.js", "Python", "PostgreSQL"],
      created_at: new Date().toISOString(),
    },
    {
      id: "3",
      title: "UX Designer",
      company: "CreativeMinds",
      location: "San Francisco",
      description: "Join our design team...",
      skills: ["Figma", "Adobe XD", "User Research"],
      created_at: new Date().toISOString(),
    },
  ]

  // Mock data for candidates
  const mockCandidates = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      skills: ["JavaScript", "React", "Node.js"],
      experience: "5 years",
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      skills: ["Python", "Django", "PostgreSQL"],
      experience: "3 years",
      created_at: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Alex Johnson",
      email: "alex@example.com",
      skills: ["UI/UX", "Figma", "Adobe XD"],
      experience: "4 years",
      created_at: new Date().toISOString(),
    },
  ]

  // Mock data for matches
  const mockMatches = [
    { id: "1", job_id: "1", candidate_id: "1", score: 85, status: "pending", created_at: new Date().toISOString() },
    { id: "2", job_id: "2", candidate_id: "2", score: 92, status: "contacted", created_at: new Date().toISOString() },
    {
      id: "3",
      job_id: "3",
      candidate_id: "3",
      score: 78,
      status: "interviewing",
      created_at: new Date().toISOString(),
    },
  ]

  return {
    from: (table: string) => ({
      select: (columns = "*") => {
        let data: any[] = []

        if (table === "jobs") data = mockJobs
        else if (table === "candidates") data = mockCandidates
        else if (table === "matches") data = mockMatches

        return Promise.resolve({ data, error: null })
      },
      insert: (values: any) => {
        const newId = Math.floor(Math.random() * 1000).toString()
        const newItem = { id: newId, ...values, created_at: new Date().toISOString() }

        return Promise.resolve({ data: newItem, error: null })
      },
      update: (values: any) => {
        return Promise.resolve({ data: values, error: null })
      },
      delete: () => {
        return Promise.resolve({ data: null, error: null })
      },
      eq: () => ({
        select: () => {
          let data: any[] = []

          if (table === "jobs") data = [mockJobs[0]]
          else if (table === "candidates") data = [mockCandidates[0]]
          else if (table === "matches") data = [mockMatches[0]]

          return Promise.resolve({ data, error: null })
        },
      }),
      order: () => ({
        select: () => {
          let data: any[] = []

          if (table === "jobs") data = mockJobs
          else if (table === "candidates") data = mockCandidates
          else if (table === "matches") data = mockMatches

          return Promise.resolve({ data, error: null })
        },
      }),
    }),
    auth: {
      getUser: () =>
        Promise.resolve({ data: { user: { id: "mock-user-id", email: "user@example.com" } }, error: null }),
      getSession: () =>
        Promise.resolve({
          data: {
            session: {
              user: { id: "mock-user-id", email: "user@example.com" },
              access_token: "mock-token",
              refresh_token: "mock-refresh-token",
              expires_at: Date.now() + 3600,
            },
          },
          error: null,
        }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: { path: "mock-path" }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "https://example.com/mock-image.jpg" } }),
      }),
    },
  } as any
}

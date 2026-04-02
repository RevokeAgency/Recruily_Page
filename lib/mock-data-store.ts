interface Job {
  id: string
  title: string
  company?: string
  location?: string
  job_type?: string
  status: string
  created_at: string
  updated_at: string
  description?: string
  requirements?: string
  organisation_id: string
  salary_range?: string
  technical_skills?: string
  benefits?: string
  application_deadline?: string | null
}

interface Candidate {
  id: string
  name: string
  email: string
  phone?: string
  position?: string
  experience?: string
  status: string
  match?: number
  location?: string
  avatar?: string
  applied?: string
  skills?: string[]
  jobId?: string
  summary?: string
  education?: any[]
  certifications?: string[]
  languages?: string[]
  fullProfile?: any
  organisation_id: string
  created_at: string
  updated_at: string
}

interface Match {
  id: string
  job_id: string
  candidate_id: string
  match_score: number
  status: string
  created_at: string
  organisation_id: string
}

const DEMO_ORG_ID = "demo-org"

class MockDataStore {
  private jobs: Job[] = []
  private candidates: Candidate[] = []
  private matches: Match[] = []

  constructor() {
    this.initializeData()
  }

  private initializeData() {
    // Initialize with some sample data
    const sampleJobs: Job[] = [
      {
        id: "job_1",
        title: "Senior Frontend Developer",
        company: "TechCorp",
        location: "Berlin, Germany",
        job_type: "full-time",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        description: "We are looking for a senior frontend developer with React experience.",
        requirements: "5+ years React, TypeScript, modern CSS",
        organisation_id: DEMO_ORG_ID,
        salary_range: "€60,000 - €80,000",
        technical_skills: "React, TypeScript, CSS, JavaScript",
        benefits: "Health insurance, flexible hours, remote work",
        application_deadline: null,
      },
      {
        id: "job_2",
        title: "Backend Engineer",
        company: "StartupXYZ",
        location: "Munich, Germany",
        job_type: "full-time",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        description: "Backend engineer position for a growing startup.",
        requirements: "Node.js, PostgreSQL, AWS experience",
        organisation_id: DEMO_ORG_ID,
        salary_range: "€55,000 - €75,000",
        technical_skills: "Node.js, PostgreSQL, AWS, Docker",
        benefits: "Equity, flexible hours, learning budget",
        application_deadline: null,
      },
    ]

    const sampleCandidates: Candidate[] = [
      {
        id: "candidate_1",
        name: "Anna Schmidt",
        email: "anna.schmidt@email.com",
        phone: "+49 123 456 789",
        position: "Frontend Developer",
        experience: "4 years",
        status: "Applied",
        match: 85,
        location: "Berlin, Germany",
        avatar: "AS",
        applied: "2024-01-15",
        skills: ["React", "TypeScript", "CSS", "JavaScript"],
        jobId: "job_1",
        summary: "Experienced frontend developer with strong React skills",
        organisation_id: DEMO_ORG_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "candidate_2",
        name: "Max Müller",
        email: "max.mueller@email.com",
        phone: "+49 987 654 321",
        position: "Full Stack Developer",
        experience: "6 years",
        status: "Reviewed",
        match: 92,
        location: "Munich, Germany",
        avatar: "MM",
        applied: "2024-01-14",
        skills: ["Node.js", "React", "PostgreSQL", "AWS"],
        jobId: "job_2",
        summary: "Full stack developer with backend focus",
        organisation_id: DEMO_ORG_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    this.jobs = sampleJobs
    this.candidates = sampleCandidates
    this.generateInitialMatches()
  }

  private generateInitialMatches() {
    this.matches = []
    this.jobs.forEach((job) => {
      const jobCandidates = this.candidates.filter((c) => c.jobId === job.id)
      jobCandidates.forEach((candidate) => {
        this.matches.push({
          id: `match_${job.id}_${candidate.id}`,
          job_id: job.id,
          candidate_id: candidate.id,
          match_score: candidate.match || 75,
          status: "pending",
          created_at: new Date().toISOString(),
          organisation_id: job.organisation_id,
        })
      })
    })
  }

  // Job methods
  getJobs(organisationId: string): Job[] {
    return this.jobs.filter((job) => job.organisation_id === organisationId)
  }

  getAllJobs(): Job[] {
    return this.jobs
  }

  getJobById(id: string): Job | undefined {
    return this.jobs.find((job) => job.id === id)
  }

  addJob(job: Job): Job {
    const newJob = {
      ...job,
      created_at: job.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.jobs.push(newJob)
    return newJob
  }

  updateJob(id: string, updates: Partial<Job>): Job | null {
    const index = this.jobs.findIndex((job) => job.id === id)
    if (index === -1) return null

    this.jobs[index] = {
      ...this.jobs[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    return this.jobs[index]
  }

  deleteJob(id: string): boolean {
    const index = this.jobs.findIndex((job) => job.id === id)
    if (index === -1) return false

    this.jobs.splice(index, 1)
    // Also remove related matches
    this.matches = this.matches.filter((match) => match.job_id !== id)
    return true
  }

  // Candidate methods
  getCandidates(organisationId: string): Candidate[] {
    return this.candidates.filter((candidate) => candidate.organisation_id === organisationId)
  }

  getCandidatesByJobId(jobId: string): Candidate[] {
    return this.candidates.filter((candidate) => candidate.jobId === jobId)
  }

  addCandidate(candidate: Candidate): Candidate {
    const newCandidate = {
      ...candidate,
      created_at: candidate.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.candidates.push(newCandidate)
    return newCandidate
  }

  updateCandidate(id: string, updates: Partial<Candidate>): Candidate | null {
    const index = this.candidates.findIndex((candidate) => candidate.id === id)
    if (index === -1) return null

    this.candidates[index] = {
      ...this.candidates[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    return this.candidates[index]
  }

  // Match methods
  getMatches(organisationId: string): Match[] {
    return this.matches.filter((match) => match.organisation_id === organisationId)
  }

  getMatchesForJob(jobId: string): Match[] {
    return this.matches.filter((match) => match.job_id === jobId)
  }

  generateMatchesForJob(jobId: string, organisationId: string): Match[] {
    const job = this.getJobById(jobId)
    if (!job) return []

    const candidates = this.getCandidates(organisationId)
    const newMatches: Match[] = []

    candidates.forEach((candidate) => {
      // Skip if match already exists
      const existingMatch = this.matches.find((m) => m.job_id === jobId && m.candidate_id === candidate.id)
      if (existingMatch) return

      // Generate a match score based on skills overlap
      const matchScore = this.calculateMatchScore(job, candidate)

      const match: Match = {
        id: `match_${jobId}_${candidate.id}_${Date.now()}`,
        job_id: jobId,
        candidate_id: candidate.id,
        match_score: matchScore,
        status: "pending",
        created_at: new Date().toISOString(),
        organisation_id: organisationId,
      }

      this.matches.push(match)
      newMatches.push(match)
    })

    return newMatches
  }

  private calculateMatchScore(job: Job, candidate: Candidate): number {
    // Simple matching algorithm based on skills
    const jobSkills = (job.technical_skills || "")
      .toLowerCase()
      .split(",")
      .map((s) => s.trim())
    const candidateSkills = (candidate.skills || []).map((s) => s.toLowerCase())

    if (jobSkills.length === 0 || candidateSkills.length === 0) {
      return Math.floor(Math.random() * 40) + 60 // Random score between 60-100
    }

    const matchingSkills = jobSkills.filter((skill) =>
      candidateSkills.some((cSkill) => cSkill.includes(skill) || skill.includes(cSkill)),
    )

    const matchPercentage = (matchingSkills.length / jobSkills.length) * 100
    return Math.min(Math.max(Math.floor(matchPercentage), 50), 100) // Ensure score is between 50-100
  }

  // Utility methods
  getStats(organisationId: string) {
    const jobs = this.getJobs(organisationId)
    const candidates = this.getCandidates(organisationId)
    const matches = this.getMatches(organisationId)

    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter((j) => j.status === "active").length,
      totalCandidates: candidates.length,
      totalMatches: matches.length,
      highMatches: matches.filter((m) => m.match_score >= 80).length,
    }
  }
}

// Export singleton instance
export const mockDataStore = new MockDataStore()

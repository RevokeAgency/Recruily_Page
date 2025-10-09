// Simple in-memory storage for uploaded candidates
// This is used when database is not available for demonstration purposes

interface CandidateMatch {
  id: string
  job_id: string
  candidate_id: string
  overall_score: number
  skills_score: number
  experience_score: number
  education_score: number
  languages_score: number
  certifications_score: number
  other_score: number
  strengths: string[]
  gaps: string[]
  recommendations: string[]
  created_at: string
  candidate: any
  demo_mode?: boolean
}

// Global in-memory storage
const candidateStore = new Map<string, CandidateMatch[]>()

export class CandidateStore {
  // Add a candidate match to a specific job
  static addCandidateToJob(jobId: string, candidateMatch: CandidateMatch): void {
    console.log(`📝 Adding candidate ${candidateMatch.candidate.name} to job ${jobId} in memory store`)
    
    if (!candidateStore.has(jobId)) {
      candidateStore.set(jobId, [])
    }
    
    const jobCandidates = candidateStore.get(jobId)!
    
    // Remove existing candidate with same ID if exists
    const existingIndex = jobCandidates.findIndex(c => c.candidate_id === candidateMatch.candidate_id)
    if (existingIndex !== -1) {
      jobCandidates.splice(existingIndex, 1)
    }
    
    // Add new candidate match
    jobCandidates.unshift(candidateMatch) // Add to beginning for latest first
    
    console.log(`✅ Candidate store updated. Job ${jobId} now has ${jobCandidates.length} candidates`)
  }

  // Get all candidates for a job
  static getCandidatesForJob(jobId: string): CandidateMatch[] {
    const candidates = candidateStore.get(jobId) || []
    console.log(`📖 Retrieved ${candidates.length} candidates from store for job ${jobId}`)
    return candidates
  }

  // Get all stored job IDs
  static getAllJobIds(): string[] {
    return Array.from(candidateStore.keys())
  }

  // Clear candidates for a job
  static clearJobCandidates(jobId: string): void {
    candidateStore.delete(jobId)
    console.log(`🗑️ Cleared candidates for job ${jobId}`)
  }

  // Get total candidate count across all jobs
  static getTotalCandidateCount(): number {
    let total = 0
    candidateStore.forEach(candidates => {
      total += candidates.length
    })
    return total
  }

  // Debug: List all stored data
  static debugStore(): void {
    console.log('🔍 Candidate Store Debug:')
    candidateStore.forEach((candidates, jobId) => {
      console.log(`  Job ${jobId}: ${candidates.length} candidates`)
      candidates.forEach(match => {
        console.log(`    - ${match.candidate.name} (${match.overall_score}% match)`)
      })
    })
  }
}

export default CandidateStore
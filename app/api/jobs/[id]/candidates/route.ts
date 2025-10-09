import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🔍 Fetching candidates for job:', params.id)
  
  try {
    // Check if environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('🔧 Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined'
    })
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('⚠️ Supabase credentials not available, using mock data')
      return generateMockCandidateData(params.id)
    }
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Fetch candidates with their match scores for this job
    const { data: matches, error: matchError } = await supabaseAdmin
      .from('job_matches')
      .select(`
        *,
        candidate:candidates (
          id,
          name,
          email,
          phone,
          location,
          summary,
          skills,
          experience,
          education,
          languages,
          certifications,
          experience_years,
          degree,
          university,
          linkedin_url,
          portfolio_url,
          github_url,
          resume_url,
          created_at,
          source,
          tags
        )
      `)
      .eq('job_id', params.id)
      .order('overall_score', { ascending: false })

    if (matchError) {
      console.error('❌ Error fetching job matches:', matchError)
      
      // Fallback: fetch all candidates and create mock matches
      const { data: candidates, error: candidateError } = await supabaseAdmin
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (candidateError) {
        throw candidateError
      }

      // Create mock matches for demo purposes
      const mockMatches = candidates.map((candidate, index) => ({
        id: `mock-${candidate.id}`,
        job_id: params.id,
        candidate_id: candidate.id,
        overall_score: Math.max(60, 95 - index * 3), // Decreasing scores from 95 to 60
        skills_score: Math.max(55, 90 - index * 2),
        experience_score: Math.max(50, 85 - index * 2),
        education_score: Math.max(40, 80 - index * 3),
        languages_score: Math.max(70, 85 - index * 1),
        certifications_score: Math.max(30, 75 - index * 4),
        other_score: Math.max(40, 70 - index * 2),
        strengths: generateStrengths(candidate),
        gaps: generateGaps(candidate),
        recommendations: generateRecommendations(candidate),
        created_at: candidate.created_at,
        candidate: candidate
      }))

      return NextResponse.json({
        success: true,
        candidates: mockMatches,
        total: mockMatches.length,
        message: 'Using demo candidate matches - job_matches table not found'
      })
    }

    console.log(`✅ Found ${matches.length} candidates for job ${params.id}`)

    return NextResponse.json({
      success: true,
      candidates: matches,
      total: matches.length
    })

  } catch (error: any) {
    console.error('❌ Error fetching candidates:', error)
    
    // If Supabase fails, fallback to mock data
    if (error.message?.includes('supabaseKey') || error.message?.includes('Invalid API key')) {
      console.warn('⚠️ Supabase error, falling back to mock data')
      return generateMockCandidateData(params.id)
    }
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch candidates',
      candidates: [],
      total: 0
    }, { status: 500 })
  }
}

// Generate mock candidate data when Supabase is not available
function generateMockCandidateData(jobId: string) {
  console.log('🎭 Generating mock candidate data for job:', jobId)
  
  const mockCandidates = [
    {
      id: 'mock-candidate-1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      summary: 'Experienced full-stack developer with 7+ years in React and Node.js',
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
      experience: [
        { company: 'Tech Corp', position: 'Senior Developer', years: 3 },
        { company: 'StartupXYZ', position: 'Full Stack Developer', years: 4 }
      ],
      education: [
        { degree: 'BS Computer Science', university: 'Stanford University', year: 2017 }
      ],
      languages: ['English', 'Spanish'],
      certifications: ['AWS Certified Developer', 'React Certification'],
      experience_years: 7,
      degree: 'BS Computer Science',
      university: 'Stanford University',
      linkedin_url: 'https://linkedin.com/in/sarah-johnson',
      portfolio_url: 'https://sarahjohnson.dev',
      github_url: 'https://github.com/sarahjohnson',
      resume_url: '/resumes/sarah-johnson.pdf',
      created_at: '2024-01-15T10:00:00Z',
      source: 'Demo Data',
      tags: ['Senior', 'Full Stack', 'React Expert']
    },
    {
      id: 'mock-candidate-2',
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+1 (555) 987-6543',
      location: 'New York, NY',
      summary: 'Frontend specialist with expertise in modern JavaScript frameworks',
      skills: ['Vue.js', 'React', 'JavaScript', 'CSS3', 'HTML5', 'Webpack'],
      experience: [
        { company: 'Digital Agency', position: 'Frontend Lead', years: 5 },
        { company: 'E-commerce Co', position: 'UI Developer', years: 2 }
      ],
      education: [
        { degree: 'BA Web Design', university: 'NYU', year: 2019 }
      ],
      languages: ['English', 'Mandarin'],
      certifications: ['Google UX Design Certificate'],
      experience_years: 5,
      degree: 'BA Web Design',
      university: 'NYU',
      linkedin_url: 'https://linkedin.com/in/michael-chen',
      portfolio_url: 'https://michaelchen.design',
      github_url: 'https://github.com/michaelchen',
      resume_url: '/resumes/michael-chen.pdf',
      created_at: '2024-01-14T14:30:00Z',
      source: 'Demo Data',
      tags: ['Frontend', 'Vue Expert', 'UI/UX']
    },
    {
      id: 'mock-candidate-3',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@email.com',
      phone: '+1 (555) 456-7890',
      location: 'Austin, TX',
      summary: 'DevOps engineer with strong cloud infrastructure experience',
      skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'Python', 'Jenkins'],
      experience: [
        { company: 'Cloud Solutions', position: 'DevOps Engineer', years: 4 },
        { company: 'Infrastructure Inc', position: 'Systems Admin', years: 3 }
      ],
      education: [
        { degree: 'MS Information Systems', university: 'UT Austin', year: 2018 }
      ],
      languages: ['English', 'Spanish'],
      certifications: ['AWS Solutions Architect', 'Kubernetes Administrator'],
      experience_years: 6,
      degree: 'MS Information Systems',
      university: 'UT Austin',
      linkedin_url: 'https://linkedin.com/in/emily-rodriguez',
      portfolio_url: null,
      github_url: 'https://github.com/emilyrodriguez',
      resume_url: '/resumes/emily-rodriguez.pdf',
      created_at: '2024-01-13T09:15:00Z',
      source: 'Demo Data',
      tags: ['DevOps', 'Cloud Expert', 'Infrastructure']
    },
    {
      id: 'mock-candidate-4',
      name: 'David Kim',
      email: 'david.kim@email.com',
      phone: '+1 (555) 321-0987',
      location: 'Seattle, WA',
      summary: 'Backend developer specializing in microservices and API development',
      skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Redis', 'Kafka', 'Docker'],
      experience: [
        { company: 'Microservices Corp', position: 'Backend Developer', years: 4 },
        { company: 'API Solutions', position: 'Java Developer', years: 2 }
      ],
      education: [
        { degree: 'BS Software Engineering', university: 'University of Washington', year: 2020 }
      ],
      languages: ['English', 'Korean'],
      certifications: ['Oracle Java Certification', 'Spring Professional'],
      experience_years: 4,
      degree: 'BS Software Engineering',
      university: 'University of Washington',
      linkedin_url: 'https://linkedin.com/in/david-kim',
      portfolio_url: null,
      github_url: 'https://github.com/davidkim',
      resume_url: '/resumes/david-kim.pdf',
      created_at: '2024-01-12T16:45:00Z',
      source: 'Demo Data',
      tags: ['Backend', 'Java Expert', 'Microservices']
    },
    {
      id: 'mock-candidate-5',
      name: 'Lisa Thompson',
      email: 'lisa.thompson@email.com',
      phone: '+1 (555) 654-3210',
      location: 'Chicago, IL',
      summary: 'Data scientist with machine learning and AI expertise',
      skills: ['Python', 'TensorFlow', 'PyTorch', 'SQL', 'R', 'Pandas', 'Scikit-learn'],
      experience: [
        { company: 'AI Research Lab', position: 'Data Scientist', years: 3 },
        { company: 'Analytics Co', position: 'ML Engineer', years: 2 }
      ],
      education: [
        { degree: 'PhD Data Science', university: 'University of Chicago', year: 2021 }
      ],
      languages: ['English', 'German'],
      certifications: ['Google Cloud ML Engineer', 'TensorFlow Developer'],
      experience_years: 5,
      degree: 'PhD Data Science',
      university: 'University of Chicago',
      linkedin_url: 'https://linkedin.com/in/lisa-thompson',
      portfolio_url: 'https://lisathompson.ai',
      github_url: 'https://github.com/lisathompson',
      resume_url: '/resumes/lisa-thompson.pdf',
      created_at: '2024-01-11T11:20:00Z',
      source: 'Demo Data',
      tags: ['Data Science', 'AI/ML', 'PhD']
    }
  ]
  
  // Create matches with realistic scores
  const mockMatches = mockCandidates.map((candidate, index) => ({
    id: `mock-match-${candidate.id}`,
    job_id: jobId,
    candidate_id: candidate.id,
    overall_score: Math.max(65, 92 - index * 4), // Scores from 92 down to 65
    skills_score: Math.max(60, 90 - index * 3),
    experience_score: Math.max(55, 88 - index * 4),
    education_score: Math.max(70, 85 - index * 2),
    languages_score: Math.max(75, 90 - index * 2),
    certifications_score: Math.max(50, 80 - index * 5),
    other_score: Math.max(60, 75 - index * 3),
    strengths: generateStrengths(candidate),
    gaps: generateGaps(candidate),
    recommendations: generateRecommendations({ ...candidate, overall_score: Math.max(65, 92 - index * 4) }),
    created_at: candidate.created_at,
    candidate: candidate
  }))
  
  return NextResponse.json({
    success: true,
    candidates: mockMatches,
    total: mockMatches.length,
    message: 'Using demo candidate data - Supabase not available'
  })
}

// Helper functions for generating demo match data
function generateStrengths(candidate: any): string[] {
  const strengths = []
  
  if (candidate.experience_years >= 5) {
    strengths.push(`${candidate.experience_years} years of relevant experience`)
  }
  
  if (candidate.skills && candidate.skills.length > 0) {
    const skillCount = Array.isArray(candidate.skills) ? candidate.skills.length : candidate.skills.split(',').length
    if (skillCount >= 3) {
      strengths.push(`Strong technical skill set (${skillCount} skills)`)
    }
  }
  
  if (candidate.degree) {
    strengths.push(`Educational background: ${candidate.degree}`)
  }
  
  if (candidate.certifications && candidate.certifications.length > 0) {
    strengths.push('Industry certifications')
  }
  
  if (candidate.languages && candidate.languages.length > 1) {
    strengths.push('Multilingual capabilities')
  }
  
  return strengths.slice(0, 3) // Limit to top 3 strengths
}

function generateGaps(candidate: any): string[] {
  const gaps = []
  
  if (candidate.experience_years < 3) {
    gaps.push('Limited professional experience')
  }
  
  if (!candidate.certifications || candidate.certifications.length === 0) {
    gaps.push('No industry certifications mentioned')
  }
  
  if (!candidate.linkedin_url) {
    gaps.push('No LinkedIn profile provided')
  }
  
  return gaps.slice(0, 2) // Limit to top 2 gaps
}

function generateRecommendations(candidate: any): string[] {
  const recommendations = []
  const score = candidate.overall_score || 0
  
  if (score >= 85) {
    recommendations.push('Schedule interview immediately')
    recommendations.push('Strong candidate - fast-track process')
  } else if (score >= 70) {
    recommendations.push('Consider for phone screening')
    recommendations.push('Request additional information')
  } else {
    recommendations.push('Review CV in detail before proceeding')
    recommendations.push('Consider for future opportunities')
  }
  
  return recommendations.slice(0, 2)
}
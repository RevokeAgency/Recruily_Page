import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ─── Gemini Job Parsing ────────────────────────────────────────────────────────

async function parseJobWithGemini(description: string): Promise<Record<string, any>> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('No Gemini API key')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { maxOutputTokens: 512, temperature: 0.1 },
  })

  const prompt = `Extract structured job data from this description. Return ONLY valid JSON, no markdown.

DESCRIPTION:
${description.substring(0, 3000)}

Return this exact JSON (use null for missing fields):
{
  "title": "Job Title",
  "company": "Company Name",
  "location": "City, Country",
  "employment_type": "full-time",
  "salary_min": null,
  "salary_max": null,
  "skills": ["Skill1", "Skill2"],
  "requirements": "Requirements summary",
  "experience_level": "mid"
}`

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Gemini timeout')), 7000)
  )

  const result = await Promise.race([model.generateContent(prompt), timeoutPromise])
  const text = (result as any).response.text().trim()
  const json = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(json)
}

// ─── Auth helper ───────────────────────────────────────────────────────────────

async function resolveUserAndOrg(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return { error: 'Unauthorized', status: 401 }

  const admin = createAdminClient()
  const { data: { user }, error: authError } = await admin.auth.getUser(token)
  if (!user || authError) return { error: 'Unauthorized', status: 401 }

  const { data: org } = await admin
    .from('organisations')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  return { user, org, admin }
}

// ─── GET /api/jobs ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { user, org, admin, error, status } = await resolveUserAndOrg(request) as any
    if (error) return NextResponse.json({ error }, { status })

    if (!org?.id) return NextResponse.json({ success: true, jobs: [], total: 0 })

    const { data: jobs, error: dbError } = await admin
      .from('jobs')
      .select('*')
      .eq('organisation_id', org.id)
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('❌ Jobs fetch error:', dbError)
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, jobs: jobs ?? [], total: jobs?.length ?? 0 })
  } catch (error: any) {
    console.error('❌ GET /api/jobs error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch jobs', jobs: [], total: 0 }, { status: 500 })
  }
}

// ─── POST /api/jobs ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  console.log('📋 [POST] /api/jobs')
  try {
    const { user, org, admin, error, status } = await resolveUserAndOrg(request) as any
    if (error) return NextResponse.json({ error }, { status })

    if (!org?.id) return NextResponse.json({ error: 'Organisation not found' }, { status: 400 })

    const body = await request.json()

    if (!body.description && !body.title) {
      return NextResponse.json({ success: false, error: 'Title or description is required' }, { status: 400 })
    }

    // ── Optional: Gemini enrichment from description ───────────────────────────
    let enriched: Record<string, any> = {}
    if (body.description) {
      try {
        enriched = await parseJobWithGemini(body.description)
        console.log('✅ Gemini enriched job:', enriched.title)
      } catch (e: any) {
        console.warn('⚠️ Gemini job parsing failed (non-fatal):', e.message)
      }
    }

    // Explicit body fields take priority over Gemini suggestions
    const skillsRaw = body.skills ?? enriched.skills ?? []
    const skills = Array.isArray(skillsRaw)
      ? skillsRaw
      : String(skillsRaw).split(',').map((s: string) => s.trim()).filter(Boolean)

    const newJob = {
      id: uuidv4(),
      title: body.title || enriched.title || 'Untitled Position',
      description: body.description || null,
      requirements: body.requirements || enriched.requirements || null,
      location: body.location || enriched.location || null,
      employment_type: body.employment_type || body.job_type || enriched.employment_type || 'full-time',
      company: body.company || body.company_name || enriched.company || null,
      skills,
      salary_min: body.salary_min ? parseInt(body.salary_min) : (enriched.salary_min ?? null),
      salary_max: body.salary_max ? parseInt(body.salary_max) : (enriched.salary_max ?? null),
      experience_level: body.experience_level || enriched.experience_level || null,
      status: 'open',
      organisation_id: org.id,
      created_by: user.id,
    }

    const { data: savedJob, error: dbError } = await admin
      .from('jobs')
      .insert([newJob])
      .select()
      .single()

    if (dbError) {
      console.error('❌ Job insert error:', dbError)
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
    }

    console.log('✅ Job created:', savedJob.id, savedJob.title)
    return NextResponse.json({ success: true, job: savedJob, message: 'Job created successfully' })

  } catch (error: any) {
    console.error('❌ POST /api/jobs error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create job' }, { status: 500 })
  }
}

// ─── PUT /api/jobs ─────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  console.log('✏️ [PUT] /api/jobs')
  try {
    const { user, org, admin, error, status } = await resolveUserAndOrg(request) as any
    if (error) return NextResponse.json({ error }, { status })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ success: false, error: 'Job ID is required' }, { status: 400 })

    // Remap client-side field aliases
    if (updates.job_type && !updates.employment_type) {
      updates.employment_type = updates.job_type
      delete updates.job_type
    }

    const { data: updatedJob, error: dbError } = await admin
      .from('jobs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organisation_id', org.id)
      .select()
      .single()

    if (dbError) {
      console.error('❌ Job update error:', dbError)
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
    }

    console.log('✅ Job updated:', id)
    return NextResponse.json({ success: true, job: updatedJob })

  } catch (error: any) {
    console.error('❌ PUT /api/jobs error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update job' }, { status: 500 })
  }
}

// ─── DELETE /api/jobs ──────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  console.log('🗑️ [DELETE] /api/jobs')
  try {
    const { org, admin, error, status } = await resolveUserAndOrg(request) as any
    if (error) return NextResponse.json({ error }, { status })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ success: false, error: 'Job ID is required' }, { status: 400 })

    const { error: dbError } = await admin
      .from('jobs')
      .delete()
      .eq('id', id)
      .eq('organisation_id', org.id)

    if (dbError) {
      console.error('❌ Job delete error:', dbError)
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
    }

    console.log('✅ Job deleted:', id)
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('❌ DELETE /api/jobs error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete job' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

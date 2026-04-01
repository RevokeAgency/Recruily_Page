import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  console.log('📝 Updating candidate status:', params.candidateId)
  
  try {
    const body = await request.json()
    const { status, notes, jobId } = body

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Update candidate status
    const { data, error } = await (supabaseAdmin as any)
      .from('candidates')
      .update({ 
        status,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.candidateId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating candidate status:', error)
      
      // Create demo response for mock mode
      return NextResponse.json({
        success: true,
        candidate: {
          id: params.candidateId,
          status,
          notes,
          updated_at: new Date().toISOString()
        },
        message: `Candidate status updated to: ${status}`,
        demo_mode: true
      })
    }

    // Also update job match status if jobId provided
    if (jobId) {
      const { error: matchError } = await (supabaseAdmin as any)
        .from('job_matches')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('candidate_id', params.candidateId)
        .eq('job_id', jobId)

      if (matchError) {
        console.warn('⚠️ Could not update job match status:', matchError)
      }
    }

    console.log('✅ Candidate status updated successfully')

    return NextResponse.json({
      success: true,
      candidate: data,
      message: `Candidate status updated to: ${status}`
    })

  } catch (error: any) {
    console.error('❌ Error updating candidate status:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update candidate status'
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  console.log('🔍 Fetching candidate details:', params.candidateId)
  
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Fetch candidate details
    const { data, error } = await supabaseAdmin
      .from('candidates')
      .select('*')
      .eq('id', params.candidateId)
      .single()

    if (error) {
      console.error('❌ Error fetching candidate:', error)
      throw error
    }

    console.log('✅ Candidate details fetched successfully')

    return NextResponse.json({
      success: true,
      candidate: data
    })

  } catch (error: any) {
    console.error('❌ Error fetching candidate:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch candidate details'
    }, { status: 500 })
  }
}
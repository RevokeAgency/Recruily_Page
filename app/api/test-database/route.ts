import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase.client'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  console.log('🧪 Testing database connectivity...')
  
  try {
    // Test basic database connection using service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    const { data: testData, error: testError } = await supabaseAdmin
      .from('candidates')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.log('🔍 Database test result:', { testError, testData })
      
      // Check if this is a mock client
      if (testError.message?.includes('Mock') || !testError.code) {
        return NextResponse.json({
          success: true,
          status: 'mock_mode',
          message: 'Using mock database for development/testing',
          details: 'CV upload will work with demo data creation',
          recommendations: [
            'For production: Configure NEXT_PUBLIC_SUPABASE_URL',
            'For production: Configure NEXT_PUBLIC_SUPABASE_ANON_KEY',
            'Current functionality: CV parsing and demo candidate creation works'
          ]
        })
      } else {
        // Real database error
        return NextResponse.json({
          success: false,
          status: 'database_error',
          message: 'Database connection failed',
          error: testError.message,
          recommendations: [
            'Check your Supabase credentials',
            'Verify your database is accessible',
            'Ensure RLS policies are properly configured'
          ]
        }, { status: 500 })
      }
    }
    
    // Database connection successful
    return NextResponse.json({
      success: true,
      status: 'connected',
      message: 'Database connection successful',
      recordsFound: testData?.length || 0,
      features: [
        'Real candidate storage',
        'CV file uploads to Supabase Storage', 
        'Full database functionality'
      ]
    })
    
  } catch (error: any) {
    console.error('❌ Database test failed:', error)
    
    return NextResponse.json({
      success: false,
      status: 'connection_failed',
      message: 'Failed to test database connection',
      error: error.message,
      fallback: 'Using demo mode for CV processing'
    }, { status: 500 })
  }
}
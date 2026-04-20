import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (token) {
      const admin = createAdminClient()
      const { data: { user } } = await admin.auth.getUser(token)
      if (user) {
        const { count } = await admin
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id)

        return NextResponse.json({
          used: count ?? 0,
          limit: 10,
          unlimited: false,
          reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }
    }
  } catch { /* fallthrough to default */ }

  return NextResponse.json({
    used: 0,
    limit: 10,
    unlimited: false,
    reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ orgId: null }, { status: 401 })
    }

    const { data: org } = await supabase
      .from('organisations')
      .select('id')
      .eq('owner_id', session.user.id)
      .single()

    return NextResponse.json({ orgId: org?.id ?? null })
  } catch {
    return NextResponse.json({ orgId: null }, { status: 500 })
  }
}

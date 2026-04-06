import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    console.log("DEBUG get-org-id called")

    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    console.log("DEBUG token present:", !!token)

    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    console.log("SESSION USER ID:", user?.id)
    console.log("SESSION ERROR:", userError)

    if (!user || userError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: org, error: orgError } = await supabaseAdmin
      .from('organisations')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    console.log("ORG RESULT:", org)
    console.log("ORG ERROR:", orgError)

    return NextResponse.json({ orgId: org?.id ?? null })
  } catch (err) {
    console.log("DEBUG get-org-id exception:", err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

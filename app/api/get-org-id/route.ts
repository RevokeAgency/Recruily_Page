import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    console.log("DEBUG get-org-id called")
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    console.log("DEBUG session user id:", session?.user?.id ?? null)
    console.log("DEBUG session error:", sessionError ?? null)

    if (!session?.user) {
      console.log("DEBUG no session — returning 401")
      return NextResponse.json({ orgId: null }, { status: 401 })
    }

    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .select('id')
      .eq('owner_id', session.user.id)
      .single()

    console.log("DEBUG org query result:", org ?? null)
    console.log("DEBUG org query error:", orgError ?? null)

    return NextResponse.json({ orgId: org?.id ?? null })
  } catch (err) {
    console.log("DEBUG get-org-id exception:", err)
    return NextResponse.json({ orgId: null }, { status: 500 })
  }
}

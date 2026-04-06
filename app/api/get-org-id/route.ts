import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    console.log("DEBUG get-org-id called")
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    console.log("SESSION USER ID:", session?.user?.id)
    console.log("SESSION ERROR:", sessionError)

    if (!session?.user) {
      console.log("DEBUG no session — returning 401")
      return NextResponse.json({ orgId: null }, { status: 401 })
    }

    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .select('id')
      .eq('owner_id', session.user.id)
      .single()

    console.log("ORG RESULT:", org)
    console.log("ORG ERROR:", orgError)

    return NextResponse.json({ orgId: org?.id ?? null })
  } catch (err) {
    console.log("DEBUG get-org-id exception:", err)
    return NextResponse.json({ orgId: null }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("📋 Jobs API - GET single job:", params.id)

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: job, error } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error || !job) {
      console.warn("Job not found:", params.id)
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })
    }

    console.log("✅ Job found:", job.title)

    return NextResponse.json({ success: true, job })
  } catch (error: any) {
    console.error("❌ Jobs API single GET Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch job" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

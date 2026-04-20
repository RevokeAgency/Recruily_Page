import { NextResponse } from 'next/server'

// This route has been superseded by /api/candidates/upload.
// Kept to prevent 404s from any stale frontend references — returns 410 Gone.

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Deprecated — use /api/candidates/upload instead' },
    { status: 410 }
  )
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Deprecated — use /api/candidates/upload instead' },
    { status: 410 }
  )
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

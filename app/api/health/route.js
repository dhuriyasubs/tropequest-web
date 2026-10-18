import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withTimeout } from '@/lib/withTimeout'

// Point an external uptime monitor (UptimeRobot, Better Uptime, etc.) here —
// it does a real Supabase round-trip so it reflects actual DB reachability,
// not just that the Vercel function booted.
export async function GET() {
  try {
    const { error } = await withTimeout(
      supabaseAdmin.from('books').select('id').limit(1),
      5000,
      'health check'
    )
    if (error) throw error
    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    return NextResponse.json({ status: 'unhealthy', error: err.message }, { status: 503 })
  }
}

import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { type, session_id, device_id, traffic_source, data } = await request.json()
    if (!type) return NextResponse.json({ ok: false })

    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    await supabaseAdmin.from('page_events').insert({
      event_type: type,
      user_id: user?.id ?? null,
      session_id: session_id ?? null,
      device_id: device_id ?? null,
      traffic_source: traffic_source ?? null,
      book_id: data?.book_id ?? null,
      referrer: data?.referrer ?? null,
      data,
    })
  } catch (e) {
    console.error('events route:', e.message)
  }
  return NextResponse.json({ ok: true })
}

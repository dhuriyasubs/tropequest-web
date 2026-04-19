import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase'

const CLICK_TYPES = new Set(['rec_click', 'buy_click'])

export async function POST(request) {
  try {
    const { type, session_id, device_id, traffic_source, referrer, data } = await request.json()
    if (!type) return NextResponse.json({ ok: false })

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      null
    const user_agent = request.headers.get('user-agent') ?? null

    let userId = null
    try {
      const supabase = createSupabaseServer()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch {}

    await supabaseAdmin.from('page_events').insert({
      event_type: type,
      event: CLICK_TYPES.has(type) ? 'click' : 'impression',
      user_id: userId,
      session_id: session_id ?? null,
      device_id: device_id ?? null,
      traffic_source: traffic_source ?? null,
      book_id: data?.book_id ?? null,
      referrer: referrer ?? null,
      ip,
      user_agent,
      data,
    })
  } catch (e) {
    console.error('events route:', e.message)
  }
  return NextResponse.json({ ok: true })
}

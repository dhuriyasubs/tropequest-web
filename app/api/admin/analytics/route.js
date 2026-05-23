import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from') ?? (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString(); })()
  const to   = searchParams.get('to')   ?? new Date().toISOString()

  const BOT_AGENTS = ['googlebot', 'googleother', 'bingbot', 'ahrefsbot', 'semrushbot', 'petalbot', 'yandexbot']

  let query = supabaseAdmin
    .from('page_events')
    .select('event_type, user_agent, traffic_source, data, created_at')
    .gte('created_at', from)
    .lte('created_at', to)
    .order('created_at', { ascending: true })
    .limit(50000)

  for (const bot of BOT_AGENTS) {
    query = query.not('user_agent', 'ilike', `%${bot}%`)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data })
}

import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  const { slug, helpful, device_id, session_id } = await request.json()
  if (!slug || typeof helpful !== 'boolean') {
    return NextResponse.json({ error: 'slug and helpful required' }, { status: 400 })
  }

  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabaseAdmin
    .from('blog_feedback')
    .insert({
      slug,
      helpful,
      user_id:    user?.id ?? null,
      device_id:  device_id ?? null,
      session_id: session_id ?? null,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

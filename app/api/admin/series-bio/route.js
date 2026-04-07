import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { series_name, bio } = await request.json()
  if (!series_name?.trim()) return NextResponse.json({ error: 'series_name required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('series_bios')
    .upsert({ series_name: series_name.trim(), bio }, { onConflict: 'series_name' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const series_name = searchParams.get('series')
  if (!series_name) return NextResponse.json({ bio: null })

  const { data } = await supabaseAdmin
    .from('series_bios')
    .select('bio')
    .eq('series_name', series_name)
    .single()

  const bio = data?.bio ?? null
  return NextResponse.json({ bio: typeof bio === 'string' ? JSON.parse(bio) : bio })
}

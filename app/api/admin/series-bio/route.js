import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

export async function POST(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)

  // Suggestions: popular series without a bio
  if (searchParams.get('pending') === '1') {
    const [{ data: bookRows }, { data: bioRows }] = await Promise.all([
      supabaseAdmin.from('books').select('series_name, rating_count').not('series_name', 'is', null),
      supabaseAdmin.from('series_bios').select('series_name'),
    ])
    const bioSet = new Set((bioRows ?? []).map(b => b.series_name))
    const map = {}
    for (const { series_name, rating_count } of (bookRows ?? [])) {
      if (!series_name) continue
      if (!map[series_name]) map[series_name] = { book_count: 0, max_rating_count: 0 }
      map[series_name].book_count++
      if ((rating_count ?? 0) > map[series_name].max_rating_count) map[series_name].max_rating_count = rating_count ?? 0
    }
    const suggestions = Object.entries(map)
      .filter(([name]) => !bioSet.has(name))
      .map(([name, s]) => ({ name, book_count: s.book_count, max_rating_count: s.max_rating_count }))
      .sort((a, b) => (b.max_rating_count - a.max_rating_count) || (b.book_count - a.book_count))
      .slice(0, 20)
    return NextResponse.json({ suggestions })
  }

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

import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

export async function POST(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { author_name, bio } = await request.json()
  if (!author_name?.trim()) return NextResponse.json({ error: 'author_name required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('author_bios')
    .upsert({ author_name: author_name.trim(), bio }, { onConflict: 'author_name' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)

  // Suggestions: popular authors without a bio
  if (searchParams.get('pending') === '1') {
    const [{ data: bookRows }, { data: bioRows }] = await Promise.all([
      supabaseAdmin.from('books').select('author, rating_count').not('author', 'is', null),
      supabaseAdmin.from('author_bios').select('author_name'),
    ])
    const bioSet = new Set((bioRows ?? []).map(b => b.author_name))
    const map = {}
    for (const { author, rating_count } of (bookRows ?? [])) {
      if (!author) continue
      if (!map[author]) map[author] = { book_count: 0, max_rating_count: 0 }
      map[author].book_count++
      if ((rating_count ?? 0) > map[author].max_rating_count) map[author].max_rating_count = rating_count ?? 0
    }
    const suggestions = Object.entries(map)
      .filter(([name]) => !bioSet.has(name))
      .map(([name, s]) => ({ name, book_count: s.book_count, max_rating_count: s.max_rating_count }))
      .sort((a, b) => (b.max_rating_count - a.max_rating_count) || (b.book_count - a.book_count))
      .slice(0, 20)
    return NextResponse.json({ suggestions })
  }

  const author_name = searchParams.get('author')
  if (!author_name) return NextResponse.json({ bio: null })

  const { data } = await supabaseAdmin
    .from('author_bios')
    .select('bio')
    .eq('author_name', author_name)
    .single()

  const bio = data?.bio ?? null
  return NextResponse.json({ bio: typeof bio === 'string' ? JSON.parse(bio) : bio })
}

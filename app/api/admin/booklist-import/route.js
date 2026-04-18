import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

const ARRAY_FIELDS = [
  'genres', 'tropes', 'story_tags', 'content_warnings', 'representation',
  'setting_tags', 'geography_tags', 'relationship_type', 'time_period', 'kink_tags',
]

async function getAdmin(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  return isAdmin(user) ? user : null
}

// POST: look up books by title, return matches map
export async function POST(request) {
  if (!await getAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { titles } = await request.json()
  const results = await Promise.all(
    titles.map(title =>
      supabaseAdmin.from('books').select('id, title, author, slug')
        .ilike('title', title).limit(1).maybeSingle()
    )
  )

  const matches = {}
  titles.forEach((title, i) => {
    if (results[i].data) matches[title.toLowerCase()] = results[i].data
  })

  return NextResponse.json({ matches })
}

// PATCH: merge fields into matched books
export async function PATCH(request) {
  if (!await getAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { updates } = await request.json()

  await Promise.all(updates.map(async update => {
    const { id, rating, spice_rating, ...fields } = update

    const { data: current } = await supabaseAdmin
      .from('books')
      .select([...ARRAY_FIELDS, 'rating', 'spice_rating', 'data_source'].join(','))
      .eq('id', id)
      .single()

    if (!current) return

    const patch = { data_source: { ...(current.data_source ?? {}) } }

    for (const field of ARRAY_FIELDS) {
      if (fields[field]?.length) {
        const merged = [...new Set([...(current[field] ?? []), ...fields[field]])]
        patch[field] = merged
        patch.data_source[field] = 'import'
      }
    }

    if (spice_rating && !current.spice_rating) {
      patch.spice_rating = spice_rating
      patch.data_source.spice_rating = 'import'
    }
    if (rating && !current.rating) {
      patch.rating = rating
      patch.data_source.rating = 'import'
    }

    await supabaseAdmin.from('books').update(patch).eq('id', id)
  }))

  return NextResponse.json({ ok: true })
}

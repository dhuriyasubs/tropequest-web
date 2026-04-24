import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'
import { slugify } from '@/lib/utils'

function normalizeAuthor(raw) {
  const normalizePart = s => s
    .replace(/[\u00a0\u200b\u200c\u200d\ufeff]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/(^|[\s\-.])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase())
  return (raw ?? '')
    .split(',')
    .map(normalizePart)
    .filter(Boolean)
    .join(' And ')
}

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

// PATCH: create new books or merge fields into existing ones
export async function PATCH(request) {
  if (!await getAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { updates } = await request.json()

  const errors = []
  await Promise.all(updates.map(async update => {
    const { id, title, author, rating, spice_rating, ...fields } = update

    if (!id) {
      // Create new book
      const ds = {}
      const normalizedAuthor = normalizeAuthor(author)
      const baseSlug = slugify(`${title} ${normalizedAuthor}`)

      // Avoid slug collisions
      const { data: existing } = await supabaseAdmin
        .from('books').select('slug').ilike('slug', `${baseSlug}%`)
      const usedSlugs = new Set((existing ?? []).map(r => r.slug))
      let slug = baseSlug
      let n = 2
      while (usedSlugs.has(slug)) slug = `${baseSlug}-${n++}`

      const row = { title, author: normalizedAuthor, slug, data_source: ds }
      for (const field of ARRAY_FIELDS) {
        if (fields[field]?.length) { row[field] = fields[field]; ds[field] = 'import' }
      }
      if (spice_rating) { row.spice_rating = spice_rating; ds.spice_rating = 'import' }
      if (rating)       { row.rating = rating;             ds.rating = 'import' }
      const { error } = await supabaseAdmin.from('books').insert(row)
      if (error) {
        // Unique constraint: book exists but title lookup missed it (apostrophe/character mismatch) — merge instead
        if (error.code === '23505') {
          const { data: existing } = await supabaseAdmin
            .from('books')
            .select(['id', ...ARRAY_FIELDS, 'rating', 'spice_rating', 'data_source'].join(','))
            .ilike('title', title)
            .ilike('author', normalizedAuthor)
            .maybeSingle()
          const match = existing
          if (match) {
            const patch = { data_source: { ...(match.data_source ?? {}) } }
            for (const field of ARRAY_FIELDS) {
              if (fields[field]?.length) {
                patch[field] = [...new Set([...(match[field] ?? []), ...fields[field]])]
                patch.data_source[field] = 'import'
              }
            }
            if (spice_rating && !match.spice_rating) { patch.spice_rating = spice_rating; patch.data_source.spice_rating = 'import' }
            if (rating       && !match.rating)       { patch.rating = rating;             patch.data_source.rating = 'import' }
            await supabaseAdmin.from('books').update(patch).eq('id', match.id)
            return
          }
        }
        console.error(`booklist-import INSERT failed for "${title}":`, error.message)
        errors.push({ title, error: error.message })
      }
      return
    }

    // Update existing book — merge array fields
    const { data: current } = await supabaseAdmin
      .from('books')
      .select([...ARRAY_FIELDS, 'rating', 'spice_rating', 'data_source'].join(','))
      .eq('id', id)
      .single()

    if (!current) return

    const patch = { data_source: { ...(current.data_source ?? {}) } }
    for (const field of ARRAY_FIELDS) {
      if (fields[field]?.length) {
        patch[field] = [...new Set([...(current[field] ?? []), ...fields[field]])]
        patch.data_source[field] = 'import'
      }
    }
    if (spice_rating && !current.spice_rating) { patch.spice_rating = spice_rating; patch.data_source.spice_rating = 'import' }
    if (rating       && !current.rating)       { patch.rating = rating;             patch.data_source.rating = 'import' }

    await supabaseAdmin.from('books').update(patch).eq('id', id)
  }))

  return NextResponse.json({ ok: true, errors })
}

import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'
import { slugify } from '@/lib/utils'

const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY
const COVERS_BUCKET   = 'covers'

async function uploadCover(coverUrl, bookId) {
  if (!coverUrl || !SUPABASE_URL || !SUPABASE_KEY) return coverUrl
  try {
    const img = await fetch(coverUrl, { headers: { 'User-Agent': 'TropeQuest/1.0' } })
    if (!img.ok) return coverUrl
    const contentType = img.headers.get('content-type') || 'image/jpeg'
    const buffer = await img.arrayBuffer()
    const path = `${bookId}_${Date.now()}.jpg`
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${COVERS_BUCKET}/${path}`
    const up = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: buffer,
    })
    if (up.ok) return `${SUPABASE_URL}/storage/v1/object/public/${COVERS_BUCKET}/${path}`
  } catch {}
  return coverUrl
}

function normalizeAuthor(raw) {
  const normalizePart = s => s
    .replace(/[\u00a0\u200b\u200c\u200d\ufeff]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase())
  return (raw ?? '')
    .split(',')
    .map(normalizePart)
    .filter(Boolean)
    .join(' And ')
}

function bustCache(slug, author, seriesName) {
  if (slug)       revalidatePath(`/books/${slug}`)
  if (author)     revalidatePath(`/author/${encodeURIComponent(author)}`)
  if (seriesName) revalidatePath(`/series/${slugify(seriesName)}`)
  revalidateTag('featured-books')
}

const FIELDS = 'id,title,author,slug,cover_url,series_name,series_number,rating,rating_count,rating_source,description,tropes,genres,release_date,release_year,buy_url_amazon_us,buy_url_amazon_in,buy_url_flipkart,buy_url_abebooks,buy_url_bookscape,buy_url_wattpad,buy_url_stck,buy_url_royal_road,buy_url_audible,is_kindle_unlimited,price_amazon_in,price_amazon_us,characters,spice_rating,time_period,relationship_type,kink_tags,story_tags,content_warnings,representation,setting_tags,geography_tags,data_source'

export async function GET(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)

  // DB completeness stats
  if (searchParams.get('stats') === '1') {
    const c = (filter) => {
      const q = supabaseAdmin.from('books').select('*', { count: 'exact', head: true })
      return filter(q)
    }
    const arr = f => `${f}.is.null,${f}.eq.{}`
    const [total, desc, author, cover, rating, ratingCount, ratingSource, tropes, genres, isbn, isbn13,
           timePeriod, relType, storyTags, cw, rep, setting, geo] = await Promise.all([
      supabaseAdmin.from('books').select('*', { count: 'exact', head: true }),
      c(q => q.or('description.is.null,description.eq.')),
      c(q => q.or('author.is.null,author.eq.,author.eq.Unknown')),
      c(q => q.or('cover_url.is.null,cover_url.eq.')),
      c(q => q.is('rating', null)),
      c(q => q.is('rating_count', null)),
      c(q => q.is('rating_source', null)),
      c(q => q.or(arr('tropes'))),
      c(q => q.or(arr('genres'))),
      c(q => q.or('isbn.is.null,isbn.eq.')),
      c(q => q.or('isbn13.is.null,isbn13.eq.')),
      c(q => q.or(arr('time_period'))),
      c(q => q.or(arr('relationship_type'))),
      c(q => q.or(arr('story_tags'))),
      c(q => q.or(arr('content_warnings'))),
      c(q => q.or(arr('representation'))),
      c(q => q.or(arr('setting_tags'))),
      c(q => q.or(arr('geography_tags'))),
    ])
    return NextResponse.json({
      total:                    total.count        ?? 0,
      missing_description:      desc.count         ?? 0,
      missing_author:           author.count       ?? 0,
      missing_cover:            cover.count        ?? 0,
      missing_rating:           rating.count       ?? 0,
      missing_rating_count:     ratingCount.count  ?? 0,
      missing_rating_source:    ratingSource.count ?? 0,
      zero_tropes:              tropes.count       ?? 0,
      zero_genres:              genres.count       ?? 0,
      missing_isbn:             isbn.count         ?? 0,
      missing_isbn13:           isbn13.count       ?? 0,
      zero_time_period:         timePeriod.count   ?? 0,
      zero_relationship_type:   relType.count      ?? 0,
      zero_story_tags:          storyTags.count    ?? 0,
      zero_content_warnings:    cw.count           ?? 0,
      zero_representation:      rep.count          ?? 0,
      zero_setting_tags:        setting.count      ?? 0,
      zero_geography_tags:      geo.count          ?? 0,
    })
  }

  // Books missing a specific field
  const missing = searchParams.get('missing')
  if (missing) {
    const FILTERS = {
      description:        q => q.or('description.is.null,description.eq.'),
      author:             q => q.or('author.is.null,author.eq.,author.eq.Unknown'),
      cover:              q => q.or('cover_url.is.null,cover_url.eq.'),
      rating:             q => q.is('rating', null),
      rating_count:       q => q.is('rating_count', null),
      rating_source:      q => q.is('rating_source', null),
      tropes:             q => q.or('tropes.is.null,tropes.eq.{}'),
      genres:             q => q.or('genres.is.null,genres.eq.{}'),
      isbn:               q => q.or('isbn.is.null,isbn.eq.'),
      isbn13:             q => q.or('isbn13.is.null,isbn13.eq.'),
      time_period:        q => q.or('time_period.is.null,time_period.eq.{}'),
      relationship_type:  q => q.or('relationship_type.is.null,relationship_type.eq.{}'),
      story_tags:         q => q.or('story_tags.is.null,story_tags.eq.{}'),
      content_warnings:   q => q.or('content_warnings.is.null,content_warnings.eq.{}'),
      representation:     q => q.or('representation.is.null,representation.eq.{}'),
      setting_tags:       q => q.or('setting_tags.is.null,setting_tags.eq.{}'),
      geography_tags:     q => q.or('geography_tags.is.null,geography_tags.eq.{}'),
    }
    const applyFilter = FILTERS[missing]
    if (!applyFilter) return NextResponse.json({ error: 'Unknown field' }, { status: 400 })
    const base = supabaseAdmin.from('books').select(FIELDS).order('title').limit(100)
    const { data } = await applyFilter(base)
    return NextResponse.json({ books: data ?? [] })
  }

  // Batch slug existence check for bulk import enrichment
  const slugsParam = searchParams.get('slugs')
  if (slugsParam) {
    const slugList = slugsParam.split(',').map(s => s.trim()).filter(Boolean)
    const { data } = await supabaseAdmin
      .from('books')
      .select('id,slug,cover_url,rating,rating_count,rating_source,series_name,series_number')
      .in('slug', slugList)
    const map = {}
    for (const row of (data ?? [])) {
      const missing = []
      if (!row.cover_url)          missing.push('cover_url')
      if (row.rating == null)      missing.push('rating')
      if (row.rating_count == null) missing.push('rating_count')
      if (!row.rating_source)      missing.push('rating_source')
      if (!row.series_name)        missing.push('series_name')
      if (row.series_number == null) missing.push('series_number')
      map[row.slug] = { id: row.id, missingFields: missing }
    }
    return NextResponse.json({ books: map })
  }

  // Single book by id (deep-link from Bulk Import "edit" icon)
  const id = searchParams.get('id')
  if (id) {
    const { data } = await supabaseAdmin.from('books').select(FIELDS).eq('id', id).maybeSingle()
    return NextResponse.json({ books: data ? [data] : [] })
  }

  // Pending enrichment list
  if (searchParams.get('pending') === '1') {
    const { data } = await supabaseAdmin
      .from('books')
      .select(FIELDS)
      .or('description.is.null,cover_url.is.null,tropes.is.null,tropes.eq.{}')
      .order('rating_count', { ascending: false, nullsFirst: false })
      .limit(30)
    return NextResponse.json({ books: data ?? [] })
  }

  // Search
  const q = searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ books: [] })

  const [byTitle, byAuthor, bySlug] = await Promise.all([
    supabaseAdmin.from('books').select(FIELDS).ilike('title',  `%${q}%`).limit(10),
    supabaseAdmin.from('books').select(FIELDS).ilike('author', `%${q}%`).limit(10),
    supabaseAdmin.from('books').select(FIELDS).ilike('slug',   `%${q}%`).limit(10),
  ])

  const seen = new Set()
  const books = []
  for (const row of [...(byTitle.data ?? []), ...(byAuthor.data ?? []), ...(bySlug.data ?? [])]) {
    if (!seen.has(row.id)) { seen.add(row.id); books.push(row) }
  }

  return NextResponse.json({ books: books.slice(0, 10) })
}

// Update existing book
export async function POST(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...fields } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  if (fields.author) fields.author = normalizeAuthor(fields.author)

  if (fields.cover_url) {
    fields.cover_url = await uploadCover(fields.cover_url, String(id))
  }

  const { error, data: updated } = await supabaseAdmin
    .from('books')
    .update(fields)
    .eq('id', id)
    .select('slug, author, series_name')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  bustCache(updated?.slug, updated?.author, updated?.series_name)

  return NextResponse.json({ ok: true })
}

// Delete book
export async function DELETE(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Fetch slug/author/series before deleting for cache bust
  const { data: book } = await supabaseAdmin
    .from('books')
    .select('slug, author, series_name')
    .eq('id', id)
    .single()

  const { error } = await supabaseAdmin.from('books').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (book) bustCache(book.slug, book.author, book.series_name)

  return NextResponse.json({ ok: true })
}

// Create new book
export async function PUT(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fields = await request.json()
  if (!fields.title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })
  if (!fields.author?.trim()) return NextResponse.json({ error: 'author required' }, { status: 400 })
  fields.author = normalizeAuthor(fields.author)
  if (!fields.slug?.trim())  return NextResponse.json({ error: 'slug required' },  { status: 400 })

  // Duplicate check
  const { data: existing } = await supabaseAdmin
    .from('books')
    .select('id')
    .ilike('title', fields.title.trim())
    .ilike('author', fields.author.trim())
    .maybeSingle()
  if (existing) return NextResponse.json({ error: 'A book with this title and author already exists.' }, { status: 409 })

  // Insert first to get id, then upload cover
  const { data, error } = await supabaseAdmin.from('books').insert(fields).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (fields.cover_url) {
    const hosted = await uploadCover(fields.cover_url, String(data.id))
    if (hosted !== fields.cover_url) {
      await supabaseAdmin.from('books').update({ cover_url: hosted }).eq('id', data.id)
    }
  }

  bustCache(fields.slug, fields.author, fields.series_name)

  return NextResponse.json({ ok: true, id: data.id })
}

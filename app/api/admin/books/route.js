import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

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

const FIELDS = 'id,title,author,slug,cover_url,series_name,series_number,rating,rating_count,rating_source,description,tropes,genres,primary_genre,secondary_genre,release_date,release_year,buy_url_amazon_us,buy_url_amazon_in,buy_url_flipkart,price_amazon_in,price_amazon_us,characters'

export async function GET(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)

  // Pending enrichment list
  if (searchParams.get('pending') === '1') {
    const { data } = await supabaseAdmin
      .from('books')
      .select(FIELDS)
      .or('description.is.null,cover_url.is.null,tropes.eq.{},buy_url_amazon_us.is.null')
      .order('rating_count', { ascending: false, nullsFirst: false })
      .limit(30)
    return NextResponse.json({ books: data ?? [] })
  }

  // Search
  const q = searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ books: [] })

  const { data } = await supabaseAdmin
    .from('books')
    .select(FIELDS)
    .or(`title.ilike.%${q}%,slug.ilike.%${q}%,author.ilike.%${q}%`)
    .limit(10)

  return NextResponse.json({ books: data ?? [] })
}

// Update existing book
export async function POST(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...fields } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  if (fields.cover_url) {
    fields.cover_url = await uploadCover(fields.cover_url, String(id))
  }

  const { error } = await supabaseAdmin.from('books').update(fields).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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

  return NextResponse.json({ ok: true, id: data.id })
}

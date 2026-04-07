import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase'

const FIELDS = 'id,title,author,slug,cover_url,series_name,series_number,rating,rating_count,rating_source,description,tropes,genres,primary_genre,secondary_genre,buy_url_amazon_us,buy_url_amazon_in,buy_url_flipkart,price_amazon_in,price_amazon_us'

export async function GET(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...fields } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabaseAdmin.from('books').update(fields).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Create new book
export async function PUT(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const { data, error } = await supabaseAdmin.from('books').insert(fields).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}

import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ books: [] })

  const { data } = await supabaseAdmin
    .from('books')
    .select('id,title,author,slug,cover_url,series_name,series_number,rating,rating_count,description,tropes,genres,primary_genre,buy_url_amazon_us,buy_url_amazon_in,buy_url_flipkart,price_amazon_in,price_amazon_us')
    .or(`title.ilike.%${q}%,slug.ilike.%${q}%,author.ilike.%${q}%`)
    .limit(10)

  return NextResponse.json({ books: data ?? [] })
}

export async function POST(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...fields } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('books')
    .update(fields)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

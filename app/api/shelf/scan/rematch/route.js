import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function makeSlug(title, author) {
  const base = `${title}${author ? '-' + author : ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export async function POST(request) {
  const { title, author } = await request.json()
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  let { data } = await supabaseAdmin
    .from('books')
    .select('id,title,author,cover_url,slug,rating')
    .ilike('title', title)
    .limit(1)
    .maybeSingle()

  if (!data) {
    const res = await supabaseAdmin
      .from('books')
      .select('id,title,author,cover_url,slug,rating')
      .ilike('title', `%${title}%`)
      .limit(1)
    data = res.data?.[0] ?? null
  }

  if (!data) {
    const { data: created } = await supabaseAdmin
      .from('books')
      .insert({
        title,
        author: author || 'Unknown',
        slug:   makeSlug(title, author),
      })
      .select('id,title,author,cover_url,slug,rating')
      .single()
    data = created ?? null
  }

  return NextResponse.json({ dbBook: data })
}

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getFilterOptions } from '@/lib/search'
import { slugify } from '@/lib/utils'
import { TAG_SYNONYMS } from '@/lib/taxonomy'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ books: [], series: [], authors: [], tropes: [] })

  const lq = q.toLowerCase()

  const [booksRes, seriesRes, authorsRes, filterOpts] = await Promise.all([
    supabaseAdmin
      .from('books')
      .select('id, title, author, slug, cover_url, rating')
      .ilike('title', `%${q}%`)
      .order('rating_count', { ascending: false, nullsFirst: false })
      .limit(3),
    supabaseAdmin
      .from('books')
      .select('series_name, author')
      .not('series_name', 'is', null)
      .ilike('series_name', `%${q}%`)
      .limit(20),
    supabaseAdmin
      .from('books')
      .select('author')
      .not('author', 'is', null)
      .ilike('author', `%${q}%`)
      .limit(20),
    getFilterOptions(),
  ])

  // Books
  const books = (booksRes.data ?? []).map(b => ({
    id: b.id,
    label: b.title,
    sub: b.author,
    href: `/books/${b.slug}`,
    cover: b.cover_url,
    rating: b.rating,
  }))

  // Series — dedupe by series_name, pick first author seen
  const seriesMap = new Map()
  for (const r of seriesRes.data ?? []) {
    if (!seriesMap.has(r.series_name)) seriesMap.set(r.series_name, r.author)
  }
  const series = [...seriesMap.entries()].slice(0, 2).map(([name, author]) => ({
    label: name,
    sub: author,
    href: `/series/${slugify(name)}`,
  }))

  // Authors — dedupe
  const authorSet = new Set()
  for (const r of authorsRes.data ?? []) authorSet.add(r.author)
  const authors = [...authorSet].slice(0, 2).map(a => ({
    label: a,
    href: `/author/${encodeURIComponent(a)}`,
  }))

  // Tropes from cached filter options — also matches reader-facing synonyms
  // (e.g. typing "fake dating" surfaces the "Fake Relationship" trope)
  const tropes = (filterOpts.tropes ?? [])
    .filter(t => {
      if (t.toLowerCase().includes(lq)) return true
      const syns = TAG_SYNONYMS[t.toLowerCase()] ?? []
      return syns.some(s => s.includes(lq))
    })
    .slice(0, 2)
    .map(t => ({
      label: t,
      href: `/tropes/${slugify(t)}`,
    }))

  return NextResponse.json({ books, series, authors, tropes }, {
    headers: { 'Cache-Control': 's-maxage=10, stale-while-revalidate=60' },
  })
}

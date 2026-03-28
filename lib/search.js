import { createSupabaseServer, supabaseAdmin } from './supabase'

// ── Book search via RPC (used in search page + API route) ──────────────────
export async function searchBooks({
  query    = null,
  tropes   = [],
  subjects = [],
  series   = null,
  page     = 1,
  pageSize = 20,
} = {}) {
  const supabase = createSupabaseServer()
  const hasFilters = query || tropes.length || subjects.length || series

  // No filters: use direct table query with proper null-safe rating sort
  if (!hasFilters) {
    const from = (page - 1) * pageSize
    const { data, error, count } = await supabase
      .from('books')
      .select('id,title,author,cover_url,slug,tropes,subjects,series_name,series_number,rating,rating_count,buy_url_amazon_us,buy_url_amazon_in,buy_url_flipkart,price_amazon_in,price_amazon_us', { count: 'exact' })
      .order('rating', { ascending: false, nullsFirst: false })
      .range(from, from + pageSize - 1)

    if (error) throw new Error(error.message)
    const total = count ?? 0
    return { books: data ?? [], total, totalPages: Math.ceil(total / pageSize) }
  }

  let builder = supabase
    .from('books')
    .select('id,title,author,cover_url,slug,tropes,subjects,series_name,series_number,rating,rating_count,buy_url_amazon_us,buy_url_amazon_in,buy_url_flipkart,price_amazon_in,price_amazon_us', { count: 'exact' })

  if (query) {
    // Search each word across title, author, series_name using trigram-indexed ilike
    const words = query.trim().split(/\s+/).filter(Boolean)
    const orParts = words.flatMap(w => [
      `title.ilike.%${w}%`,
      `author.ilike.%${w}%`,
      `series_name.ilike.%${w}%`,
    ])
    builder = builder.or(orParts.join(','))
  }

  if (tropes.length)   builder = builder.overlaps('tropes', tropes)
  if (subjects.length) builder = builder.overlaps('subjects', subjects)
  if (series)          builder = builder.eq('series_name', series)

  const from = (page - 1) * pageSize
  const { data, error, count } = await builder
    .order('rating', { ascending: false, nullsFirst: false })
    .range(from, from + pageSize - 1)

  if (error) throw new Error(error.message)
  const total = count ?? 0
  return { books: data ?? [], total, totalPages: Math.ceil(total / pageSize) }
}

// ── Single book by slug ────────────────────────────────────────────────────
export async function getBookBySlug(slug) {
  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data
}

// ── Books in same series ───────────────────────────────────────────────────
export async function getSeriesBooks(seriesName, excludeId) {
  const supabase = createSupabaseServer()
  const { data } = await supabase
    .from('books')
    .select('id, title, slug, cover_url, series_number')
    .eq('series_name', seriesName)
    .neq('id', excludeId)
    .order('series_number', { ascending: true })

  return data ?? []
}

// ── More books by author ───────────────────────────────────────────────────
export async function getMoreByAuthor(author, excludeId) {
  const supabase = createSupabaseServer()
  const { data } = await supabase
    .from('books')
    .select('id, title, slug, cover_url, rating')
    .eq('author', author)
    .neq('id', excludeId)
    .order('rating', { ascending: false })
    .limit(6)

  return data ?? []
}

// ── Books by trope (trope page) ───────────────────────────────────────────
export async function getBooksByTrope(tropeName) {
  const supabase = createSupabaseServer()
  const { data } = await supabase
    .from('books')
    .select('id, title, author, slug, cover_url, tropes, rating, series_name, series_number')
    .contains('tropes', [tropeName])
    .order('rating', { ascending: false, nullsFirst: false })

  return data ?? []
}

// ── Books by author (author page) ──────────────────────────────────────────
export async function getBooksByAuthor(author) {
  const supabase = createSupabaseServer()
  const { data } = await supabase
    .from('books')
    .select('*')
    .eq('author', author)
    .order('series_name', { ascending: true })
    .order('series_number', { ascending: true })

  return data ?? []
}

// ── Paginate all book rows via admin client (bypasses 1000-row default cap) ─
async function paginateBooks(select) {
  const PAGE = 1000
  const all  = []
  let offset = 0
  while (true) {
    const { data } = await supabaseAdmin
      .from('books')
      .select(select)
      .range(offset, offset + PAGE - 1)
    if (!data?.length) break
    all.push(...data)
    if (data.length < PAGE) break
    offset += PAGE
  }
  return all
}

// ── All distinct tropes via admin client (safe for generateStaticParams) ──
export async function getAllTropeSlugs() {
  const rows = await paginateBooks('tropes')
  return [...new Set(rows.flatMap(r => r.tropes ?? []))].sort()
}

// ── Distinct tropes + subjects (for filter dropdowns) ─────────────────────
export async function getFilterOptions() {
  const supabase = createSupabaseServer()

  // Try the RPC first with a high limit to capture all distinct values
  const [tropesRes, subjectsRes] = await Promise.all([
    supabase.rpc('distinct_array_values', { col: 'tropes' }).limit(5000),
    supabase.rpc('distinct_array_values', { col: 'subjects' }).limit(5000),
  ])

  // RPC succeeded
  if (!tropesRes.error && tropesRes.data?.length) {
    return {
      tropes:   tropesRes.data.map(r => r.value).sort(),
      subjects: (subjectsRes.data ?? []).map(r => r.value).sort(),
    }
  }

  // Fallback: paginate all books so we don't hit the 1000-row cap
  const rows     = await paginateBooks('tropes, subjects')
  const tropes   = [...new Set(rows.flatMap(r => r.tropes   ?? []))].sort()
  const subjects = [...new Set(rows.flatMap(r => r.subjects ?? []))].sort()
  return { tropes, subjects }
}

// ── Most-used tropes ranked by book count (for homepage hero) ─────────────
export async function getPopularTropes(limit = 20) {
  const rows   = await paginateBooks('tropes')
  const counts = {}
  for (const { tropes } of rows) {
    for (const t of tropes ?? []) {
      counts[t] = (counts[t] ?? 0) + 1
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([trope]) => trope)
}

// ── Personalised books for homepage ───────────────────────────────────────
export async function getPersonalizedBooks({ tropes = [], subjects = [], authors = [] } = {}) {
  const supabase = createSupabaseServer()
  const queries  = []

  if (tropes.length || subjects.length) {
    let q = supabase
      .from('books')
      .select('id,title,author,cover_url,slug,tropes,rating,series_name')
      .not('cover_url', 'is', null)
      .neq('cover_url', '')
      .order('rating', { ascending: false })
      .limit(12)

    if (tropes.length)   q = q.overlaps('tropes', tropes)
    if (subjects.length) q = q.overlaps('subjects', subjects)
    queries.push(q)
  }

  if (authors.length) {
    queries.push(
      supabase
        .from('books')
        .select('id,title,author,cover_url,slug,tropes,rating,series_name')
        .not('cover_url', 'is', null)
        .neq('cover_url', '')
        .in('author', authors)
        .order('rating', { ascending: false })
        .limit(12)
    )
  }

  if (!queries.length) return []

  const results = await Promise.all(queries)
  const seen    = new Set()
  const books   = []
  for (const { data } of results) {
    for (const book of data ?? []) {
      if (!seen.has(book.id)) { seen.add(book.id); books.push(book) }
    }
  }
  return books.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 12)
}

// ── Featured books for homepage ────────────────────────────────────────────
export async function getFeaturedBooks(limit = 12) {
  const supabase = createSupabaseServer()
  const { data } = await supabase
    .from('books')
    .select('id, title, author, slug, cover_url, tropes, rating, series_name')
    .not('cover_url', 'is', null)
    .neq('cover_url', '')
    .order('rating', { ascending: false })
    .limit(limit)

  return data ?? []
}

// ── All slugs (for sitemap + static params) ───────────────────────────────
export async function getAllSlugs() {
  const { data } = await supabaseAdmin
    .from('books')
    .select('slug')
    .not('slug', 'is', null)

  return (data ?? []).map(r => r.slug)
}

// ── All distinct authors (for sitemap) ────────────────────────────────────
export async function getAllAuthors() {
  const { data } = await supabaseAdmin
    .from('books')
    .select('author')
    .not('author', 'is', null)

  const unique = [...new Set((data ?? []).map(r => r.author).filter(Boolean))]
  return unique
}

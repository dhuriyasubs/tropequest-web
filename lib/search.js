import { unstable_cache } from 'next/cache'
import { createSupabaseServer, supabaseAdmin } from './supabase'

// ── Book search via RPC (used in search page + API route) ──────────────────
export async function searchBooks({
  query    = null,
  tropes   = [],
  subjects = [],
  genres   = [],
  series   = null,
  page     = 1,
  pageSize = 20,
} = {}) {
  const supabase = createSupabaseServer()
  const hasFilters = query || tropes.length || subjects.length || genres.length || series

  // No filters: use direct table query with proper null-safe rating sort
  if (!hasFilters) {
    const from = (page - 1) * pageSize
    const { data, error, count } = await supabase
      .from('books')
      .select('id,title,author,cover_url,slug,tropes,subjects,genres,primary_genre,series_name,series_number,rating,rating_count,buy_url_amazon_us,buy_url_amazon_in,buy_url_flipkart,price_amazon_in,price_amazon_us', { count: 'exact' })
      .order('rating', { ascending: false, nullsFirst: false })
      .range(from, from + pageSize - 1)

    if (error) throw new Error(error.message)
    const total = count ?? 0
    return { books: data ?? [], total, totalPages: Math.ceil(total / pageSize) }
  }

  let builder = supabase
    .from('books')
    .select('id,title,author,cover_url,slug,tropes,subjects,genres,primary_genre,series_name,series_number,rating,rating_count,buy_url_amazon_us,buy_url_amazon_in,buy_url_flipkart,price_amazon_in,price_amazon_us', { count: 'exact' })

  if (query) {
    // Each word must match at least one field (AND between words, OR between fields per word)
    // This prevents common words like "of" from flooding results
    const words = query.trim().split(/\s+/).filter(Boolean)
    for (const w of words) {
      builder = builder.or(
        `title.ilike.%${w}%,author.ilike.%${w}%,series_name.ilike.%${w}%`
      )
    }
  }

  if (tropes.length)   builder = builder.overlaps('tropes', tropes)
  if (subjects.length) builder = builder.overlaps('subjects', subjects)
  if (genres.length)   builder = builder.overlaps('genres', genres)
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
export const getPopularTropes = unstable_cache(
  async (limit = 20) => {
    const rows   = await paginateBooks('tropes')
    const counts = {}
    for (const { tropes } of rows) {
      for (const t of tropes ?? []) counts[t] = (counts[t] ?? 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([trope]) => trope)
  },
  ['popular-tropes'],
  { revalidate: 3600 }
)

// ── Distinct genres ranked by book count ──────────────────────────────────
export const getPopularGenres = unstable_cache(
  async (limit = 50) => {
    const rows   = await paginateBooks('genres')
    const counts = {}
    for (const { genres } of rows) {
      for (const g of genres ?? []) counts[g] = (counts[g] ?? 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([genre]) => genre)
  },
  ['popular-genres'],
  { revalidate: 3600 }
)

// ── Personalised books for homepage ───────────────────────────────────────
export async function getPersonalizedBooks({ tropes = [], subjects = [], authors = [], excludeIds = [] } = {}) {
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

    if (tropes.length)      q = q.overlaps('tropes', tropes)
    if (subjects.length)    q = q.overlaps('subjects', subjects)
    if (excludeIds.length)  q = q.not('id', 'in', `(${excludeIds.join(',')})`)
    queries.push(q)
  }

  if (authors.length) {
    let q = supabase
      .from('books')
      .select('id,title,author,cover_url,slug,tropes,rating,series_name')
      .not('cover_url', 'is', null)
      .neq('cover_url', '')
      .in('author', authors)
      .order('rating', { ascending: false })
      .limit(12)

    if (excludeIds.length)  q = q.not('id', 'in', `(${excludeIds.join(',')})`)
    queries.push(q)
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

// ── "Complete the series" — series with read books, all entries + shelf status
export async function getSeriesCompletionBooks(userId) {
  const supabase = createSupabaseServer()

  // Get all shelf entries with book details
  const { data: shelfRows } = await supabase
    .from('shelf')
    .select('book_id, status, books(id, series_name)')
    .eq('user_id', userId)

  if (!shelfRows?.length) return []

  // Map bookId → shelf status
  const shelfStatus = {}
  for (const r of shelfRows) shelfStatus[r.book_id] = r.status

  // Series where user has at least one 'read' book
  const readSeries = [...new Set(
    shelfRows
      .filter(r => r.status === 'read' && r.books?.series_name)
      .map(r => r.books.series_name)
  )]

  if (!readSeries.length) return []

  // All books in those series, ordered
  const { data } = await supabase
    .from('books')
    .select('id, title, author, cover_url, slug, series_name, series_number, rating')
    .in('series_name', readSeries)
    .order('series_name', { ascending: true })
    .order('series_number', { ascending: true, nullsFirst: false })

  // Include all books with shelf status so UI can show read/unread badges
  const books = (data ?? [])
    .map(b => ({ ...b, shelfStatus: shelfStatus[b.id] ?? null }))

  // Group by series
  const seriesMap = new Map()
  for (const b of books) {
    if (!seriesMap.has(b.series_name)) seriesMap.set(b.series_name, [])
    seriesMap.get(b.series_name).push(b)
  }

  return [...seriesMap.entries()]
    .map(([seriesName, bks]) => ({ seriesName, books: bks }))
    .filter(({ books: bks }) => bks.some(b => b.shelfStatus !== 'read'))
}

// ── "Because you read X" — trope-similar books ────────────────────────────
export async function getBecauseYouReadBooks(userId) {
  const supabase = createSupabaseServer()

  // Most recently read book with tropes
  const { data: readRows } = await supabase
    .from('shelf')
    .select('book_id, created_at, books(id, title, slug, tropes, primary_genre)')
    .eq('user_id', userId)
    .eq('status', 'read')
    .order('created_at', { ascending: false })
    .limit(5)

  const seedRow = readRows?.find(r => r.books?.tropes?.length > 0)
  if (!seedRow) return null

  const seed = seedRow.books
  const shelfIds = (await supabase
    .from('shelf')
    .select('book_id')
    .eq('user_id', userId)
  ).data?.map(r => r.book_id) ?? []

  const excludeIds = [seed.id, ...shelfIds]
  let q = supabase
    .from('books')
    .select('id, title, author, cover_url, slug, tropes, rating, series_name')
    .overlaps('tropes', seed.tropes.slice(0, 5))
    .not('cover_url', 'is', null)
    .neq('cover_url', '')
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .order('rating', { ascending: false, nullsFirst: false })

  // Constrain to same primary_genre for relevance
  if (seed.primary_genre) q = q.eq('primary_genre', seed.primary_genre)

  const { data } = await q.limit(12)

  // If genre filter yields too few, fall back without it
  if ((data ?? []).length < 4 && seed.primary_genre) {
    const { data: fallback } = await supabase
      .from('books')
      .select('id, title, author, cover_url, slug, tropes, rating, series_name')
      .overlaps('tropes', seed.tropes.slice(0, 5))
      .not('cover_url', 'is', null)
      .neq('cover_url', '')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(12)
    return { seedTitle: seed.title, seedSlug: seed.slug, seedTropes: seed.tropes ?? [], books: fallback ?? [] }
  }

  return { seedTitle: seed.title, seedSlug: seed.slug, seedTropes: seed.tropes ?? [], books: data ?? [] }
}

// ── Featured books for homepage ────────────────────────────────────────────
export const getFeaturedBooks = unstable_cache(
  async (limit = 12) => {
    const { data } = await supabaseAdmin
      .from('books')
      .select('id, title, author, slug, cover_url, tropes, rating, series_name')
      .not('cover_url', 'is', null)
      .neq('cover_url', '')
      .order('rating', { ascending: false })
      .limit(limit)
    return data ?? []
  },
  ['featured-books'],
  { revalidate: 3600 }
)

// ── Random books for Surprise Me ─────────────────────────────────────────
export async function getRandomBooks(limit = 20, excludeIds = []) {
  const { count } = await supabaseAdmin
    .from('books')
    .select('*', { count: 'exact', head: true })
  if (!count) return []

  const need = limit * 2 + excludeIds.length
  const maxOffset = Math.max(0, count - need)
  const offset = Math.floor(Math.random() * maxOffset)
  const excludeSet = new Set(excludeIds.map(String))

  const { data } = await supabaseAdmin
    .from('books')
    .select('id, title, author, cover_url, slug, series_name, series_number, rating, rating_count, tropes, description')
    .range(offset, offset + need - 1)

  return (data ?? []).filter(b => !excludeSet.has(String(b.id))).slice(0, limit)
}

// ── Interest-weighted Surprise Me books ──────────────────────────────────
export async function getSurpriseBooks(userId = null, excludeIds = [], limit = 15) {
  let topTropes = []

  if (userId) {
    const [interestsRes, shelfRes, tbrRes] = await Promise.all([
      supabaseAdmin.from('user_interests').select('tropes, subjects').eq('user_id', userId).single(),
      supabaseAdmin.from('shelf').select('book_id').eq('user_id', userId).eq('status', 'read').limit(30),
      supabaseAdmin.from('tbr').select('book_id').eq('user_id', userId).limit(30),
    ])

    const tropeCounts = {}
    // Explicit interests get 3× weight
    for (const t of interestsRes.data?.tropes ?? []) tropeCounts[t] = (tropeCounts[t] || 0) + 3
    for (const t of interestsRes.data?.subjects ?? []) tropeCounts[t] = (tropeCounts[t] || 0) + 3

    // Derive implicit interests from shelf + TBR books
    const bookIds = [
      ...(shelfRes.data ?? []).map(r => r.book_id),
      ...(tbrRes.data ?? []).map(r => r.book_id),
    ]
    if (bookIds.length) {
      const { data: bookTropes } = await supabaseAdmin
        .from('books').select('tropes').in('id', bookIds)
      for (const b of bookTropes ?? []) {
        for (const t of b.tropes ?? []) tropeCounts[t] = (tropeCounts[t] || 0) + 1
      }
    }

    topTropes = Object.keys(tropeCounts)
      .sort((a, b) => tropeCounts[b] - tropeCounts[a])
      .slice(0, 10)
  }

  const safeExclude = excludeIds.length ? excludeIds : [-1]

  if (topTropes.length) {
    const wantFromInterests = Math.ceil(limit * 0.7)

    const { data: pool } = await supabaseAdmin
      .from('books')
      .select('id, title, author, cover_url, slug, series_name, series_number, rating, rating_count, tropes, description')
      .overlaps('tropes', topTropes)
      .not('id', 'in', `(${safeExclude.join(',')})`)
      .not('cover_url', 'is', null)
      .neq('cover_url', '')
      .order('rating', { ascending: false })
      .limit(wantFromInterests * 4)

    // Shuffle the interest pool for variety instead of always top-rated
    const shuffled = (pool ?? []).sort(() => Math.random() - 0.5).slice(0, wantFromInterests)
    const combinedExclude = [...excludeIds, ...shuffled.map(b => b.id)]
    const randomFill = await getRandomBooks(limit - shuffled.length, combinedExclude)

    return [...shuffled, ...randomFill].sort(() => Math.random() - 0.5)
  }

  return getRandomBooks(limit, excludeIds)
}

// ── All slugs (for sitemap + static params) ───────────────────────────────
export async function getAllSlugs() {
  const { data } = await supabaseAdmin
    .from('books')
    .select('slug')
    .not('slug', 'is', null)

  return (data ?? []).map(r => r.slug)
}

// ── All distinct series (for browse page + static params) ─────────────────
export async function getAllSeries() {
  const rows = await paginateBooks('series_name, author, cover_url, rating')
  const map  = new Map()
  for (const r of rows) {
    if (!r.series_name) continue
    if (!map.has(r.series_name)) {
      map.set(r.series_name, { series_name: r.series_name, author: r.author, cover_url: r.cover_url, count: 0 })
    }
    map.get(r.series_name).count++
  }
  return [...map.values()].sort((a, b) => a.series_name.localeCompare(b.series_name))
}

// ── All books in a series (for series detail page) ─────────────────────────
export async function getBooksBySeries(seriesName) {
  const supabase = createSupabaseServer()
  const { data } = await supabase
    .from('books')
    .select('id, title, author, cover_url, slug, series_name, series_number, rating, rating_count, tropes')
    .eq('series_name', seriesName)
    .order('series_number', { ascending: true, nullsFirst: false })
  return data ?? []
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

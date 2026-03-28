import { createSupabaseServer } from './supabase'
import { supabaseAdmin } from './supabase'

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

  const { data, error } = await supabase.rpc('search_books', {
    query_text:      query || null,
    filter_tropes:   tropes.length   ? tropes   : null,
    filter_subjects: subjects.length ? subjects : null,
    filter_series:   series || null,
    page_num:        page,
    page_size:       pageSize,
  })

  if (error) throw new Error(error.message)
  return {
    books:      data ?? [],
    total:      data?.[0]?.total_count ?? 0,
    totalPages: Math.ceil((data?.[0]?.total_count ?? 0) / pageSize),
  }
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

// ── Distinct tropes + subjects (for filter dropdowns) ─────────────────────
export async function getFilterOptions() {
  const supabase = createSupabaseServer()

  // Try the RPC first; fall back to fetching all books and unnesting in JS
  const [tropesRes, subjectsRes] = await Promise.all([
    supabase.rpc('distinct_array_values', { col: 'tropes' }),
    supabase.rpc('distinct_array_values', { col: 'subjects' }),
  ])

  // RPC succeeded
  if (!tropesRes.error && tropesRes.data?.length) {
    return {
      tropes:   tropesRes.data.map(r => r.value).sort(),
      subjects: (subjectsRes.data ?? []).map(r => r.value).sort(),
    }
  }

  // Fallback: pull tropes + subjects columns and flatten in JS
  const { data } = await supabase
    .from('books')
    .select('tropes, subjects')

  const tropes   = [...new Set((data ?? []).flatMap(r => r.tropes   ?? []))].sort()
  const subjects = [...new Set((data ?? []).flatMap(r => r.subjects ?? []))].sort()
  return { tropes, subjects }
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

// ── Log affiliate click ────────────────────────────────────────────────────
export async function logClick(bookId, store) {
  const supabase = createSupabaseBrowser()
  await supabase.from('click_events').insert({ book_id: bookId, store })
}

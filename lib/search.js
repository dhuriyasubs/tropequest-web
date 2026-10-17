import { unstable_cache } from 'next/cache'
import { createSupabaseServer, supabaseAdmin } from './supabase'
import { TROPES, GENRES as CANONICAL_GENRES, RELATIONSHIP_TYPES, REPRESENTATION, resolveSynonym } from './taxonomy'

// ── Trope normalization helpers ────────────────────────────────────────────
// Canonical key: lowercase, hyphens → spaces, collapse whitespace
function normKey(t) {
  return t.trim().toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ')
}

// Title-case a normalized key for display
function toTitleCase(s) {
  return s.replace(/\b\w/g, c => c.toUpperCase())
}

// All likely DB variants for a given trope name (for overlaps queries).
// Resolves reader-facing synonyms (e.g. "fake dating") to the canonical DB value first.
function tropeVariants(name) {
  const key = resolveSynonym(normKey(name))
  const title = toTitleCase(key)
  const hyph = key.replace(/ /g, '-')
  const titleHyph = title.replace(/ /g, '-')
  return [...new Set([name, key, title, hyph, titleHyph])]
}

// Deduplicate a raw trope list by canonical key, keeping title-case form
function dedupetropes(rawTropes) {
  const seen = new Map()
  for (const t of rawTropes) {
    const key = normKey(t)
    if (!seen.has(key)) seen.set(key, toTitleCase(key))
  }
  return [...seen.values()].sort()
}

// Negated overlaps() — excludes rows where `column` shares any element with `values`.
// supabase-js has no notOverlaps() helper, so build the raw PostgREST filter by hand.
// Must explicitly allow NULL columns through: in SQL, `NOT (NULL && array)` evaluates to
// NULL (not TRUE), so a plain `.not(col, 'ov', ...)` silently drops every row where the
// column was never populated — the opposite of what "exclude X" should do to books with
// no data for that field at all.
function notOverlaps(builder, column, values) {
  if (!values?.length) return builder
  const literal = `{${values.map(v => `"${String(v).replace(/"/g, '\\"')}"`).join(',')}}`
  return builder.or(`${column}.is.null,${column}.not.ov.${literal}`)
}

// ── Core genres TropeQuest serves ─────────────────────────────────────────
export const CORE_GENRES = [
  // Romance
  'romance', 'dark romance', 'contemporary romance', 'rom com',
  'new adult', 'omegaverse',
  // Fantasy
  'fantasy', 'romantasy', 'high fantasy', 'epic fantasy', 'urban fantasy',
  'portal fantasy', 'grimdark', 'steampunk',
  // Paranormal
  'paranormal', 'magic', 'time travel', 'angels', 'demons', 'fae',
  'vampires', 'witches', 'monsters', 'orcs', 'shapeshifters', 'werewolves',
  'dragon shifter', 'bear shifter', 'lion shifter', 'tiger shifter',
  // Sci-Fi
  'science fiction', 'aliens', 'dystopian',
  // Thriller & Mystery
  'thriller', 'crime', 'mystery', 'suspense', 'gothic', 'domestic suspense',
  'psychological thriller', 'cozy mystery', 'police procedural',
  'legal thriller', 'historical thriller',
  // Other
  'young adult', 'horror',
]

// ── Book search via RPC (used in search page + API route) ──────────────────
export async function searchBooks({
  query             = null,
  tropes            = [],
  subjects          = [],
  genres            = [],
  representation    = [],
  series            = null,
  spice          = null,
  relationshipTypes = [],
  excludeTropes         = [],
  excludeGenres         = [],
  excludeRepresentation = [],
  page              = 1,
  pageSize          = 20,
} = {}) {
  const supabase = createSupabaseServer()
  const hasFilters = query || tropes.length || subjects.length || genres.length || representation.length
    || series || spice || relationshipTypes.length
    || excludeTropes.length || excludeGenres.length || excludeRepresentation.length

  // No filters: use direct table query with proper null-safe rating sort
  if (!hasFilters) {
    const from = (page - 1) * pageSize
    let q = supabase
      .from('books')
      .select('id,title,author,cover_url,slug,tropes,genres,series_name,series_number,rating,rating_count,description,buy_url_amazon_us,buy_url_amazon_in,buy_url_flipkart,buy_url_abebooks,buy_url_bookscape,buy_url_wattpad,buy_url_stck,buy_url_royal_road,buy_url_audible,is_kindle_unlimited,price_amazon_in,price_amazon_us,price_abebooks,spice_rating', { count: 'exact' })
      .overlaps('genres', CORE_GENRES)
      .not('cover_url', 'is', null)
      .neq('cover_url', '')
    if (spice) q = q.eq('spice_rating', spice)
    const { data, error, count } = await q
      .order('rating', { ascending: false, nullsFirst: false })
      .range(from, from + pageSize - 1)

    if (error) throw new Error(error.message)
    const total = count ?? 0
    return { books: data ?? [], total, totalPages: Math.ceil(total / pageSize) }
  }

  const SELECT = 'id,title,author,cover_url,slug,tropes,genres,series_name,series_number,rating,rating_count,description,buy_url_amazon_us,buy_url_amazon_in,buy_url_flipkart,buy_url_abebooks,buy_url_bookscape,buy_url_wattpad,buy_url_stck,buy_url_royal_road,buy_url_audible,is_kindle_unlimited,price_amazon_in,price_amazon_us,price_abebooks,spice_rating'
  const from = (page - 1) * pageSize

  function applyCommonFilters(b) {
    if (tropes.length)            b = b.overlaps('tropes', tropes.flatMap(tropeVariants))
    if (subjects.length)          b = b.overlaps('subjects', subjects)
    if (genres.length)            b = b.overlaps('genres', genres)
    if (representation.length)    b = b.overlaps('representation', representation)
    if (series)                   b = b.eq('series_name', series)
    if (spice)                 b = b.eq('spice_rating', spice)
    if (relationshipTypes.length) b = b.overlaps('relationship_type', relationshipTypes)
    if (excludeTropes.length)         b = notOverlaps(b, 'tropes', excludeTropes.flatMap(tropeVariants))
    if (excludeGenres.length)         b = notOverlaps(b, 'genres', excludeGenres)
    if (excludeRepresentation.length) b = notOverlaps(b, 'representation', excludeRepresentation)
    return b
  }

  let builder = supabase
    .from('books')
    .select(SELECT, { count: 'exact' })
    .overlaps('genres', CORE_GENRES)

  if (query) {
    // Each word must match at least one field (AND between words, OR between fields per word)
    // This prevents common words like "of" from flooding results
    const words = query.trim().split(/\s+/).filter(Boolean)
    for (const w of words) {
      builder = builder.or(
        `title.ilike.%${w}%,author.ilike.%${w}%,series_name.ilike.%${w}%,description.ilike.%${w}%`
      )
    }
  }

  builder = applyCommonFilters(builder)

  // When a text query is provided, also search for partial trope/genre matches.
  // PostgREST can't do substring matching on array elements directly, so we:
  //   1. Fetch all distinct trope/genre values (fast RPC)
  //   2. Filter them in JS for substring matches
  //   3. Use overlaps() with the matched values (guaranteed to work)
  let tropeQueryPromise = null
  let genreQueryPromise = null
  if (query?.trim()) {
    const q = query.trim().toLowerCase()

    const { tropes: allTropes, genres: allGenres } = await getAllTropesAndGenres()

    const matchingTropes = allTropes.filter(t => t.toLowerCase().includes(q))
    const matchingGenres = allGenres.filter(g => g.toLowerCase().includes(q))

    if (matchingTropes.length) {
      let tb = supabaseAdmin.from('books').select(SELECT).overlaps('genres', CORE_GENRES)
        .overlaps('tropes', matchingTropes)
      tb = applyCommonFilters(tb)
      tropeQueryPromise = tb.order('rating', { ascending: false, nullsFirst: false }).range(0, pageSize - 1)
    }

    if (matchingGenres.length) {
      let gb = supabaseAdmin.from('books').select(SELECT).overlaps('genres', CORE_GENRES)
        .overlaps('genres', matchingGenres)
      gb = applyCommonFilters(gb)
      genreQueryPromise = gb.order('rating', { ascending: false, nullsFirst: false }).range(0, pageSize - 1)
    }
  }

  const [{ data, error, count }, tropeRes, genreRes] = await Promise.all([
    builder.order('rating', { ascending: false, nullsFirst: false }).range(from, from + pageSize - 1),
    tropeQueryPromise ?? Promise.resolve({ data: [] }),
    genreQueryPromise  ?? Promise.resolve({ data: [] }),
  ])

  if (error) throw new Error(error.message)

  // Merge trope/genre results first (most relevant), then text-match results — dedup by id
  const seen = new Set((data ?? []).map(b => b.id))
  const extra = [
    ...(tropeRes.data ?? []),
    ...(genreRes.data ?? []),
  ].filter(b => {
    if (seen.has(b.id)) return false
    seen.add(b.id)
    return true
  })
  const books = [...extra, ...(data ?? [])].slice(0, pageSize)

  const total = (count ?? 0) + extra.length
  return { books, total, totalPages: Math.ceil(total / pageSize) }
}

// ── Books similar to a given book (by trope overlap) ─────────────────────
export const getSimilarBooks = unstable_cache(
  async ({ tropes = [], genres = [], storyTags = [], excludeId = null, limit = 24 } = {}) => {
    if (!tropes.length && !genres.length && !storyTags.length) return []

    const SELECT = 'id,title,author,cover_url,slug,tropes,genres,story_tags,rating,series_name,series_number,rating_count,description,buy_url_amazon_us,buy_url_amazon_in,buy_url_flipkart,buy_url_abebooks,buy_url_bookscape,buy_url_wattpad,buy_url_stck,buy_url_royal_road,buy_url_audible,is_kindle_unlimited,price_amazon_in,price_amazon_us,price_abebooks'
    const base = () => {
      let q = supabaseAdmin.from('books').select(SELECT)
        .overlaps('genres', CORE_GENRES)
        .not('cover_url', 'is', null)
        .neq('cover_url', '')
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(limit * 3)
      if (excludeId) q = q.neq('id', excludeId)
      return q
    }

    const queries = []
    if (tropes.length) queries.push(base().overlaps('tropes', tropes.flatMap(tropeVariants)))
    if (genres.length) queries.push(base().overlaps('genres', genres))
    if (storyTags.length) queries.push(base().overlaps('story_tags', storyTags))

    const results = await Promise.all(queries)
    const scoreMap = new Map()
    for (const { data } of results) {
      for (const book of (data ?? [])) {
        if (scoreMap.has(book.id)) {
          scoreMap.get(book.id)._score++
        } else {
          scoreMap.set(book.id, { ...book, _score: 1 })
        }
      }
    }

    return [...scoreMap.values()]
      .sort((a, b) => b._score - a._score || (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, limit)
  },
  ['get-similar-books'],
  { revalidate: 3600 }
)

// ── Single book by slug ────────────────────────────────────────────────────
// Uses supabaseAdmin (no cookies()) so this can be wrapped in unstable_cache —
// book data is public, not user-scoped, so RLS bypass here is safe.
export const getBookBySlug = unstable_cache(
  async (slug) => {
    const { data, error } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // no matching row — genuinely not found
      throw new Error(`getBookBySlug(${slug}): ${error.message}`) // transient error — don't cache as not-found
    }
    return data
  },
  ['get-book-by-slug'],
  { revalidate: 3600 }
)

// ── Books in same series ───────────────────────────────────────────────────
export const getSeriesBooks = unstable_cache(
  async (seriesName, excludeId) => {
    const { data } = await supabaseAdmin
      .from('books')
      .select('id, title, slug, cover_url, series_number')
      .eq('series_name', seriesName)
      .neq('id', excludeId)

    const books = data ?? []
    books.sort((a, b) => (parseFloat(a.series_number) || 999) - (parseFloat(b.series_number) || 999))
    return books
  },
  ['get-series-books'],
  { revalidate: 3600 }
)

// ── More books by author ───────────────────────────────────────────────────
export const getMoreByAuthor = unstable_cache(
  async (author, excludeId, excludeSeries = null) => {
    let query = supabaseAdmin
      .from('books')
      .select('id, title, slug, cover_url, rating, series_name, series_number')
      .eq('author', author)
      .neq('id', excludeId)
      .order('series_name', { ascending: true, nullsFirst: false })
      .order('series_number', { ascending: true, nullsFirst: false })
      .limit(100)

    if (excludeSeries) query = query.neq('series_name', excludeSeries)

    const { data } = await query
    return data ?? []
  },
  ['get-more-by-author'],
  { revalidate: 3600 }
)

// ── Books by trope (trope page) ───────────────────────────────────────────
export async function getBooksByTrope(tropeName) {
  const supabase = createSupabaseServer()
  const { data } = await supabase
    .from('books')
    .select('id, title, author, slug, cover_url, tropes, rating, series_name, series_number')
    .overlaps('tropes', tropeVariants(tropeName))
    .overlaps('genres', CORE_GENRES)
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
async function paginateBooks(select, coreOnly = false) {
  const PAGE = 1000
  const all  = []
  let offset = 0
  while (true) {
    let q = supabaseAdmin.from('books').select(select)
    if (coreOnly) q = q.overlaps('genres', CORE_GENRES)
    const { data } = await q.range(offset, offset + PAGE - 1)
    if (!data?.length) break
    all.push(...data)
    if (data.length < PAGE) break
    offset += PAGE
  }
  return all
}

// ── All distinct tropes via admin client (safe for generateStaticParams) ──
export async function getAllTropeSlugs() {
  const rows = await paginateBooks('tropes', true)
  return dedupetropes(rows.flatMap(r => r.tropes ?? []))
}

// ── Distinct tropes + subjects (for filter dropdowns) ─────────────────────
export async function getFilterOptions() {
  // Use supabaseAdmin so this works in sitemap (no request/cookies context)
  const supabase = supabaseAdmin

  // Try the RPC first with a high limit to capture all distinct values
  const [tropesRes, subjectsRes] = await Promise.all([
    supabase.rpc('distinct_array_values', { col: 'tropes' }).limit(5000),
    supabase.rpc('distinct_array_values', { col: 'subjects' }).limit(5000),
  ])

  // RPC succeeded
  if (!tropesRes.error && tropesRes.data?.length) {
    return {
      tropes:   dedupetropes(tropesRes.data.map(r => r.value)),
      subjects: (subjectsRes.data ?? []).map(r => r.value).sort(),
    }
  }

  // Fallback: paginate all books so we don't hit the 1000-row cap
  const rows   = await paginateBooks('tropes, genres', true)
  const tropes = dedupetropes(rows.flatMap(r => r.tropes ?? []))
  return { tropes, subjects: [] }
}

// ── Cached flat list of all distinct tropes + genres (for search matching) ──
const getAllTropesAndGenres = unstable_cache(
  async () => {
    const rows   = await paginateBooks('tropes, genres', true)
    const tropes = [...new Set(rows.flatMap(r => r.tropes ?? []))].sort()
    const genres = [...new Set(rows.flatMap(r => r.genres ?? []))].sort()
    return { tropes, genres }
  },
  ['all-tropes-genres'],
  { revalidate: 3600 }
)

// ── Tropes with enough books to be worth indexing (for sitemap) ───────────
export async function getTropesForSitemap(minBooks = 8) {
  const rows   = await paginateBooks('tropes, genres', true)
  const counts = {}
  for (const { tropes } of rows) {
    for (const t of tropes ?? []) {
      const key = normKey(t)
      counts[key] = (counts[key] ?? 0) + 1
    }
  }
  return Object.entries(counts)
    .filter(([, count]) => count >= minBooks)
    .map(([key]) => toTitleCase(key))
}

// ── Most-used tropes ranked by book count (for homepage hero) ─────────────
const CANONICAL_TROPE_KEYS = new Set(TROPES.map(normKey))

export const getPopularTropes = unstable_cache(
  async (limit = 20) => {
    const rows   = await paginateBooks('tropes, genres', true)
    const counts = {}
    for (const { tropes } of rows) {
      for (const t of tropes ?? []) {
        const key = normKey(t)
        if (!CANONICAL_TROPE_KEYS.has(key)) continue
        counts[key] = (counts[key] ?? 0) + 1
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key]) => toTitleCase(key))
  },
  ['popular-tropes'],
  { revalidate: 3600 }
)

// ── Distinct genres ranked by book count ──────────────────────────────────
const CANONICAL_GENRE_KEYS = new Set(CANONICAL_GENRES.map(g => g.toLowerCase()))

export const getPopularGenres = unstable_cache(
  async (limit = 50) => {
    const rows   = await paginateBooks('genres', true)
    const counts = {}
    for (const { genres } of rows) {
      for (const g of genres ?? []) {
        if (!CANONICAL_GENRE_KEYS.has(g.toLowerCase())) continue
        counts[g.toLowerCase()] = (counts[g.toLowerCase()] ?? 0) + 1
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([genre]) => genre)
  },
  ['popular-genres'],
  { revalidate: 3600 }
)

// ── Distinct relationship types that appear in at least 1 book ───────────
const CANONICAL_REL_KEYS = new Set(RELATIONSHIP_TYPES.map(r => r.toLowerCase()))

export const getPopularRelationshipTypes = unstable_cache(
  async () => {
    const rows = await paginateBooks('relationship_type', true)
    const seen = new Set()
    for (const { relationship_type } of rows) {
      for (const r of relationship_type ?? []) {
        if (CANONICAL_REL_KEYS.has(r.toLowerCase())) seen.add(r.toLowerCase())
      }
    }
    return RELATIONSHIP_TYPES.filter(r => seen.has(r.toLowerCase()))
  },
  ['popular-relationship-types'],
  { revalidate: 3600 }
)

// ── Distinct representation values that appear in at least 1 book ─────────
const CANONICAL_REPRESENTATION_KEYS = new Set(REPRESENTATION.map(r => r.toLowerCase()))

export const getPopularRepresentation = unstable_cache(
  async () => {
    const rows = await paginateBooks('representation', true)
    const seen = new Set()
    for (const { representation } of rows) {
      for (const r of representation ?? []) {
        if (CANONICAL_REPRESENTATION_KEYS.has(r.toLowerCase())) seen.add(r.toLowerCase())
      }
    }
    return REPRESENTATION.filter(r => seen.has(r.toLowerCase()))
  },
  ['popular-representation'],
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
      .overlaps('genres', CORE_GENRES)
      .not('cover_url', 'is', null)
      .neq('cover_url', '')
      .order('rating', { ascending: false })
      .limit(12)

    if (tropes.length)      q = q.overlaps('tropes', tropes.flatMap(tropeVariants))
    if (subjects.length)    q = q.overlaps('subjects', subjects)
    if (excludeIds.length)  q = q.not('id', 'in', `(${excludeIds.join(',')})`)
    queries.push(q)
  }

  if (authors.length) {
    let q = supabase
      .from('books')
      .select('id,title,author,cover_url,slug,tropes,rating,series_name')
      .overlaps('genres', CORE_GENRES)
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
    .select('book_id, created_at, books(id, title, tropes, genres)')
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
    .overlaps('genres', CORE_GENRES)
    .not('cover_url', 'is', null)
    .neq('cover_url', '')
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .order('rating', { ascending: false, nullsFirst: false })

  if (seed.genres?.length) q = q.overlaps('genres', seed.genres)

  const { data } = await q.limit(12)

  // If genre filter yields too few, fall back without it
  if ((data ?? []).length < 4 && seed.genres?.length) {
    const { data: fallback } = await supabase
      .from('books')
      .select('id, title, author, cover_url, slug, tropes, rating, series_name')
      .overlaps('tropes', seed.tropes.slice(0, 5))
      .overlaps('genres', CORE_GENRES)
      .not('cover_url', 'is', null)
      .neq('cover_url', '')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(12)
    return { seedTitle: seed.title, books: fallback ?? [] }
  }

  return { seedTitle: seed.title, books: data ?? [] }
}

// ── Featured books for homepage ────────────────────────────────────────────
export async function getFeaturedBooks(limit = 12) {
  const { data } = await supabaseAdmin
    .from('books')
    .select('id, title, author, slug, cover_url, tropes, rating, series_name')
    .overlaps('genres', CORE_GENRES)
    .not('cover_url', 'is', null)
    .neq('cover_url', '')
    .order('rating', { ascending: false })
    .limit(limit)
  return data ?? []
}

// ── Random books for Surprise Me ─────────────────────────────────────────
export async function getRandomBooks(limit = 20, excludeIds = []) {
  const { count } = await supabaseAdmin
    .from('books')
    .select('*', { count: 'exact', head: true })
    .overlaps('genres', CORE_GENRES)
  if (!count) return []

  const need = limit * 2 + excludeIds.length
  const maxOffset = Math.max(0, count - need)
  const offset = Math.floor(Math.random() * maxOffset)
  const excludeSet = new Set(excludeIds.map(String))

  const { data } = await supabaseAdmin
    .from('books')
    .select('id, title, author, cover_url, slug, series_name, series_number, rating, rating_count, tropes, description')
    .overlaps('genres', CORE_GENRES)
    .range(offset, offset + need - 1)

  return (data ?? []).filter(b => !excludeSet.has(String(b.id))).slice(0, limit)
}

// ── Interest-weighted Surprise Me books ──────────────────────────────────
export async function getSurpriseBooks(userId = null, excludeIds = [], limit = 15) {
  let topTropes = []

  let readIds = []

  if (userId) {
    const [interestsRes, shelfRes, tbrRes] = await Promise.all([
      supabaseAdmin.from('user_interests').select('tropes, subjects').eq('user_id', userId).single(),
      supabaseAdmin.from('shelf').select('book_id').eq('user_id', userId).eq('status', 'read'),
      supabaseAdmin.from('tbr').select('book_id').eq('user_id', userId).limit(30),
    ])

    readIds = (shelfRes.data ?? []).map(r => r.book_id)

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

  // Never show books the user has already read
  const allExclude = [...new Set([...excludeIds, ...readIds])]
  const safeExclude = allExclude.length ? allExclude : [-1]

  if (topTropes.length) {
    const wantFromInterests = Math.ceil(limit * 0.7)

    const { data: pool } = await supabaseAdmin
      .from('books')
      .select('id, title, author, cover_url, slug, series_name, series_number, rating, rating_count, tropes, description')
      .overlaps('tropes', topTropes)
      .overlaps('genres', CORE_GENRES)
      .not('id', 'in', `(${safeExclude.join(',')})`)
      .not('cover_url', 'is', null)
      .neq('cover_url', '')
      .order('rating', { ascending: false })
      .limit(wantFromInterests * 4)

    // Shuffle the interest pool for variety instead of always top-rated
    const shuffled = (pool ?? []).sort(() => Math.random() - 0.5).slice(0, wantFromInterests)
    const combinedExclude = [...allExclude, ...shuffled.map(b => b.id)]
    const randomFill = await getRandomBooks(limit - shuffled.length, combinedExclude)

    return [...shuffled, ...randomFill].sort(() => Math.random() - 0.5)
  }

  return getRandomBooks(limit, allExclude)
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
  const rows = await paginateBooks('series_name, author, cover_url, rating, genres', false)
  const map  = new Map()
  for (const r of rows) {
    if (!r.series_name) continue
    if (!map.has(r.series_name)) {
      map.set(r.series_name, { series_name: r.series_name, cover_url: r.cover_url, count: 0, authorCounts: new Map() })
    }
    const entry = map.get(r.series_name)
    entry.count++
    if (r.author) entry.authorCounts.set(r.author, (entry.authorCounts.get(r.author) ?? 0) + 1)
  }
  // Author shown for a series = whichever author has the most books in it — a single
  // mistagged outlier book shouldn't flip the displayed author (unordered DB fetch used
  // to just take whichever row came back first).
  return [...map.values()]
    .map(({ authorCounts, ...s }) => ({
      ...s,
      author: [...authorCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    }))
    .sort((a, b) => a.series_name.localeCompare(b.series_name))
}

// ── All books in a series (for series detail page) ─────────────────────────
export async function getBooksBySeries(seriesName) {
  const supabase = createSupabaseServer()
  const { data } = await supabase
    .from('books')
    .select('id, title, author, cover_url, slug, series_name, series_number, rating, rating_count, tropes, description')
    .eq('series_name', seriesName)
  return (data ?? []).sort((a, b) => (Number(a.series_number) || 0) - (Number(b.series_number) || 0))
}

// ── Books by title list (for cross-series reading orders) ─────────────────
export async function getBooksByTitles(titles, author = null) {
  if (!titles.length) return []
  let q = supabaseAdmin
    .from('books')
    .select('id, title, author, cover_url, slug, series_name, series_number, rating, rating_count, tropes, description')
    .in('title', titles)
  if (author) q = q.eq('author', author)
  const { data } = await q
  return data ?? []
}

// ── All distinct authors (for sitemap) ────────────────────────────────────
export async function getAllAuthors() {
  const { data } = await supabaseAdmin
    .from('books')
    .select('author')
    .not('author', 'is', null)
    .overlaps('genres', CORE_GENRES)

  // Count books per author, then filter to only authors with 2+ books
  const counts = {}
  for (const r of data ?? []) {
    const a = r.author
    if (!a) continue
    counts[a] = (counts[a] || 0) + 1
  }

  return Object.entries(counts)
    .filter(([author, count]) =>
      count >= 2 &&
      // Exclude malformed JSON arrays stored as author strings
      !author.startsWith('{') &&
      // Exclude non-Latin script authors (won't rank in English search)
      /^[\x00-\x7F\u00C0-\u024F\u1E00-\u1EFF\u0027\u2019\.\- ]+$/.test(author)
    )
    .map(([author]) => author)
}

// ── Author bio ─────────────────────────────────────────────────────────────
export async function getAuthorBio(author) {
  const { data } = await supabaseAdmin
    .from('author_bios')
    .select('bio')
    .eq('author_name', author)
    .single()
  const bio = data?.bio ?? null
  if (!bio) return null
  return typeof bio === 'string' ? JSON.parse(bio) : bio
}

// ── Series bio ─────────────────────────────────────────────────────────────
export async function getSeriesBio(seriesName) {
  const { data } = await supabaseAdmin
    .from('series_bios')
    .select('bio')
    .eq('series_name', seriesName)
    .single()
  const bio = data?.bio ?? null
  if (!bio) return null
  return typeof bio === 'string' ? JSON.parse(bio) : bio
}

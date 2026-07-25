import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

function upgradeCover(url) {
  if (!url) return null
  return url.replace(/\._S[XY]\d+_\./, '._SY475_.')
}

function toSlug(title, author) {
  return `${title}-${author}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// "Starry-Eyed Love (Spark House, #2)" → series_name "Spark House", series_number 2
function parseSeries(fullTitle, bareTitle) {
  const m = fullTitle.match(/\(([^,)]+),\s*#(\d+(?:\.\d+)?)\)\s*$/)
  return m ? { series_name: m[1].trim(), series_number: parseFloat(m[2]) } : { series_name: null, series_number: null }
}

// Goodreads "similar books" pages render one or more
// <div data-react-class="ReactComponents.SimilarBooksList" data-react-props="{...}">
// islands, each holding a JSON blob (HTML-entity-escaped) with a "similarBooks" array.
function extractSimilarBooks(html) {
  const blobs = [...html.matchAll(
    /data-react-class="ReactComponents\.SimilarBooksList" data-react-props="(.*?)"/gs
  )]

  const seen  = new Set()
  const books = []

  for (const [, escaped] of blobs) {
    let parsed
    try {
      parsed = JSON.parse(
        escaped
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&')
      )
    } catch {
      continue
    }

    for (const entry of parsed.similarBooks ?? []) {
      const bk = entry.book
      if (!bk?.bookId || seen.has(bk.bookId)) continue
      seen.add(bk.bookId)

      const bareTitle = bk.bookTitleBare || bk.title
      if (!bareTitle) continue
      const author = (bk.author?.name || 'Unknown').replace(/\s+/g, ' ').trim()
      const { series_name, series_number } = parseSeries(bk.title || '', bareTitle)

      books.push({
        title:         bareTitle,
        author,
        slug:          toSlug(bareTitle, author),
        cover_url:     upgradeCover(bk.imageUrl) ?? null,
        series_name,
        series_number,
        rating:        typeof bk.avgRating === 'number' ? bk.avgRating : null,
        rating_count:  typeof bk.ratingsCount === 'number' ? Math.round(bk.ratingsCount) : null,
        rating_source: 'Goodreads',
        goodreads_url: bk.bookUrl ? `https://www.goodreads.com${bk.bookUrl}` : null,
      })
    }
  }

  return books
}

export async function POST(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url } = await request.json()
  if (!url?.trim()) return NextResponse.json({ error: 'url required' }, { status: 400 })

  if (!/goodreads\.com\/book\/similar\//.test(url)) {
    return NextResponse.json(
      { error: 'Only Goodreads "similar books" URLs supported (goodreads.com/book/similar/...)' },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) throw new Error(`Page returned ${res.status}`)
    const html = await res.text()

    const books = extractSimilarBooks(html)
    if (books.length === 0) {
      return NextResponse.json(
        { error: 'No similar books found. The page may require login or use a format we can\'t parse.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ books })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}

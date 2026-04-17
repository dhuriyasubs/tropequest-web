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

function decodeEntities(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

// Goodreads series pages embed book data as HTML-escaped JSON in the page source.
// Field order per book: ...imageUrl... bookUrl ...title, bookTitleBare, avgRating, ratingsCount, author:{name}...
function extractSeriesBooks(html, seriesName) {
  const books = []
  const seen  = new Set()

  const markerRe = /&quot;bookUrl&quot;:&quot;(\/book\/show\/[^&"]+)&quot;/g
  let m

  while ((m = markerRe.exec(html)) !== null) {
    const bookUrl = m[1]
    if (seen.has(bookUrl)) continue
    seen.add(bookUrl)

    const start  = Math.max(0, m.index - 2000)
    const end    = Math.min(html.length, m.index + 3000)
    const chunk  = html.slice(start, end)
    const relPos = m.index - start

    // Split at bookUrl so field lookups don't bleed across book boundaries
    const beforeChunk = chunk.slice(0, relPos)
    const afterChunk  = chunk.slice(relPos)

    const getStrAfter = (key) => {
      const re = new RegExp(`&quot;${key}&quot;:&quot;((?:[^&"]|&amp;|&#x27;|&#39;|&lt;|&gt;)+)&quot;`)
      const hit = afterChunk.match(re)
      return hit ? decodeEntities(hit[1]) : null
    }
    const getNumAfter = (key) => {
      const re = new RegExp(`&quot;${key}&quot;:(\\d+(?:\\.\\d+)?)`)
      const hit = afterChunk.match(re)
      return hit ? parseFloat(hit[1]) : null
    }

    const fullTitle = getStrAfter('title') || ''
    const bareTitle = getStrAfter('bookTitleBare') || fullTitle
    if (!bareTitle) continue

    const numMatch     = fullTitle.match(/#(\d+(?:\.\d+)?)/)
    const seriesNumber = numMatch ? parseFloat(numMatch[1]) : null

    // imageUrl appears BEFORE bookUrl — take the last match to get this book's cover
    const imageMatches = [...beforeChunk.matchAll(/&quot;imageUrl&quot;:&quot;((?:[^&"]|&amp;)+)&quot;/g)]
    const imageUrl = imageMatches.length
      ? decodeEntities(imageMatches[imageMatches.length - 1][1])
      : null

    // author is a nested object after bookUrl: {"id":..., "name":"Elle Kennedy", ...}
    const authorMatch = afterChunk.match(/&quot;author&quot;:\{[^}]*&quot;name&quot;:&quot;((?:[^&"]|&amp;|&#x27;|&#39;)+)&quot;/)
    const author = authorMatch ? decodeEntities(authorMatch[1]) : 'Unknown'

    const avgRating   = getNumAfter('avgRating')
    const ratingCount = getNumAfter('ratingsCount')

    books.push({
      title:         bareTitle,
      author,
      slug:          toSlug(bareTitle, author),
      cover_url:     upgradeCover(imageUrl),
      series_name:   seriesName,
      series_number: seriesNumber,
      rating:        avgRating,
      rating_count:  ratingCount ? Math.round(ratingCount) : null,
      rating_source: 'Goodreads',
      goodreads_url: `https://www.goodreads.com${bookUrl}`,
    })
  }

  return books
}

export async function POST(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url } = await request.json()
  if (!url?.trim()) return NextResponse.json({ error: 'url required' }, { status: 400 })

  if (!/goodreads\.com\/series\//.test(url)) {
    return NextResponse.json(
      { error: 'Only Goodreads series URLs supported (goodreads.com/series/...)' },
      { status: 400 }
    )
  }

  // Extract series name from URL slug: "203975-briar-u" → "Briar U"
  const slugMatch = url.match(/\/series\/\d+-([^/?#]+)/)
  const seriesFromUrl = slugMatch
    ? slugMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Unknown Series'

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

    // Prefer series name from page title: "Briar U Series by Elle Kennedy"
    const titleMatch = html.match(/<title[^>]*>([^(<]+?)(?:\s+Series)?\s+(?:by|Series)/i)
      || html.match(/<h1[^>]*class="[^"]*seriesTitle[^"]*"[^>]*>([^<]+)</)
      || html.match(/<h1[^>]*>([^<]+Series[^<]*)<\/h1>/i)
    const seriesName = titleMatch
      ? titleMatch[1].trim()
      : seriesFromUrl

    const books = extractSeriesBooks(html, seriesName)

    if (books.length === 0) {
      return NextResponse.json(
        { error: 'No books found. The series page may require login or use a format we can\'t parse.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ books, series: seriesName })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}

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
// Each book block contains fields like: imageUrl, bookUrl, title (full w/ series #),
// bookTitleBare, avgRating, ratingsCount, authorName.
function extractSeriesBooks(html, seriesName) {
  const books = []
  const seen  = new Set()

  // Find each book by its bookUrl field
  const markerRe = /&quot;bookUrl&quot;:&quot;(\/book\/show\/[^&"]+)&quot;/g
  let m

  while ((m = markerRe.exec(html)) !== null) {
    const bookUrl = m[1]
    if (seen.has(bookUrl)) continue
    seen.add(bookUrl)

    // Window of text around this marker (look back more than forward since imageUrl precedes bookUrl)
    const start = Math.max(0, m.index - 2000)
    const end   = Math.min(html.length, m.index + 3000)
    const chunk = html.slice(start, end)

    const getStr = (key) => {
      const re = new RegExp(`&quot;${key}&quot;:&quot;((?:[^&"]|&amp;|&#x27;|&#39;|&lt;|&gt;)+)&quot;`)
      const hit = chunk.match(re)
      return hit ? decodeEntities(hit[1]) : null
    }
    const getNum = (key) => {
      const re = new RegExp(`&quot;${key}&quot;:(\\d+(?:\\.\\d+)?)`)
      const hit = chunk.match(re)
      return hit ? parseFloat(hit[1]) : null
    }

    const fullTitle = getStr('title') || ''
    const bareTitle = getStr('bookTitleBare') || fullTitle
    if (!bareTitle) continue

    // Series number from title like "The Chase (Briar U, #1)" or "(Briar U #3.5)"
    const numMatch = fullTitle.match(/#(\d+(?:\.\d+)?)/)
    const seriesNumber = numMatch ? parseFloat(numMatch[1]) : null

    // Cover: imageUrl field
    const imageUrl  = getStr('imageUrl')

    // Author: try authorName, then contributor name field
    const author = getStr('authorName') || getStr('name') || 'Unknown'

    // Ratings
    const avgRating   = getNum('avgRating')
    const ratingCount = getNum('ratingsCount')

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

    // Debug: show 1500 chars after the first bookUrl to reveal author/rating fields
    const bookUrlIdx = html.indexOf('&quot;bookUrl&quot;')
    const htmlSnippet = bookUrlIdx >= 0 ? html.slice(bookUrlIdx, bookUrlIdx + 1500) : ''

    return NextResponse.json({ books, series: seriesName, html_snippet: htmlSnippet })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}

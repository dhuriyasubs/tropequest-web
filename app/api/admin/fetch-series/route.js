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

function extractSeriesBooks(html, seriesName) {
  const books = []

  // Series pages list books inside <div class="listWithDividers__item"> or <tr> rows
  // Try the table row format first (most common on series pages)
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let m

  while ((m = rowRe.exec(html)) !== null) {
    const row = m[1]
    if (!row.includes('/book/show/')) continue

    // Series number (position in series)
    const posEl = row.match(/<td[^>]*class="[^"]*number[^"]*"[^>]*>\s*(\d+(?:\.\d+)?)\s*<\/td>/)
    const seriesNumber = posEl ? parseFloat(posEl[1]) : null

    // Title
    const titleEl = row.match(/itemprop=['"]name['"][^>]*>([^<]+)<\/span>/)
      || row.match(/class=['"]bookTitle['"][^>]*>([^<]+)<\/a>/)
    if (!titleEl) continue

    const title = titleEl[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()

    // Author
    const authorEl = row.match(/itemprop=['"]author['"][^>]*>\s*<[^>]+>\s*([^<]+)<\//)
      || row.match(/class=['"]authorName[^'"]*['"][^>]*>([^<]+)<\//)
      || row.match(/\/author\/show\/[^"]+">([^<]+)<\/a>/)
    const author = authorEl
      ? authorEl[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim()
      : 'Unknown'

    // Cover
    const coverEl = row.match(/src="(https:\/\/[^"]+\/photo\/[^"]+)"/)
      || row.match(/class=['"]bookCover['"][^>]*src="([^"]+)"/)
    const cover = upgradeCover(coverEl?.[1] ?? null)

    // GR URL
    const urlEl = row.match(/href="(\/book\/show\/[^"?#]+)"/)
    const goodreads_url = urlEl ? `https://www.goodreads.com${urlEl[1]}` : null

    // Rating
    const ratingEl = row.match(/([\d]+\.[\d]+)\s*avg/)
    const countEl  = row.match(/([\d,]+)\s*ratings/)

    books.push({
      title,
      author,
      slug:          toSlug(title, author),
      cover_url:     cover,
      series_name:   seriesName,
      series_number: seriesNumber,
      rating:        ratingEl ? parseFloat(ratingEl[1]) : null,
      rating_count:  countEl  ? parseInt(countEl[1].replace(/,/g, ''), 10) : null,
      rating_source: 'Goodreads',
      goodreads_url,
    })
  }

  // Fallback: newer Goodreads format uses div-based layout
  if (books.length === 0) {
    const itemRe = /<div[^>]*class="[^"]*listWithDividers__item[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*listWithDividers__item|$)/gi
    while ((m = itemRe.exec(html)) !== null) {
      const item = m[1]
      if (!item.includes('/book/show/')) continue

      const titleEl = item.match(/class=['"]bookTitle['"][^>]*>\s*<span[^>]*>([^<]+)<\/span>/)
        || item.match(/itemprop=['"]name['"][^>]*>([^<]+)<\//)
      if (!titleEl) continue

      const title = titleEl[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim()
      const authorEl = item.match(/class=['"]authorName[^'"]*['"][^>]*>([^<]+)<\//)
        || item.match(/\/author\/show\/[^"]+">([^<]+)<\/a>/)
      const author = authorEl ? authorEl[1].trim() : 'Unknown'
      const coverEl = item.match(/src="(https:\/\/[^"]+\/photo\/[^"]+)"/)
      const urlEl = item.match(/href="(\/book\/show\/[^"?#]+)"/)
      const posEl = item.match(/book\s+(\d+(?:\.\d+)?)\s*(?:of|in)/i)

      books.push({
        title,
        author,
        slug:          toSlug(title, author),
        cover_url:     upgradeCover(coverEl?.[1] ?? null),
        series_name:   seriesName,
        series_number: posEl ? parseFloat(posEl[1]) : null,
        rating:        null,
        rating_count:  null,
        rating_source: 'Goodreads',
        goodreads_url: urlEl ? `https://www.goodreads.com${urlEl[1]}` : null,
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

import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

function upgradeCover(url) {
  if (!url) return null
  return url.replace(/\._S[XY]\d+_\./, '._SY475_.')
}

function parseTitle(raw) {
  const decoded = raw.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
  // "Court of Nightmares (Courts & Kings #1)"
  const m1 = decoded.match(/^(.+?)\s*\((.+?)\s*#(\d+(?:\.\d+)?)\)\s*$/)
  if (m1) return { title: m1[1].trim(), series_name: m1[2].trim(), series_number: parseFloat(m1[3]) }
  // "Den of Vipers (Den of Vipers, #1)"
  const m2 = decoded.match(/^(.+?)\s*\((.+?),\s*#(\d+(?:\.\d+)?)\)\s*$/)
  if (m2) return { title: m2[1].trim(), series_name: m2[2].trim(), series_number: parseFloat(m2[3]) }
  return { title: decoded, series_name: null, series_number: null }
}

function toSlug(title, author) {
  return `${title}-${author}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function extractBooks(html, authorName) {
  const books = []
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let m
  while ((m = rowRe.exec(html)) !== null) {
    const row = m[1]
    if (!row.includes('/book/show/')) continue

    const titleEl  = row.match(/itemprop='name'[^>]*>([^<]+)<\/span>/)
    const coverEl  = row.match(/class="bookCover"[^>]*src="([^"]+)"/)
    const urlEl    = row.match(/href="(\/book\/show\/[^"]+)"/)
    const ratingEl = row.match(/(\d+\.\d+)\s*avg rating/)
    const countEl  = row.match(/([\d,]+)\s*ratings/)

    if (!titleEl) continue

    const { title, series_name, series_number } = parseTitle(titleEl[1])

    books.push({
      title,
      author:        authorName,
      slug:          toSlug(title, authorName),
      cover_url:     upgradeCover(coverEl?.[1]) ?? null,
      series_name,
      series_number,
      rating:        ratingEl ? parseFloat(ratingEl[1]) : null,
      rating_count:  countEl  ? parseInt(countEl[1].replace(/,/g, ''), 10) : null,
      rating_source: 'Goodreads',
      goodreads_url: urlEl ? `https://www.goodreads.com${urlEl[1]}` : null,
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

  if (!/goodreads\.com\/author\/(list|show)\//.test(url)) {
    return NextResponse.json(
      { error: 'Only Goodreads author list URLs supported (goodreads.com/author/list/...)' },
      { status: 400 }
    )
  }

  // Extract author name from URL slug: "18390408.K_A_Knight" → "K.A. Knight"
  const slugMatch = url.match(/\/(?:list|show)\/\d+\.([^/?]+)/)
  const authorFromUrl = slugMatch
    ? slugMatch[1].replace(/_/g, ' ')
    : 'Unknown'

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

    // Prefer author name from page title: "Books by K.A. Knight (Author of ...)"
    const pageTitleMatch = html.match(/<title[^>]*>Books by ([^(<]+)/i)
    const rawAuthor = pageTitleMatch ? pageTitleMatch[1] : authorFromUrl
    // Normalize to match DB constraint: strip special spaces, collapse whitespace,
    // then for each space-separated token capitalize first char only (e.g. "K.A." → "K.a.")
    const authorName = rawAuthor
      .replace(/[\u00a0\u200b\u200c\u200d\ufeff]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(t => t ? t[0].toUpperCase() + t.slice(1).toLowerCase() : t)
      .join(' ')

    const hasMore = /rel="next"/.test(html) || /class="next_page"/.test(html)
    const books   = extractBooks(html, authorName)

    return NextResponse.json({ books, author: authorName, has_more: hasMore })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}

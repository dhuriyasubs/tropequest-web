import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createSupabaseServer } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

function isCompleteDescription(text) {
  if (!text || text.length < 80) return false
  return /[.!?""''\u201C\u201D\u2018\u2019)]$/.test(text.trim())
}

const PROMPT = `Extract book metadata from the following web page data and return ONLY a valid JSON object. No markdown, no explanation.

{
  "title": "book title",
  "author": "author full name",
  "description": "book description/blurb (2-4 sentences)",
  "cover_url": "full image URL of the book cover",
  "series_name": "series name or null",
  "series_number": number or null,
  "genres": ["genre1", "genre2"],
  "release_date": "ISO date string YYYY-MM-DD or null",
  "release_year": integer year or null,
  "rating": number or null (out of 5),
  "rating_count": integer or null,
  "rating_source": "source of rating e.g. Goodreads, Amazon, or null",
  "buy_url_amazon_us": "amazon.com product URL if one is directly present in the page data, otherwise null — do not guess or construct one"
}

If a field has no matching content, use null. Data:`

// Goodreads embeds the Amazon ASIN for the edition being viewed (either in the page's
// embedded JSON state as "asin":"..." or in an amazon.com/gp/product/{ASIN} affiliate
// link) — a real ASIN gives a far more reliable Amazon URL than asking an LLM to guess one.
function extractAsin(html) {
  const m = html.match(/"asin":"([A-Z0-9]{10})"/) || html.match(/amazon\.[a-z.]+\/gp\/product\/([A-Z0-9]{10})/i)
  return m?.[1] ?? null
}

function extractPageData(html) {
  // Meta tags
  const metas = {}
  const metaRe = /<meta\s+(?:[^>]*?\s+)?(?:property|name)=["']([^"']+)["'][^>]*?\s+content=["']([^"']*)["']/gi
  const metaRe2 = /<meta\s+(?:[^>]*?\s+)?content=["']([^"']*)["'][^>]*?\s+(?:property|name)=["']([^"']+)["']/gi
  let m
  while ((m = metaRe.exec(html))  !== null) metas[m[1]] = m[2]
  while ((m = metaRe2.exec(html)) !== null) metas[m[2]] = m[1]

  // JSON-LD blocks
  const jsonLds = []
  const ldRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  while ((m = ldRe.exec(html)) !== null) {
    try { jsonLds.push(JSON.parse(m[1])) } catch {}
  }

  // Page title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)

  return {
    page_title:  titleMatch?.[1]?.trim() ?? '',
    og_title:    metas['og:title']       ?? '',
    og_desc:     metas['og:description'] ?? '',
    og_image:    metas['og:image']       ?? '',
    twitter_title: metas['twitter:title'] ?? '',
    json_ld:     jsonLds,
  }
}

export async function POST(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url } = await request.json()
  if (!url?.trim()) return NextResponse.json({ error: 'url required' }, { status: 400 })

  // Validate it's a Goodreads or Amazon URL
  const isGoodreads = /goodreads\.com/i.test(url)
  const isAmazon    = /amazon\.(com|in|co\.uk)/i.test(url)
  if (!isGoodreads && !isAmazon) {
    return NextResponse.json({ error: 'Only Goodreads or Amazon URLs are supported' }, { status: 400 })
  }

  // Fetch the page; fall back to Google Books if Goodreads blocks us
  let context
  let asin = null
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`Page returned ${res.status}`)
    const html = await res.text()
    context = JSON.stringify(extractPageData(html), null, 2)
    if (isGoodreads) asin = extractAsin(html)
  } catch {
    if (!isGoodreads) {
      return NextResponse.json({ error: 'Could not fetch page' }, { status: 502 })
    }
    // Goodreads blocked — fall back to Google Books API
    const slug  = url.split('/book/show/')[1] ?? ''
    const query = slug.replace(/^\d+-/, '').replace(/-/g, ' ').trim()
    const gbRes = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!gbRes.ok) return NextResponse.json({ error: 'Could not fetch book data (Goodreads blocked, Google Books also failed)' }, { status: 502 })
    const gbData = await gbRes.json()
    const item   = gbData.items?.[0]
    if (!item)   return NextResponse.json({ error: `No results found for "${query}"` }, { status: 404 })
    const info   = item.volumeInfo
    context = JSON.stringify({
      title:         info.title,
      authors:       info.authors,
      description:   info.description,
      cover_url:     info.imageLinks?.thumbnail?.replace('http://', 'https://'),
      series:        info.seriesInfo ?? null,
      categories:    info.categories,
      published_date: info.publishedDate ?? null,
      rating:        info.averageRating ?? null,
      rating_count:  info.ratingsCount  ?? null,
      source:        'google_books',
    }, null, 2)
  }

  // Pass structured extraction to Gemini
  const prompt  = PROMPT + '\n\n' + context

  try {
    const model  = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const text   = result.response.text().trim()
    const clean  = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const book   = JSON.parse(clean)
    if (book.description && !isCompleteDescription(book.description)) {
      book.description = null
    }
    // Prefer the real Amazon URL from the page's ASIN over Gemini's guess — it has no
    // reliable way to know the actual product URL from a Goodreads page alone.
    if (asin) book.buy_url_amazon_us = `https://www.amazon.com/dp/${asin}`
    return NextResponse.json({ book })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

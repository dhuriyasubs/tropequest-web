import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createSupabaseServer } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const PROMPT = `Extract book metadata from the following web page data and return ONLY a valid JSON object. No markdown, no explanation.

{
  "title": "book title",
  "author": "author full name",
  "description": "book description/blurb (2-4 sentences)",
  "cover_url": "full image URL of the book cover",
  "series_name": "series name or null",
  "series_number": number or null,
  "genres": ["genre1", "genre2"],
  "rating": number or null (out of 5),
  "rating_count": integer or null
}

If a field has no matching content, use null. Data:`

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

  // Fetch the page
  let html
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
    html = await res.text()
  } catch (err) {
    return NextResponse.json({ error: `Could not fetch page: ${err.message}` }, { status: 502 })
  }

  const pageData = extractPageData(html)

  // Pass structured extraction to Gemini
  const context = JSON.stringify(pageData, null, 2)
  const prompt  = PROMPT + '\n\n' + context

  try {
    const model  = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const text   = result.response.text().trim()
    const clean  = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const book   = JSON.parse(clean)
    return NextResponse.json({ book })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

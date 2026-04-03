import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 60

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

function isYoutube(url)   { return /youtube\.com|youtu\.be/.test(url) }
function isInstagram(url) { return /instagram\.com/.test(url) }

function extractYoutubeId(url) {
  const m = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([a-zA-Z0-9_-]{11})/)
  return m?.[1] ?? null
}

function decodeHTMLEntities(text) {
  return text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g,           (_, d) => String.fromCodePoint(parseInt(d, 10)))
}

function parseCaptionXml(xml) {
  const textParts = []
  const pRe   = /<p\s[^>]*>([\s\S]*?)<\/p>/g
  const textRe = /<text[^>]*>([^<]*)<\/text>/g
  let m
  while ((m = pRe.exec(xml)) !== null) {
    textParts.push(decodeHTMLEntities(m[1].replace(/<[^>]+>/g, ' ')).trim())
  }
  if (!textParts.length) {
    while ((m = textRe.exec(xml)) !== null) {
      textParts.push(decodeHTMLEntities(m[1]).trim())
    }
  }
  return textParts
}

async function fetchCaptionTracks(videoId, clientName, clientVersion, extraContext = {}) {
  const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
    body: JSON.stringify({
      context: { client: { clientName, clientVersion, ...extraContext } },
      videoId,
    }),
  })
  const player = await res.json()
  return player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
}

// Brace-aware JSON extraction — handles multi-line JSON
function extractJsonObject(str, startIdx) {
  let depth = 0, i = startIdx, inStr = false, esc = false
  while (i < str.length) {
    const ch = str[i]
    if (esc)              { esc = false; i++; continue }
    if (ch === '\\' && inStr) { esc = true;  i++; continue }
    if (ch === '"')       { inStr = !inStr; i++; continue }
    if (inStr)            { i++; continue }
    if (ch === '{') depth++
    else if (ch === '}') { if (--depth === 0) return str.slice(startIdx, i + 1) }
    i++
  }
  return null
}

// Fetch the watch page, extract caption tracks, and immediately fetch the transcript
async function fetchTranscriptFromPage(videoId) {
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  })
  const html = await pageRes.text()

  // Find the captionTracks array in the raw HTML
  const ctIdx = html.indexOf('"captionTracks":[')
  if (ctIdx === -1) return null

  // Extract the array string — find the closing ] accounting for nesting
  let depth = 0, i = html.indexOf('[', ctIdx), start = i
  for (; i < html.length; i++) {
    if (html[i] === '[') depth++
    else if (html[i] === ']') { if (--depth === 0) break }
  }
  const arrStr = html.slice(start, i + 1)

  let tracks
  try {
    // Unescape unicode escapes before parsing
    tracks = JSON.parse(arrStr.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))))
  } catch {
    return null
  }

  if (!tracks?.length) return null

  // Prefer English (auto-generated or manual), fall back to first
  const track = tracks.find(t => t.languageCode === 'en') ?? tracks[0]
  if (!track?.baseUrl) return null

  // Fetch the transcript immediately while the signed URL is still valid
  const captionRes = await fetch(track.baseUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  const xml = await captionRes.text()
  const parts = parseCaptionXml(xml)
  return parts.length ? parts.join(' ').slice(0, 10000) : null
}

// Direct timedtext API — works for auto-generated captions (no player response needed)
async function fetchTranscriptFromTimedText(videoId) {
  const langs = ['en', 'en-US', 'en-GB']
  const kinds = ['', 'asr'] // manual first, then auto-generated
  for (const kind of kinds) {
    for (const lang of langs) {
      const params = new URLSearchParams({ v: videoId, lang, fmt: 'srv3' })
      if (kind) params.set('kind', kind)
      const res = await fetch(`https://www.youtube.com/api/timedtext?${params}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      if (!res.ok) continue
      const xml = await res.text()
      const parts = parseCaptionXml(xml)
      if (parts.length) return parts.join(' ').slice(0, 10000)
    }
  }
  return null
}

// Fetches captions trying multiple methods
async function getYoutubeText(url) {
  const videoId = extractYoutubeId(url)
  if (!videoId) throw new Error('Could not extract YouTube video ID')

  // Method 1: direct timedtext API (unsigned — works for some videos)
  const timedText = await fetchTranscriptFromTimedText(videoId)
  if (timedText) return timedText

  // Method 2: scrape watch page and use the signed caption URL immediately
  const pageText = await fetchTranscriptFromPage(videoId)
  if (pageText) return pageText

  // Method 3-5: InnerTube player API with different clients
  let tracks = []
  tracks = await fetchCaptionTracks(videoId, 'WEB', '2.20240101.00.00')
  if (!tracks.length) tracks = await fetchCaptionTracks(videoId, 'TVHTML5', '7.20250101.17.00')
  if (!tracks.length) tracks = await fetchCaptionTracks(videoId, 'ANDROID', '20.10.38', {
    androidSdkVersion: 34,
    userAgent: 'com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip',
  })

  if (!tracks.length) throw new Error('No captions found for this video. Make sure it has subtitles/captions enabled.')

  const track = tracks.find(t => t.languageCode === 'en') ?? tracks[0]
  const captionRes = await fetch(track.baseUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  const xml = await captionRes.text()
  const textParts = parseCaptionXml(xml)
  if (!textParts.length) throw new Error('Could not parse captions for this video.')
  return textParts.join(' ').slice(0, 10000)
}

async function getInstagramText(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  })
  const html = await res.text()
  const og = html.match(/<meta property="og:description" content="([^"]*)"/)
  if (og) return decodeHTMLEntities(og[1]).slice(0, 8000)
  const meta = html.match(/<meta name="description" content="([^"]*)"/)
  if (meta) return decodeHTMLEntities(meta[1]).slice(0, 8000)
  return ''
}

async function extractBooksFromText(text) {
  const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const prompt = `You are a book extraction assistant. Analyze the following text from a video transcript or social media post about books.

Extract every book title mentioned. For each book determine:
1. Is the creator recommending/suggesting this book (true), or warning against it / saying it was bad (false)?
2. The exact book title and the author's full name if mentioned (leave author empty string if unknown).

Return ONLY a valid JSON array — no markdown, no explanation:
[{"title":"Book Title","author":"Author Name","suggested":true,"reason":"one sentence summary of why suggested or not"}]

If no books are mentioned, return: []

Text:
${text}`

  const result = await model.generateContent(prompt)
  const raw     = result.response.text().trim()
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function makeSlug(title, author) {
  const base = `${title}${author ? '-' + author : ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base}-${Date.now().toString(36)}`
}

async function matchBooksInDB(books) {
  return Promise.all(books.map(async (book) => {
    // Exact title match
    let { data } = await supabaseAdmin
      .from('books')
      .select('id,title,author,cover_url,slug,rating')
      .ilike('title', book.title)
      .limit(1)
      .maybeSingle()

    // Fuzzy title match
    if (!data) {
      const res = await supabaseAdmin
        .from('books')
        .select('id,title,author,cover_url,slug,rating')
        .ilike('title', `%${book.title}%`)
        .limit(1)
      data = res.data?.[0] ?? null
    }

    // Auto-create if still not found
    if (!data) {
      const { data: created } = await supabaseAdmin
        .from('books')
        .insert({
          title:  book.title,
          author: book.author || 'Unknown',
          slug:   makeSlug(book.title, book.author),
        })
        .select('id,title,author,cover_url,slug,rating')
        .single()
      data = created ?? null
    }

    return {
      title:     book.title,
      author:    book.author,
      suggested: book.suggested,
      reason:    book.reason,
      dbBook:    data ?? null,
    }
  }))
}

export async function POST(request) {
  const { url } = await request.json()
  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
  }

  try {
    let text = ''
    if (isYoutube(url)) {
      text = await getYoutubeText(url)
    } else if (isInstagram(url)) {
      text = await getInstagramText(url)
    } else {
      return NextResponse.json({ error: 'Only YouTube and Instagram URLs are supported' }, { status: 400 })
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'No content could be extracted from this URL. For Instagram, make sure the post is public.' }, { status: 422 })
    }

    const rawBooks = await extractBooksFromText(text)
    if (rawBooks.length === 0) {
      return NextResponse.json({ books: [], message: 'No books found in this content.' })
    }

    const books = await matchBooksInDB(rawBooks)

    // Persist mentions for future reference (fire-and-forget, non-blocking)
    const mentions = books
      .filter(b => b.dbBook?.id)
      .map(b => ({
        reel_url:  url,
        book_id:   b.dbBook.id,
        suggested: b.suggested,
        reason:    b.reason ?? null,
      }))
    if (mentions.length) {
      supabaseAdmin
        .from('reel_mentions')
        .upsert(mentions, { onConflict: 'reel_url,book_id', ignoreDuplicates: true })
        .then()
    }

    return NextResponse.json({ books })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

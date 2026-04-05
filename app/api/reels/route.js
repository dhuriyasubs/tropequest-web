import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleAIFileManager } from '@google/generative-ai/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 60

const gemini      = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY)

function isYoutube(url)   { return /youtube\.com|youtu\.be/.test(url) }
function isInstagram(url) { return /instagram\.com/.test(url) }

function decodeHTMLEntities(text) {
  return text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g,           (_, d) => String.fromCodePoint(parseInt(d, 10)))
}

function normaliseYoutubeUrl(url) {
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return `https://www.youtube.com/watch?v=${shortMatch[1]}`
  return url
}

const IG_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

// ── Instagram: extract video URL from the HTML JSON blobs ─────────────────

function extractInstagramVideoUrl(html) {
  // Instagram embeds video_url / playback_url in JSON inside <script> tags
  const patterns = [
    /"video_url":"(https:[^"]+\.mp4[^"]*)"/,
    /"playback_url":"(https:[^"]+\.mp4[^"]*)"/,
    /video_url\\?":\\?"(https:[^"\\]+\.mp4[^"\\]*)/,
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m) {
      return m[1]
        .replace(/\\u0026/g, '&')
        .replace(/\\/g, '')
    }
  }
  return null
}

// ── Instagram: extract caption text from HTML ─────────────────────────────

function extractInstagramCaption(html) {
  const og = html.match(/<meta property="og:description" content="([^"]*)"/)
  if (og) return decodeHTMLEntities(og[1]).slice(0, 8000)
  const meta = html.match(/<meta name="description" content="([^"]*)"/)
  if (meta) return decodeHTMLEntities(meta[1]).slice(0, 8000)
  return ''
}

// ── Download Instagram video bytes ───────────────────────────────────────

async function downloadInstagramVideo(videoUrl) {
  const res = await fetch(videoUrl, {
    headers: { ...IG_HEADERS, 'Referer': 'https://www.instagram.com/' },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`Video download failed: ${res.status}`)
  const buf = await res.arrayBuffer()
  return Buffer.from(buf)
}

// ── Upload video buffer to Gemini Files API ───────────────────────────────

async function uploadVideoToGemini(videoBuffer) {
  // Use the resumable upload REST API directly (SDK uploadFile needs a file path)
  const apiKey = process.env.GEMINI_API_KEY
  const initRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol':             'resumable',
        'X-Goog-Upload-Command':              'start',
        'X-Goog-Upload-Header-Content-Length': videoBuffer.length,
        'X-Goog-Upload-Header-Content-Type':   'video/mp4',
        'Content-Type':                        'application/json',
      },
      body: JSON.stringify({ file: { display_name: 'instagram_reel' } }),
    }
  )
  if (!initRes.ok) throw new Error(`Gemini upload init failed: ${initRes.status}`)

  const sessionUrl = initRes.headers.get('x-goog-upload-url')
  if (!sessionUrl) throw new Error('No upload session URL returned')

  const uploadRes = await fetch(sessionUrl, {
    method: 'POST',
    headers: {
      'Content-Length':         videoBuffer.length,
      'X-Goog-Upload-Offset':   '0',
      'X-Goog-Upload-Command':  'upload, finalize',
    },
    body: videoBuffer,
  })
  if (!uploadRes.ok) throw new Error(`Gemini upload failed: ${uploadRes.status}`)

  const data = await uploadRes.json()
  return data.file.uri
}

// ── Wait for Gemini file to be ACTIVE ────────────────────────────────────

async function waitForFileActive(fileUri) {
  const apiKey  = process.env.GEMINI_API_KEY
  const name    = fileUri.split('/').pop() // files/xxxx
  const maxWait = 30_000
  const start   = Date.now()

  while (Date.now() - start < maxWait) {
    const res  = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/files/${name}?key=${apiKey}`
    )
    const data = await res.json()
    if (data.state === 'ACTIVE') return
    if (data.state === 'FAILED') throw new Error('Gemini file processing failed')
    await new Promise(r => setTimeout(r, 2000))
  }
  throw new Error('Gemini file processing timed out')
}

// ── Gemini prompts ────────────────────────────────────────────────────────

const BOOK_PROMPT = `You are a book extraction assistant. Analyze this content carefully — it may be a video, audio, or text.

Look for books in ALL of these ways:
- Spoken mentions (audio/transcript)
- Text shown on screen (book covers, overlays, captions)
- Written captions or descriptions

For each book found, determine:
1. The exact book title and author's full name (leave author empty if unknown)
2. Is the creator recommending it (true) or warning against it / saying it was bad (false)?
3. Any tropes mentioned for this specific book (e.g. "enemies to lovers", "slow burn", "villain love interest", "found family"). List only tropes explicitly mentioned or clearly implied for that book. Use the exact phrasing from the content where possible.

Return ONLY a valid JSON array — no markdown, no explanation:
[{"title":"Book Title","author":"Author Name","suggested":true,"reason":"one sentence summary","tropes":["trope one","trope two"]}]

If no books are found, return: []`

async function extractBooksFromYoutube(youtubeUrl) {
  const model  = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const result = await model.generateContent([
    { fileData: { fileUri: normaliseYoutubeUrl(youtubeUrl), mimeType: 'video/mp4' } },
    { text: BOOK_PROMPT },
  ])
  return parseGeminiResponse(result.response.text())
}

async function extractBooksFromVideoUri(fileUri) {
  const model  = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const result = await model.generateContent([
    { fileData: { fileUri, mimeType: 'video/mp4' } },
    { text: BOOK_PROMPT },
  ])
  return parseGeminiResponse(result.response.text())
}

async function extractBooksFromText(text) {
  const model  = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const result = await model.generateContent(`${BOOK_PROMPT}\n\nText:\n${text}`)
  return parseGeminiResponse(result.response.text())
}

function parseGeminiResponse(raw) {
  const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ── Instagram: full pipeline ──────────────────────────────────────────────

async function handleInstagram(url) {
  const res  = await fetch(url, { headers: IG_HEADERS, redirect: 'follow' })
  const html = await res.text()

  // 1. Try to get the video and send it directly to Gemini (handles all 3 cases)
  const videoUrl = extractInstagramVideoUrl(html)
  if (videoUrl) {
    try {
      const videoBuffer = await downloadInstagramVideo(videoUrl)
      const fileUri     = await uploadVideoToGemini(videoBuffer)
      await waitForFileActive(fileUri)
      return { books: await extractBooksFromVideoUri(fileUri), source: 'video' }
    } catch (e) {
      console.warn('Video pipeline failed, falling back to caption:', e.message)
    }
  }

  // 2. Fall back to caption/description text (case 1 only)
  const caption = extractInstagramCaption(html)
  if (caption.trim()) {
    return { books: await extractBooksFromText(caption), source: 'caption' }
  }

  // 3. Try embed URL for caption
  const shortcodeMatch = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/)
  if (shortcodeMatch) {
    try {
      const embedRes  = await fetch(`https://www.instagram.com/p/${shortcodeMatch[1]}/embed/`, { headers: IG_HEADERS })
      const embedHtml = await embedRes.text()
      const capMatch  = embedHtml.match(/class="[^"]*[Cc]aption[^"]*"[^>]*>([\s\S]{1,4000}?)<\/div>/)
      if (capMatch) {
        const stripped = capMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        if (stripped.length > 20) {
          return { books: await extractBooksFromText(decodeHTMLEntities(stripped)), source: 'caption' }
        }
      }
    } catch { /* ignore */ }
  }

  return null // caller will surface the manual paste prompt
}

// ── DB helpers ────────────────────────────────────────────────────────────

function makeSlug(title, author) {
  const base = `${title}${author ? '-' + author : ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base}-${Date.now().toString(36)}`
}

async function matchBooksInDB(books) {
  return Promise.all(books.map(async (book) => {
    let { data } = await supabaseAdmin
      .from('books')
      .select('id,title,author,cover_url,slug,rating,tropes')
      .ilike('title', book.title)
      .limit(1)
      .maybeSingle()

    if (!data) {
      const res = await supabaseAdmin
        .from('books')
        .select('id,title,author,cover_url,slug,rating,tropes')
        .ilike('title', `%${book.title}%`)
        .limit(1)
      data = res.data?.[0] ?? null
    }

    if (!data) {
      const { data: created } = await supabaseAdmin
        .from('books')
        .insert({
          title:  book.title,
          author: book.author || 'Unknown',
          slug:   makeSlug(book.title, book.author),
        })
        .select('id,title,author,cover_url,slug,rating,tropes')
        .single()
      data = created ?? null

      // Queue for enrichment (cover, rating, description, genres, series)
      if (created?.id) {
        supabaseAdmin
          .from('pending_books')
          .insert({ title: book.title, author: book.author || 'Unknown', processed: false })
          .then()
      }
    }

    // Enrich tropes: merge video-extracted tropes with existing ones (fire-and-forget)
    const newTropes = (book.tropes ?? []).filter(t => t?.trim())
    if (data?.id && newTropes.length) {
      const existing = data.tropes ?? []
      const existingLower = new Set(existing.map(t => t.toLowerCase()))
      const toAdd = newTropes.filter(t => !existingLower.has(t.toLowerCase()))
      if (toAdd.length) {
        supabaseAdmin
          .from('books')
          .update({ tropes: [...existing, ...toAdd] })
          .eq('id', data.id)
          .then()
        data = { ...data, tropes: [...existing, ...toAdd] }
      }
    }

    return {
      title:     book.title,
      author:    book.author,
      suggested: book.suggested,
      reason:    book.reason,
      tropes:    book.tropes ?? [],
      dbBook:    data ?? null,
    }
  }))
}

// ── Route handler ─────────────────────────────────────────────────────────

export async function POST(request) {
  const { url, text: manualText } = await request.json()
  if (!url && !manualText) return NextResponse.json({ error: 'URL or text is required' }, { status: 400 })

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
  }

  try {
    let rawBooks = []

    if (manualText?.trim()) {
      rawBooks = await extractBooksFromText(manualText.trim())
    } else if (isYoutube(url)) {
      rawBooks = await extractBooksFromYoutube(url)
    } else if (isInstagram(url)) {
      const result = await handleInstagram(url)
      if (!result) {
        return NextResponse.json({
          error: 'Couldn\u2019t extract content from this Instagram post. Paste the caption or transcript manually.',
        }, { status: 422 })
      }
      rawBooks = result.books
    } else {
      return NextResponse.json({ error: 'Only YouTube and Instagram URLs are supported' }, { status: 400 })
    }

    if (rawBooks.length === 0) {
      return NextResponse.json({ books: [], message: 'No books found in this content.' })
    }

    const books = await matchBooksInDB(rawBooks)

    // Persist mentions (fire-and-forget)
    const mentions = books
      .filter(b => b.dbBook?.id)
      .map(b => ({
        reel_url:  url || 'manual',
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

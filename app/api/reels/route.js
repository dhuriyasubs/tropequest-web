import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 60

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

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
  // Gemini needs a full youtube.com/watch?v= URL
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return `https://www.youtube.com/watch?v=${shortMatch[1]}`
  return url
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

const BOOK_PROMPT = `You are a book extraction assistant. Analyze this content about books.

Extract every book title mentioned. For each book determine:
1. Is the creator recommending/suggesting this book (true), or warning against it / saying it was bad (false)?
2. The exact book title and the author's full name if mentioned (leave author as empty string if unknown).

Return ONLY a valid JSON array — no markdown, no explanation:
[{"title":"Book Title","author":"Author Name","suggested":true,"reason":"one sentence summary of why suggested or not"}]

If no books are mentioned, return: []`

async function extractBooksFromYoutube(youtubeUrl) {
  const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const result = await model.generateContent([
    {
      fileData: {
        fileUri:  normaliseYoutubeUrl(youtubeUrl),
        mimeType: 'video/mp4',
      },
    },
    { text: BOOK_PROMPT },
  ])
  return parseGeminiResponse(result.response.text())
}

async function extractBooksFromText(text) {
  const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' })
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
      .select('id,title,author,cover_url,slug,rating')
      .ilike('title', book.title)
      .limit(1)
      .maybeSingle()

    if (!data) {
      const res = await supabaseAdmin
        .from('books')
        .select('id,title,author,cover_url,slug,rating')
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
    let rawBooks = []

    if (isYoutube(url)) {
      // Gemini processes the YouTube video directly — no caption extraction needed
      rawBooks = await extractBooksFromYoutube(url)
    } else if (isInstagram(url)) {
      const text = await getInstagramText(url)
      if (!text.trim()) {
        return NextResponse.json({
          error: 'No content could be extracted. Make sure the Instagram post is public.',
        }, { status: 422 })
      }
      rawBooks = await extractBooksFromText(text)
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

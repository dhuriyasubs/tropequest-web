import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 30

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const SCAN_PROMPT = `Look at this image of a bookshelf or books. Identify every book you can see.
For each book extract the title and the author's name if visible on the spine or cover.

Return ONLY a valid JSON array — no markdown, no explanation:
[{"title":"Book Title","author":"Author Name"}]

If author is not visible, use an empty string for author.
If no books are visible, return: []`

function toTitleCase(str) {
  return str
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
}

function makeSlug(title, author) {
  const base = `${title}${author ? '-' + author : ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

async function matchOrCreateBooks(books) {
  return Promise.all(books.map(async (book) => {
    const normTitle  = toTitleCase(book.title)
    const normAuthor = toTitleCase(book.author || 'Unknown')

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

    // Not in catalog — auto-create a stub so enrich_missing.py can pick it up
    let isNew = false
    let insertError = null
    if (!data) {
      const { data: created, error: err } = await supabaseAdmin
        .from('books')
        .insert({
          title:  normTitle,
          author: normAuthor,
          slug:   makeSlug(normTitle, normAuthor),
        })
        .select('id,title,author,cover_url,slug,rating')
        .single()
      data = created ?? null
      if (err) {
        insertError = err.message
        console.error('[scan] insert failed for', book.title, ':', err.message)
      } else {
        isNew = true
      }
    }

    return {
      title:  book.title,
      author: book.author,
      dbBook: data ?? null,
      isNew,
      ...(insertError ? { insertError } : {}),
    }
  }))
}

export async function POST(request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
  }

  const { image, mimeType } = await request.json()
  if (!image) return NextResponse.json({ error: 'image is required' }, { status: 400 })

  try {
    const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent([
      { inlineData: { data: image, mimeType: mimeType ?? 'image/jpeg' } },
      { text: SCAN_PROMPT },
    ])

    const raw = result.response.text().trim()
      .replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

    let identified = []
    try { identified = JSON.parse(raw); if (!Array.isArray(identified)) identified = [] } catch { identified = [] }

    if (identified.length === 0) {
      return NextResponse.json({ books: [], message: 'No books identified in the image.' })
    }

    const books = await matchOrCreateBooks(identified)
    return NextResponse.json({ books })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

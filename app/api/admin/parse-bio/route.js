import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createSupabaseServer } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const AUTHOR_PROMPT = `Extract structured information from the following author biography text and return ONLY a valid JSON object with exactly these fields. No markdown, no explanation.

{
  "intro": "opening paragraph about the author",
  "profile": {
    "Primary Genres": "comma-separated genres",
    "Notable Works": "comma-separated book titles",
    "Defining Tropes": "comma-separated tropes",
    "Key Achievement": "one notable achievement"
  },
  "writing_style": "paragraph about writing style and impact",
  "series": [
    { "name": "Series Name", "years": "year or range e.g. 2021 or 2021 to Present", "description": "one or two sentence description" }
  ],
  "reader_tip": "optional reading tip for new readers"
}

If a field has no matching content, use an empty string or empty array. Text:`

const SERIES_PROMPT = `Extract structured information from the following series description text and return ONLY a valid JSON object with exactly these fields. No markdown, no explanation.

{
  "intro": "overview paragraph about the series",
  "reading_order_note": "optional note about reading order (e.g. timeline shifts, perspective changes)",
  "reading_order": [
    { "number": 1, "format": "Novel or Novella or Short Story or Prequel", "focus": "one-line focus description for this book" }
  ],
  "what_to_expect": [
    { "label": "Section Title", "text": "description" }
  ],
  "reading_tip": "optional reading tip callout"
}

For reading_order, use the book numbers from the text. If format is not mentioned, leave as empty string. Text:`

export async function POST(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, content } = await request.json()
  if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })
  if (!['author', 'series'].includes(type)) return NextResponse.json({ error: 'type must be author or series' }, { status: 400 })

  const prompt = (type === 'author' ? AUTHOR_PROMPT : SERIES_PROMPT) + '\n\n' + content.trim()

  try {
    const model  = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const text   = result.response.text().trim()

    // Strip markdown code fences if present
    const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const bio   = JSON.parse(clean)
    return NextResponse.json({ bio })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

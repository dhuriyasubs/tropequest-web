import { NextResponse } from 'next/server'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
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
  "works_heading": "heading for the works/bibliography section, e.g. 'Major Works' or 'Major Bibliography' — use empty string for default",
  "series": [
    {
      "name": "Series Name",
      "years": "year or range e.g. 2021 or 2021 to Present",
      "description": "one or two sentence description",
      "books": [
        { "title": "Book Title", "year": "2015", "format": "Novel, Novella, Short Story, or empty string if unspecified" }
      ]
    }
  ],
  "reader_tip": "optional reading tip for new readers",
  "extras": "any additional content that doesn't fit the fields above (e.g. universe/crossover notes) — use <b>text</b> for headings, \\n\\n between sections, empty string if none"
}

If the text includes a chronological bibliography or list of individual book titles under a series, extract every book into that series' "books" array in order — do not summarize it away. If a field has no matching content, use an empty string or empty array. Text:`

const AUTHOR_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    intro: { type: SchemaType.STRING },
    profile: {
      type: SchemaType.OBJECT,
      properties: {
        'Primary Genres':   { type: SchemaType.STRING },
        'Notable Works':    { type: SchemaType.STRING },
        'Defining Tropes':  { type: SchemaType.STRING },
        'Key Achievement':  { type: SchemaType.STRING },
      },
    },
    writing_style:  { type: SchemaType.STRING },
    works_heading:  { type: SchemaType.STRING },
    series: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name:        { type: SchemaType.STRING },
          years:       { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          books: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                title:  { type: SchemaType.STRING },
                year:   { type: SchemaType.STRING },
                format: { type: SchemaType.STRING },
              },
              required: ['title'],
            },
          },
        },
        required: ['name'],
      },
    },
    reader_tip: { type: SchemaType.STRING },
    extras:     { type: SchemaType.STRING },
  },
  required: ['intro', 'series'],
}

const SERIES_PROMPT = `Extract structured information from the following series description text and return ONLY a valid JSON object with exactly these fields. No markdown, no explanation.

{
  "intro": "overview paragraph about the series",
  "reading_order_note": "optional note about reading order (e.g. timeline shifts, perspective changes, merged series)",
  "format_header": "label for the Format column in the reading order table, e.g. 'Sub-Series' or 'Format' — use empty string if generic",
  "focus_header": "label for the Focus column in the reading order table, e.g. 'Focus Characters' or 'Focus' — use empty string if generic",
  "reading_order": [
    { "number": 1, "title": "Book Title", "format": "Novel or Novella or Short Story or Prequel", "focus": "focus characters or one-line description" }
  ],
  "what_to_expect": [
    { "label": "Section Title", "text": "description — use \\n to separate bullet-style entries within one section" }
  ],
  "comparison_tables": [
    {
      "title": "Table heading, e.g. The Two Series Explained",
      "columns": ["Col 1 header", "Col 2 header", "Col 3 header"],
      "rows": [["cell", "cell", "cell"]]
    }
  ],
  "reading_tip": "optional reading tip callout"
}

For reading_order:
- "number" is the sequential recommended reading position (1, 2, 3...), NOT the sub-series number
- "title" is the book title
- "focus" is the focus characters or a one-line description of what the book is about
- If format is not mentioned, leave as empty string
- If the input contains a table (even if columns are concatenated without delimiters), carefully extract each row

If a field has no matching content, use an empty string or empty array. Text:`

export async function POST(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, content } = await request.json()
  if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })
  if (!['author', 'series'].includes(type)) return NextResponse.json({ error: 'type must be author or series' }, { status: 400 })

  const prompt = (type === 'author' ? AUTHOR_PROMPT : SERIES_PROMPT) + '\n\n' + content.trim()

  try {
    const model  = gemini.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        // Extended thinking on this model measurably increases the odds of a
        // degenerate repetition loop (seen repeating a paragraph until it got cut
        // off mid-string) or a RECITATION block when the input is a real,
        // detailed bibliography -- disabling it plus a low temperature made both
        // failure modes disappear in testing. Not needed for an extraction task anyway.
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.1,
        ...(type === 'author' ? { responseSchema: AUTHOR_SCHEMA } : {}),
      },
    })
    const result = await model.generateContent(prompt)
    const text   = result.response.text().trim()

    // Strip markdown code fences if present
    let clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    // Replace literal newlines inside JSON string values with \n (Gemini sometimes emits them)
    clean = clean.replace(/"((?:[^"\\]|\\.)*)"/gs, (_, inner) =>
      '"' + inner.replace(/\r?\n/g, '\\n') + '"'
    )
    const bio   = JSON.parse(clean)
    return NextResponse.json({ bio })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

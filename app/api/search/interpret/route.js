import { NextResponse } from 'next/server'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { TROPES, GENRES, RELATIONSHIP_TYPES, REPRESENTATION, SPICE_LABELS } from '@/lib/taxonomy'

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const SPICE_SCALE = Object.entries(SPICE_LABELS).map(([n, label]) => `${n} = ${label}`).join(', ')

const PROMPT = `A romance/fantasy reader typed a free-text description of the book they want. Map it onto this site's fixed tag taxonomy so it can be turned into search filters.

Only use values copied EXACTLY (same spelling, case, punctuation) from these lists — never invent a new value:

TROPES: ${TROPES.join(', ')}
GENRES: ${GENRES.join(', ')}
REPRESENTATION: ${REPRESENTATION.join(', ')}
RELATIONSHIP TYPES: ${RELATIONSHIP_TYPES.join(', ')}
SPICE SCALE (1-5): ${SPICE_SCALE}

Rules:
- Put a concept in the "exclude" list (excludeTropes/excludeGenres/excludeRepresentation) when the reader used negation ("not", "no", "without", "isn't", "hate", "don't want", "sick of") — otherwise put it in the plain include list.
- "spice": only set 1-5 if the reader implied a heat level (e.g. "no smut"/"fade to black" -> 1 or 2, "spicy"/"steamy"/"explicit" -> 4 or 5). Use 0 if not implied.
- "query": a few leftover keywords (specific book/character detail, plot point, author, title) that don't map to any taxonomy list above — empty string if nothing is left over. Do not repeat words already captured by a matched trope/genre/representation/relationship value.
- If nothing in a list confidently matches, leave that array empty. Do not force a match.

Return ONLY the JSON object. Reader's request:
`

const SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    tropes:                { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    excludeTropes:         { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    genres:                { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    excludeGenres:         { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    representation:        { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    excludeRepresentation: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    relationshipTypes:     { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    spice:                 { type: SchemaType.NUMBER },
    query:                 { type: SchemaType.STRING },
  },
  required: ['tropes', 'excludeTropes', 'genres', 'excludeGenres', 'representation', 'excludeRepresentation', 'relationshipTypes', 'spice', 'query'],
}

function keep(list, canonical) {
  const canonSet = new Set(canonical)
  return Array.isArray(list) ? list.filter(v => canonSet.has(v)) : []
}

export async function POST(request) {
  const { text } = await request.json()
  if (!text?.trim()) return NextResponse.json({ error: 'text required' }, { status: 400 })

  try {
    const model = gemini.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: SCHEMA,
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.1,
      },
    })
    const result = await model.generateContent(PROMPT + text.trim())
    const parsed = JSON.parse(result.response.text().trim())

    // Belt-and-suspenders: strip anything the model returned that isn't an
    // exact taxonomy value, so a hallucinated tag can never reach the DB filter.
    const filters = {
      tropes:                keep(parsed.tropes, TROPES),
      excludeTropes:         keep(parsed.excludeTropes, TROPES),
      genres:                keep(parsed.genres, GENRES),
      excludeGenres:         keep(parsed.excludeGenres, GENRES),
      representation:        keep(parsed.representation, REPRESENTATION),
      excludeRepresentation: keep(parsed.excludeRepresentation, REPRESENTATION),
      relationshipTypes:     keep(parsed.relationshipTypes, RELATIONSHIP_TYPES),
      spice: [1, 2, 3, 4, 5].includes(parsed.spice) ? parsed.spice : null,
      query: typeof parsed.query === 'string' ? parsed.query.trim() : '',
    }
    return NextResponse.json({ filters })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

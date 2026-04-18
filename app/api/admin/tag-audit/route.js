import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'
import {
  GENRES, TROPES, TIME_PERIODS, RELATIONSHIP_TYPES, KINK_TAGS,
  STORY_TAGS, CONTENT_WARNINGS, REPRESENTATION, SETTING_TAGS, GEOGRAPHY_TAGS,
} from '@/lib/taxonomy'

const FIELD_LISTS = {
  genres:            GENRES,
  tropes:            TROPES,
  time_period:       TIME_PERIODS,
  relationship_type: RELATIONSHIP_TYPES,
  kink_tags:         KINK_TAGS,
  story_tags:        STORY_TAGS,
  content_warnings:  CONTENT_WARNINGS,
  representation:    REPRESENTATION,
  setting_tags:      SETTING_TAGS,
  geography_tags:    GEOGRAPHY_TAGS,
}

const ARRAY_FIELDS = Object.keys(FIELD_LISTS)
const SELECT_COLS  = `id,title,author,${ARRAY_FIELDS.join(',')}`

// tag.toLowerCase() → { field, canonical }
const REVERSE_MAP = {}
for (const [field, tags] of Object.entries(FIELD_LISTS)) {
  for (const tag of tags) {
    const lc = tag.toLowerCase()
    if (!REVERSE_MAP[lc]) REVERSE_MAP[lc] = { field, canonical: tag }
  }
}

function rerouteBook(book) {
  const current   = {}
  const newFields = {}
  for (const f of ARRAY_FIELDS) {
    current[f]   = [...(book[f] || [])]
    newFields[f] = []
  }
  for (const srcField of ARRAY_FIELDS) {
    for (const tag of current[srcField]) {
      const entry = REVERSE_MAP[tag.toLowerCase()]
      if (entry) {
        const { field: destField, canonical } = entry
        if (!newFields[destField].includes(canonical)) newFields[destField].push(canonical)
      } else {
        if (!newFields[srcField].includes(tag)) newFields[srcField].push(tag)
      }
    }
  }
  const changed = {}
  for (const f of ARRAY_FIELDS) {
    if (JSON.stringify([...current[f]].sort()) !== JSON.stringify([...newFields[f]].sort())) {
      changed[f] = { before: current[f], after: newFields[f] }
    }
  }
  return Object.keys(changed).length ? { newFields, changed } : null
}

async function fetchAllBooks() {
  const books = []
  let offset = 0
  while (true) {
    const { data } = await supabaseAdmin.from('books').select(SELECT_COLS).range(offset, offset + 999)
    if (!data?.length) break
    books.push(...data)
    if (data.length < 1000) break
    offset += 1000
  }
  return books
}

// GET — run audit, return list of books with misrouted tags
export async function GET(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const books  = await fetchAllBooks()
  const issues = []
  for (const book of books) {
    const result = rerouteBook(book)
    if (result) {
      issues.push({
        id:      book.id,
        title:   book.title,
        author:  book.author,
        changed: result.changed,
        patch:   Object.fromEntries(ARRAY_FIELDS.map(f => [f, result.newFields[f]])),
      })
    }
  }
  return NextResponse.json({ total: books.length, issues })
}

// POST { id } — fix a single book
export async function POST(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: book } = await supabaseAdmin.from('books').select(SELECT_COLS).eq('id', id).single()
  const result = rerouteBook(book)
  if (!result) return NextResponse.json({ ok: true, changed: false })

  const patch = Object.fromEntries(ARRAY_FIELDS.map(f => [f, result.newFields[f]]))
  const { error } = await supabaseAdmin.from('books').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, changed: true })
}

// PUT — fix all books with issues (bulk)
export async function PUT(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const books = await fetchAllBooks()
  let fixed = 0
  for (const book of books) {
    const result = rerouteBook(book)
    if (!result) continue
    const patch = Object.fromEntries(ARRAY_FIELDS.map(f => [f, result.newFields[f]]))
    await supabaseAdmin.from('books').update(patch).eq('id', book.id)
    fixed++
  }
  return NextResponse.json({ ok: true, fixed })
}

import { supabaseAdmin } from './supabase'

export function toTitleCase(str) {
  return str
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
}

export function makeSlug(title, author) {
  const base = `${title}${author ? '-' + author : ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// Finds a catalogue match for a title, or creates a stub book so
// enrich_missing.py can pick it up later. Shared by the shelf-scan
// (photo identification) and manual-add flows.
export async function matchOrCreateBook(title, author) {
  const normTitle  = toTitleCase(title)
  const normAuthor = toTitleCase(author || 'Unknown')

  let { data } = await supabaseAdmin
    .from('books')
    .select('id,title,author,cover_url,slug,rating')
    .ilike('title', title)
    .limit(1)
    .maybeSingle()

  if (!data) {
    const res = await supabaseAdmin
      .from('books')
      .select('id,title,author,cover_url,slug,rating')
      .ilike('title', `%${title}%`)
      .limit(1)
    data = res.data?.[0] ?? null
  }

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
      console.error('[matchOrCreateBook] insert failed for', title, ':', err.message)
    } else {
      isNew = true
    }
  }

  return { title, author, dbBook: data ?? null, isNew, ...(insertError ? { insertError } : {}) }
}

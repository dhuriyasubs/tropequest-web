import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase'

function norm(s = '') {
  return s
    .toLowerCase()
    .replace(/^(the |a |an )/i, '')
    .replace(/[^\w\s]/g, '')
    .trim()
}

function authorSim(a = '', b = '') {
  const na = norm(a), nb = norm(b)
  if (na === nb) return 1
  const lastA = na.split(/[\s,]+/).filter(Boolean).pop() ?? ''
  const lastB = nb.split(/[\s,]+/).filter(Boolean).pop() ?? ''
  if (lastA && lastA === lastB) return 0.8
  if (na.includes(lastB) || nb.includes(lastA)) return 0.6
  return 0
}

// POST { books: [{title, author, status, isbn, isbn13, gr_rating}] }
export async function POST(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { books } = await request.json()
  if (!Array.isArray(books) || !books.length) {
    return NextResponse.json({ error: 'books array required' }, { status: 400 })
  }

  const results = { imported: 0, updated: 0, queued: 0 }
  const upserts        = []   // { user_id, book_id } for tbr
  const ratingUpserts  = []   // { id, rating, rating_source } for matched books missing ratings
  const seriesUpserts  = []   // { id, series_name, series_number } for matched books missing series
  const toQueue        = []   // unmatched — goes to import_queue

  const BATCH = 10
  for (let i = 0; i < books.length; i += BATCH) {
    const chunk = books.slice(i, i + BATCH)
    await Promise.all(chunk.map(async ({ title, author, series_name, series_number, isbn, isbn13, gr_rating }) => {
      if (!title) return

      const normTitle = norm(title)
      let match = null

      // 1. ISBN13 exact match (most reliable)
      if (isbn13) {
        const { data } = await supabase
          .from('books')
          .select('id, title, author, rating, rating_source, series_name')
          .eq('isbn13', isbn13)
          .limit(1)
        match = data?.[0] ?? null
      }

      // 2. ISBN exact match
      if (!match && isbn) {
        const { data } = await supabase
          .from('books')
          .select('id, title, author, rating, rating_source, series_name')
          .eq('isbn', isbn)
          .limit(1)
        match = data?.[0] ?? null
      }

      // 3. Title ilike + author similarity
      if (!match) {
        const { data: exact } = await supabase
          .from('books')
          .select('id, title, author, rating, rating_source, series_name')
          .ilike('title', title.trim())
          .limit(5)

        if (exact?.length) {
          const best = exact.reduce((b, c) => {
            const score = authorSim(author, c.author)
            return score > (b?.score ?? -1) ? { ...c, score } : b
          }, null)
          if (best?.score >= 0.3) match = best
        }
      }

      // 2. Partial title fallback
      if (!match) {
        const words = normTitle.split(/\s+/).filter(w => w.length > 3).slice(0, 3)
        if (words.length) {
          const { data: partial } = await supabase
            .from('books')
            .select('id, title, author, rating, rating_source, series_name')
            .ilike('title', `%${words[0]}%`)
            .limit(10)

          if (partial?.length) {
            const best = partial
              .filter(b => norm(b.title).includes(words[0]))
              .reduce((best, b) => {
                const score = (norm(b.title) === normTitle ? 1 : 0.5) * 0.6 + authorSim(author, b.author) * 0.4
                return score > (best?.score ?? 0.3) ? { ...b, score } : best
              }, null)
            if (best) match = best
          }
        }
      }

      if (match) {
        upserts.push({ user_id: user.id, book_id: match.id })

        // Store GR rating on the book if it has none
        if (gr_rating && (!match.rating || !match.rating_source)) {
          ratingUpserts.push({ id: match.id, rating: gr_rating, rating_source: 'Goodreads' })
        }

        // Store series info if book is missing it
        if (series_name && !match.series_name) {
          seriesUpserts.push({ id: match.id, series_name, series_number: series_number ?? null })
        }
      } else {
        toQueue.push({ title, author, series_name: series_name ?? null, series_number: series_number ?? null, isbn: isbn ?? null, isbn13: isbn13 ?? null, gr_rating: gr_rating ?? null })
      }
    }))
  }

  // Bulk insert into tbr — deduplicate by book_id
  const seenBookIds = new Set()
  const dedupedUpserts = upserts.filter(u => {
    if (seenBookIds.has(u.book_id)) return false
    seenBookIds.add(u.book_id)
    return true
  })

  if (dedupedUpserts.length) {
    const bookIds = dedupedUpserts.map(u => u.book_id)
    const { data: existing } = await supabase
      .from('tbr')
      .select('book_id')
      .eq('user_id', user.id)
      .in('book_id', bookIds)

    const existingSet = new Set((existing ?? []).map(r => r.book_id))
    const newEntries = dedupedUpserts.filter(u => !existingSet.has(u.book_id))
    results.imported = newEntries.length
    results.updated  = dedupedUpserts.length - newEntries.length

    if (newEntries.length) {
      const { error } = await supabase
        .from('tbr')
        .insert(newEntries)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Update ratings on matched books (admin client, best-effort)
  if (ratingUpserts.length) {
    await Promise.all(
      ratingUpserts.map(({ id, rating, rating_source }) =>
        supabaseAdmin
          .from('books')
          .update({ rating, rating_source })
          .eq('id', id)
          .is('rating_source', null)  // only if not already set
      )
    )
  }

  // Update series info on matched books missing it (admin client, best-effort)
  if (seriesUpserts.length) {
    await Promise.all(
      seriesUpserts.map(({ id, series_name, series_number }) =>
        supabaseAdmin
          .from('books')
          .update({ series_name, series_number })
          .eq('id', id)
          .is('series_name', null)  // only if not already set
      )
    )
  }

  // Queue unmatched books for enrichment
  if (toQueue.length) {
    // Deduplicate within the batch by isbn13 first, then by title+author
    const seenIsbn13 = new Set()
    const seenTitleAuthor = new Set()
    const dedupedQueue = []
    for (const b of toQueue) {
      const key = `${b.title?.toLowerCase()}||${b.author?.toLowerCase()}`
      if (b.isbn13) {
        if (seenIsbn13.has(b.isbn13)) continue
        seenIsbn13.add(b.isbn13)
      } else {
        if (seenTitleAuthor.has(key)) continue
        seenTitleAuthor.add(key)
      }
      dedupedQueue.push(b)
    }

    // Rows with isbn13 — upsert (DB unique index handles cross-import dedup)
    const withIsbn13 = dedupedQueue.filter(b => b.isbn13)
    if (withIsbn13.length) {
      const { data: upserted } = await supabaseAdmin
        .from('import_queue')
        .upsert(withIsbn13, { onConflict: 'isbn13', ignoreDuplicates: true })
        .select('id')
      results.queued += upserted?.length ?? 0
    }

    // Rows without isbn13 — plain insert, pipeline deduplicates on title+author
    const withoutIsbn13 = dedupedQueue.filter(b => !b.isbn13)
    if (withoutIsbn13.length) {
      const { data: inserted } = await supabaseAdmin
        .from('import_queue')
        .insert(withoutIsbn13)
        .select('id')
      results.queued += inserted?.length ?? 0
    }
  }

  return NextResponse.json(results)
}

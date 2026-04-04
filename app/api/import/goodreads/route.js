import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase'

const STATUS_MAP = {
  'read':              'read',
  'currently-reading': 'reading',
  'to-read':           'unread',
}

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
  const upserts      = []   // { user_id, book_id, status }
  const ratingUpserts = []  // { id, rating, rating_count, rating_source } for matched books missing ratings
  const toQueue      = []   // unmatched — goes to import_queue

  const BATCH = 10
  for (let i = 0; i < books.length; i += BATCH) {
    const chunk = books.slice(i, i + BATCH)
    await Promise.all(chunk.map(async ({ title, author, status, isbn, isbn13, gr_rating }) => {
      if (!title) return

      const grStatus   = STATUS_MAP[status] ?? 'unread'
      const normTitle  = norm(title)
      let match = null

      // 1. ISBN13 exact match (most reliable)
      if (isbn13) {
        const { data } = await supabase
          .from('books')
          .select('id, title, author, rating, rating_source')
          .eq('isbn13', isbn13)
          .limit(1)
        match = data?.[0] ?? null
      }

      // 2. ISBN exact match
      if (!match && isbn) {
        const { data } = await supabase
          .from('books')
          .select('id, title, author, rating, rating_source')
          .eq('isbn', isbn)
          .limit(1)
        match = data?.[0] ?? null
      }

      // 3. Title ilike + author similarity
      if (!match) {
        const { data: exact } = await supabase
          .from('books')
          .select('id, title, author, rating, rating_source')
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
            .select('id, title, author, rating, rating_source')
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
        upserts.push({ user_id: user.id, book_id: match.id, status: grStatus })

        // Store GR rating on the book if it has none (or no source set)
        if (gr_rating && (!match.rating || !match.rating_source)) {
          ratingUpserts.push({ id: match.id, rating: gr_rating, rating_source: 'Goodreads' })
        }
      } else {
        toQueue.push({ title, author, isbn: isbn ?? null, isbn13: isbn13 ?? null, gr_rating: gr_rating ?? null })
      }
    }))
  }

  // Bulk upsert shelf entries
  if (upserts.length) {
    const bookIds = upserts.map(u => u.book_id)
    const { data: existing } = await supabase
      .from('shelf')
      .select('book_id')
      .eq('user_id', user.id)
      .in('book_id', bookIds)

    const existingSet = new Set((existing ?? []).map(r => r.book_id))
    results.imported = upserts.filter(u => !existingSet.has(u.book_id)).length
    results.updated  = upserts.filter(u =>  existingSet.has(u.book_id)).length

    const { error } = await supabase
      .from('shelf')
      .upsert(upserts, { onConflict: 'user_id,book_id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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

  // Queue unmatched books for enrichment
  if (toQueue.length) {
    // Deduplicate against existing queue rows by isbn13 (handled by DB unique index)
    // and by title+author for rows without isbn
    const { error: qErr } = await supabaseAdmin
      .from('import_queue')
      .upsert(toQueue, { onConflict: 'isbn13', ignoreDuplicates: true })

    // Also insert rows without isbn13 (upsert won't touch them due to partial index)
    const noIsbn = toQueue.filter(b => !b.isbn13)
    if (noIsbn.length) {
      await supabaseAdmin
        .from('import_queue')
        .insert(noIsbn)
        .select()  // ignore duplicates via DB — pipeline deduplicates on title+author
    }

    results.queued = toQueue.length
  }

  return NextResponse.json(results)
}

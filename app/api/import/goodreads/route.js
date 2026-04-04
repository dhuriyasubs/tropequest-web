import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'

const STATUS_MAP = {
  'read':              'read',
  'currently-reading': 'reading',
  'to-read':           'unread',
}

// Normalise a string for comparison: lowercase, strip punctuation/articles
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
  // Check last-name match (Goodreads sometimes gives "Last, First")
  const lastA = na.split(/[\s,]+/).filter(Boolean).pop() ?? ''
  const lastB = nb.split(/[\s,]+/).filter(Boolean).pop() ?? ''
  if (lastA && lastA === lastB) return 0.8
  if (na.includes(lastB) || nb.includes(lastA)) return 0.6
  return 0
}

// POST { books: [{title, author, status}] }
export async function POST(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { books } = await request.json()
  if (!Array.isArray(books) || !books.length) {
    return NextResponse.json({ error: 'books array required' }, { status: 400 })
  }

  const results = { imported: 0, updated: 0, notFound: 0, notFoundTitles: [] }

  // Process in batches of 10 to avoid overwhelming DB
  const BATCH = 10
  const upserts = []

  for (let i = 0; i < books.length; i += BATCH) {
    const chunk = books.slice(i, i + BATCH)
    await Promise.all(chunk.map(async ({ title, author, status }) => {
      if (!title) return

      const grStatus = STATUS_MAP[status] ?? 'unread'
      const normTitle = norm(title)

      // Try exact title match first, then partial
      const { data: exact } = await supabase
        .from('books')
        .select('id, title, author')
        .ilike('title', title.trim())
        .limit(5)

      let match = null

      if (exact?.length) {
        // Pick best author match
        match = exact.reduce((best, b) => {
          const score = authorSim(author, b.author)
          return score > (best?.score ?? -1) ? { ...b, score } : best
        }, null)
        if (match?.score < 0.3) match = null
      }

      if (!match) {
        // Partial title fallback
        const words = normTitle.split(/\s+/).filter(w => w.length > 3).slice(0, 3)
        if (words.length) {
          const { data: partial } = await supabase
            .from('books')
            .select('id, title, author')
            .ilike('title', `%${words[0]}%`)
            .limit(10)

          if (partial?.length) {
            const candidates = partial.filter(b => norm(b.title).includes(words[0]))
            match = candidates.reduce((best, b) => {
              const titleScore = norm(b.title) === normTitle ? 1 : 0.5
              const score = titleScore * 0.6 + authorSim(author, b.author) * 0.4
              return score > (best?.score ?? 0.3) ? { ...b, score } : best
            }, null)
          }
        }
      }

      if (!match) {
        results.notFound++
        results.notFoundTitles.push(title)
        return
      }

      upserts.push({ user_id: user.id, book_id: match.id, status: grStatus })
    }))
  }

  if (upserts.length) {
    // Check existing shelf entries to count updates vs new imports
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

  return NextResponse.json(results)
}

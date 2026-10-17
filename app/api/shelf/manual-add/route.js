import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { matchOrCreateBook } from '@/lib/bookStub'

// Lets a user add a book by typing title/author when catalogue search
// finds nothing — matches an existing row if one exists (so manual entry
// can't create duplicates of books already in the DB under a slightly
// different spelling), otherwise creates a stub for enrich_missing.py.
export async function POST(request) {
  const { title, author } = await request.json()
  const trimTitle = title?.trim()
  if (!trimTitle) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dbBook, isNew, insertError } = await matchOrCreateBook(trimTitle, author?.trim())
  if (!dbBook) return NextResponse.json({ error: insertError ?? 'Could not add book' }, { status: 500 })

  const { data: existing } = await supabase
    .from('shelf')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('book_id', dbBook.id)
    .single()

  if (existing) {
    return NextResponse.json({ dbBook, isNew, alreadyInShelf: true, status: existing.status })
  }

  await supabase.from('shelf').insert({ user_id: user.id, book_id: dbBook.id, status: 'unread' })
  return NextResponse.json({ dbBook, isNew, alreadyInShelf: false, status: 'unread' })
}

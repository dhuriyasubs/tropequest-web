import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { matchOrCreateBook } from '@/lib/bookStub'

const VALID_STATUSES = ['unread', 'reading', 'read', 'dnf']
const VALID_FORMATS  = ['physical', 'virtual']
const MAX_MEMBER_LABEL_LENGTH = 40

// Lets a user add a book by typing title/author when catalogue search
// finds nothing — matches an existing row if one exists (so manual entry
// can't create duplicates of books already in the DB under a slightly
// different spelling), otherwise creates a stub for enrich_missing.py.
export async function POST(request) {
  const { title, author, status, format, member } = await request.json()
  const trimTitle = title?.trim()
  if (!trimTitle) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dbBook, isNew, insertError } = await matchOrCreateBook(trimTitle, author?.trim())
  if (!dbBook) return NextResponse.json({ error: insertError ?? 'Could not add book' }, { status: 500 })

  const { data: existing } = await supabase
    .from('shelf')
    .select('id, status, format, member_label')
    .eq('user_id', user.id)
    .eq('book_id', dbBook.id)
    .single()

  if (existing) {
    return NextResponse.json({ dbBook, isNew, alreadyInShelf: true, ...existing })
  }

  const row = {
    user_id: user.id,
    book_id: dbBook.id,
    status: VALID_STATUSES.includes(status) ? status : 'unread',
    format: VALID_FORMATS.includes(format) ? format : 'physical',
    member_label: member?.trim().slice(0, MAX_MEMBER_LABEL_LENGTH) || null,
  }
  await supabase.from('shelf').insert(row)
  return NextResponse.json({ dbBook, isNew, alreadyInShelf: false, status: row.status, format: row.format, member_label: row.member_label })
}

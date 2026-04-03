import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'

const VALID_STATUSES = ['owned', 'reading', 'read']

// POST { bookId }             → toggle (add as owned / remove)
// POST { bookId, status }     → set specific status (upsert)
// POST { bookId, status: null } → remove
export async function POST(request) {
  const { bookId, status } = await request.json()
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!bookId) return NextResponse.json({ error: 'bookId is required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('shelf')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('book_id', bookId)
    .single()

  // Explicit null status or toggle-remove
  if (status === null || (!status && existing)) {
    if (existing) {
      await supabase.from('shelf').delete().eq('id', existing.id)
    }
    return NextResponse.json({ status: null })
  }

  const newStatus = VALID_STATUSES.includes(status) ? status : 'owned'

  if (existing) {
    await supabase.from('shelf').update({ status: newStatus }).eq('id', existing.id)
  } else {
    await supabase.from('shelf').insert({ user_id: user.id, book_id: bookId, status: newStatus })
  }

  return NextResponse.json({ status: newStatus })
}

import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'

const VALID_STATUSES = ['unread', 'reading', 'read', 'dnf']
const VALID_FORMATS  = ['physical', 'virtual']

// POST { bookId }                 → toggle (add as unread / remove)
// POST { bookId, status }         → set specific status (upsert)
// POST { bookId, status: null }   → remove
// POST { bookId, format }         → set physical/virtual without touching status
export async function POST(request) {
  const { bookId, status, format } = await request.json()
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!bookId) return NextResponse.json({ error: 'bookId is required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('shelf')
    .select('id, status, format')
    .eq('user_id', user.id)
    .eq('book_id', bookId)
    .single()

  // Explicit null status, or a bare toggle call (no status/format given) on an existing entry
  if (status === null || (status === undefined && format === undefined && existing)) {
    if (existing) {
      await supabase.from('shelf').delete().eq('id', existing.id)
    }
    return NextResponse.json({ status: null })
  }

  const updates = {}
  if (status !== undefined) updates.status = VALID_STATUSES.includes(status) ? status : 'unread'
  if (format !== undefined) updates.format = VALID_FORMATS.includes(format) ? format : 'physical'

  if (existing) {
    await supabase.from('shelf').update(updates).eq('id', existing.id)
  } else {
    await supabase.from('shelf').insert({
      user_id: user.id,
      book_id: bookId,
      status: updates.status ?? 'unread',
      ...(updates.format ? { format: updates.format } : {}),
    })
  }

  return NextResponse.json({
    status: updates.status ?? existing?.status ?? 'unread',
    format: updates.format ?? existing?.format ?? 'physical',
  })
}

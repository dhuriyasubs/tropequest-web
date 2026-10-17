import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'

const VALID_STATUSES = ['unread', 'reading', 'read', 'dnf']
const VALID_FORMATS  = ['physical', 'virtual']
const MAX_MEMBER_LABEL_LENGTH = 40

// POST { bookId }                 → toggle (add as unread / remove)
// POST { bookId, status }         → set specific status (upsert)
// POST { bookId, status: null }   → remove
// POST { bookId, format }         → set physical/virtual without touching status
// POST { bookId, member }         → set/clear (member: null) whose copy this is, without touching status
export async function POST(request) {
  const { bookId, status, format, member } = await request.json()
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!bookId) return NextResponse.json({ error: 'bookId is required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('shelf')
    .select('id, status, format, member_label')
    .eq('user_id', user.id)
    .eq('book_id', bookId)
    .single()

  // Explicit null status, or a bare toggle call (no status/format/member given) on an existing entry
  if (status === null || (status === undefined && format === undefined && member === undefined && existing)) {
    if (existing) {
      await supabase.from('shelf').delete().eq('id', existing.id)
    }
    return NextResponse.json({ status: null })
  }

  const updates = {}
  if (status !== undefined) updates.status = VALID_STATUSES.includes(status) ? status : 'unread'
  if (format !== undefined) updates.format = VALID_FORMATS.includes(format) ? format : 'physical'
  if (member !== undefined) updates.member_label = member?.trim().slice(0, MAX_MEMBER_LABEL_LENGTH) || null

  if (existing) {
    await supabase.from('shelf').update(updates).eq('id', existing.id)
  } else {
    await supabase.from('shelf').insert({
      user_id: user.id,
      book_id: bookId,
      status: updates.status ?? 'unread',
      ...(updates.format ? { format: updates.format } : {}),
      ...(updates.member_label ? { member_label: updates.member_label } : {}),
    })
  }

  return NextResponse.json({
    status:       updates.status       ?? existing?.status       ?? 'unread',
    format:       updates.format       ?? existing?.format       ?? 'physical',
    member_label: 'member_label' in updates ? updates.member_label : (existing?.member_label ?? null),
  })
}

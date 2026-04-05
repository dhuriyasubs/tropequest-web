import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'

export async function POST(request) {
  const body    = await request.json()
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Bulk insert: { bookIds: [1,2,3], source: 'video' }
  if (Array.isArray(body.bookIds)) {
    const rows = body.bookIds.map(bookId => ({
      user_id: user.id,
      book_id: bookId,
      source:  body.source ?? null,
    }))
    await supabase.from('tbr').upsert(rows, { onConflict: 'user_id,book_id', ignoreDuplicates: true })
    return NextResponse.json({ saved: true, count: rows.length })
  }

  // Single toggle: { bookId: 1 }
  const { bookId } = body
  const { data: existing } = await supabase
    .from('tbr')
    .select('id')
    .eq('user_id', user.id)
    .eq('book_id', bookId)
    .single()

  if (existing) {
    await supabase.from('tbr').delete().eq('id', existing.id)
    return NextResponse.json({ saved: false })
  } else {
    await supabase.from('tbr').insert({ user_id: user.id, book_id: bookId })
    return NextResponse.json({ saved: true })
  }
}

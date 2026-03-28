import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'

export async function POST(request) {
  const { bookId } = await request.json()
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

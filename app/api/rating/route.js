import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'

export async function POST(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bookId, rating } = await request.json()
  if (!bookId) return NextResponse.json({ error: 'Missing bookId' }, { status: 400 })

  // rating = 0 means remove
  if (!rating) {
    await supabase.from('ratings').delete()
      .eq('user_id', user.id)
      .eq('book_id', bookId)
    return NextResponse.json({ rating: null })
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 })
  }

  const { error } = await supabase.from('ratings').upsert(
    { user_id: user.id, book_id: bookId, rating },
    { onConflict: 'user_id,book_id' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ rating })
}

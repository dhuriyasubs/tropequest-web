import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'

export async function POST(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { identifiedTitle, identifiedAuthor, correctTitle, correctAuthor, notes } = await request.json()
  if (!identifiedTitle) return NextResponse.json({ error: 'identifiedTitle is required' }, { status: 400 })

  const { error } = await supabase.from('scan_feedback').insert({
    user_id:           user.id,
    identified_title:  identifiedTitle,
    identified_author: identifiedAuthor ?? null,
    correct_title:     correctTitle     ?? null,
    correct_author:    correctAuthor    ?? null,
    notes:             notes            ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

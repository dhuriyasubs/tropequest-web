import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'

export async function POST(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tropes, genres, subjects, authors } = await request.json()

  const { error } = await supabase.from('user_interests').upsert({
    user_id:    user.id,
    tropes:     tropes   ?? [],
    genres:     genres   ?? [],
    subjects:   subjects ?? [],
    authors:    authors  ?? [],
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

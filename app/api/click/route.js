import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  const { book_id, store } = await request.json()
  if (!book_id || !store) return NextResponse.json({ ok: false }, { status: 400 })

  await supabaseAdmin.from('click_events').insert({ book_id, store })
  return NextResponse.json({ ok: true })
}

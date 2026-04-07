import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { author_name, bio } = await request.json()
  if (!author_name?.trim()) return NextResponse.json({ error: 'author_name required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('author_bios')
    .upsert({ author_name: author_name.trim(), bio }, { onConflict: 'author_name' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET(request) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const author_name = searchParams.get('author')
  if (!author_name) return NextResponse.json({ bio: null })

  const { data } = await supabaseAdmin
    .from('author_bios')
    .select('bio')
    .eq('author_name', author_name)
    .single()

  const bio = data?.bio ?? null
  return NextResponse.json({ bio: typeof bio === 'string' ? JSON.parse(bio) : bio })
}

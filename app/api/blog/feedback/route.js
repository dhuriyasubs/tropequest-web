import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  const { slug, helpful } = await request.json()
  if (!slug || typeof helpful !== 'boolean') {
    return NextResponse.json({ error: 'slug and helpful required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('blog_feedback')
    .insert({ slug, helpful })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

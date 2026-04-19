import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request, { params }) {
  const { slug } = params
  const { data: book } = await supabaseAdmin
    .from('books')
    .select('id, title, cover_url')
    .eq('slug', slug)
    .single()

  if (!book) return NextResponse.json({ book: null })
  return NextResponse.json({ book })
}

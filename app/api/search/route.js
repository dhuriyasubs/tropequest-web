import { NextResponse } from 'next/server'
import { searchBooks } from '@/lib/search'

export async function GET(request) {
  const { searchParams } = new URL(request.url)

  const query             = searchParams.get('q') || null
  const tropes            = searchParams.getAll('tropes')
  const subjects          = searchParams.getAll('subjects')
  const genres            = searchParams.getAll('genres')
  const relationshipTypes = searchParams.getAll('relTypes')
  const page              = Number(searchParams.get('page') || 1)
  const minSpice          = searchParams.get('minSpice') ? Number(searchParams.get('minSpice')) : null

  try {
    const result = await searchBooks({ query, tropes, subjects, genres, minSpice, relationshipTypes, page })
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { searchBooks } from '@/lib/search'

export async function GET(request) {
  const { searchParams } = new URL(request.url)

  const query             = searchParams.get('q') || null
  const tropes            = searchParams.getAll('tropes')
  const subjects          = searchParams.getAll('subjects')
  const genres            = searchParams.getAll('genres')
  const representation    = searchParams.getAll('representation')
  const relationshipTypes = searchParams.getAll('relTypes')
  const excludeTropes         = searchParams.getAll('excludeTropes')
  const excludeGenres         = searchParams.getAll('excludeGenres')
  const excludeRepresentation = searchParams.getAll('excludeRepresentation')
  const page              = Number(searchParams.get('page') || 1)
  const spice          = searchParams.get('spice') ? Number(searchParams.get('spice')) : null
  const coreOnly        = searchParams.get('coreOnly') !== 'false'

  try {
    const result = await searchBooks({
      query, tropes, subjects, genres, representation, spice, relationshipTypes,
      excludeTropes, excludeGenres, excludeRepresentation, page, coreOnly,
    })
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

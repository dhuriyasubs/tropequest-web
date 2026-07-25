import { searchBooks, getPopularTropes, getPopularGenres, getPopularRelationshipTypes, getPopularRepresentation } from '@/lib/search'
import { createSupabaseServer } from '@/lib/supabase'
import SearchClient from '@/components/SearchClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Browse Books',
  description: 'Search romance and thriller books by trope, author, series, mood and more.',
  alternates: { canonical: '/search' },
  openGraph: { url: '/search' },
}

export default async function SearchPage({ searchParams }) {
  const query             = searchParams.q || ''
  const tropes            = [searchParams.tropes].flat().filter(Boolean)
  const subjects          = [searchParams.subjects].flat().filter(Boolean)
  const genres            = [searchParams.genres].flat().filter(Boolean)
  const representation    = [searchParams.representation].flat().filter(Boolean)
  const relationshipTypes = [searchParams.relTypes].flat().filter(Boolean)
  const excludeTropes         = [searchParams.excludeTropes].flat().filter(Boolean)
  const excludeGenres         = [searchParams.excludeGenres].flat().filter(Boolean)
  const excludeRepresentation = [searchParams.excludeRepresentation].flat().filter(Boolean)
  const page              = Number(searchParams.page || 1)
  const spice          = searchParams.spice ? Number(searchParams.spice) : null

  const supabase = createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  const [{ books, total }, allTropes, allGenres, allRelTypes, allRepresentation, shelfRes] =
    await Promise.all([
      searchBooks({
        query: query || null, tropes, subjects, genres, representation, spice, relationshipTypes,
        excludeTropes, excludeGenres, excludeRepresentation, page,
      }),
      getPopularTropes(50),
      getPopularGenres(50),
      getPopularRelationshipTypes(),
      getPopularRepresentation(),
      user
        ? supabase.from('shelf').select('book_id, status').eq('user_id', user.id)
        : Promise.resolve({ data: [] }),
    ])

  // Map bookId → status for badge display in SearchClient
  const shelfMap = {}
  for (const r of shelfRes.data ?? []) shelfMap[r.book_id] = r.status

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:py-10">
      <h1 className="hidden sm:block font-serif text-3xl font-bold mb-8">Browse Books</h1>
      <SearchClient
        initialBooks={books}
        initialTotal={total}
        tropes={allTropes}
        genres={allGenres}
        relationshipTypes={allRelTypes}
        representationOptions={allRepresentation}
        initialQuery={query}
        initialSelTropes={tropes}
        initialSelSubjects={subjects}
        initialSelGenres={genres}
        initialSelRelTypes={relationshipTypes}
        initialSelRepresentation={representation}
        initialExcludeTropes={excludeTropes}
        initialExcludeGenres={excludeGenres}
        initialExcludeRepresentation={excludeRepresentation}
        initialSpice={spice}
        initialPage={page}
        shelfMap={shelfMap}
        autoFocus={!query && !tropes.length && !genres.length && !spice}
      />
    </div>
  )
}

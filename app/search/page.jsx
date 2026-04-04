import { searchBooks, getPopularTropes, getPopularGenres } from '@/lib/search'
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
  const query    = searchParams.q || ''
  const tropes   = [searchParams.tropes].flat().filter(Boolean)
  const subjects = [searchParams.subjects].flat().filter(Boolean)
  const genres   = [searchParams.genres].flat().filter(Boolean)
  const page     = Number(searchParams.page || 1)

  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ books, total }, allTropes, allGenres, shelfRes] =
    await Promise.all([
      searchBooks({ query: query || null, tropes, subjects, genres, page }),
      getPopularTropes(50),
      getPopularGenres(50),
      user
        ? supabase.from('shelf').select('book_id, status').eq('user_id', user.id)
        : Promise.resolve({ data: [] }),
    ])

  // Map bookId → status for badge display in SearchClient
  const shelfMap = {}
  for (const r of shelfRes.data ?? []) shelfMap[r.book_id] = r.status

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-8">Browse Books</h1>
      <SearchClient
        initialBooks={books}
        initialTotal={total}
        tropes={allTropes}
        genres={allGenres}
        initialQuery={query}
        initialSelTropes={tropes}
        initialSelSubjects={subjects}
        initialSelGenres={genres}
        initialPage={page}
        shelfMap={shelfMap}
      />
    </div>
  )
}

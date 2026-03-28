import { searchBooks, getPopularTropes } from '@/lib/search'
import SearchClient from '@/components/SearchClient'

export const metadata = {
  title: 'Browse Books',
  description: 'Search romance and thriller books by trope, author, series, mood and more.',
}

export default async function SearchPage({ searchParams }) {
  const query    = searchParams.q || ''
  const tropes   = [searchParams.tropes].flat().filter(Boolean)
  const subjects = [searchParams.subjects].flat().filter(Boolean)
  const page     = Number(searchParams.page || 1)

  const [{ books, total }, allTropes] =
    await Promise.all([
      searchBooks({ query: query || null, tropes, subjects, page }),
      getPopularTropes(50),
    ])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-8">Browse Books</h1>
      <SearchClient
        initialBooks={books}
        initialTotal={total}
        tropes={allTropes}
        initialQuery={query}
        initialSelTropes={tropes}
        initialSelSubjects={subjects}
        initialPage={page}
      />
    </div>
  )
}

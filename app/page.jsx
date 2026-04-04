import Link from 'next/link'
import BookCard from '@/components/BookCard'
import HeroGrid from '@/components/HeroGrid'
import { getFeaturedBooks, getPopularTropes, getPersonalizedBooks, getSeriesCompletionBooks, getBecauseYouReadBooks } from '@/lib/search'
import SeriesCompletionSection from '@/components/SeriesCompletionSection'
import { createSupabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export const metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
}

export default async function HomePage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let interests    = null
  let readBookIds  = []
  if (user) {
    const [interestsRes, shelfRes] = await Promise.all([
      supabase.from('user_interests').select('tropes, subjects, authors').eq('user_id', user.id).single(),
      supabase.from('shelf').select('book_id').eq('user_id', user.id).eq('status', 'read'),
    ])
    if (interestsRes.data && (interestsRes.data.tropes?.length || interestsRes.data.subjects?.length || interestsRes.data.authors?.length)) {
      interests = interestsRes.data
    }
    readBookIds = (shelfRes.data ?? []).map(r => r.book_id)
  }

  const [books, popularTropes, personalizedBooks, seriesBooks, becauseYouRead] = await Promise.all([
    getFeaturedBooks(12),
    getPopularTropes(50),
    interests ? getPersonalizedBooks({ ...interests, excludeIds: readBookIds }) : Promise.resolve([]),
    user ? getSeriesCompletionBooks(user.id) : Promise.resolve([]),
    user ? getBecauseYouReadBooks(user.id) : Promise.resolve(null),
  ])

  return (
    <>
      {/* Hero — Trope Grid */}
      <HeroGrid tropes={popularTropes} />

      {/* Personalised picks */}
      {personalizedBooks.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="font-serif text-2xl font-semibold mb-1">Picked for You</h2>
          <p className="text-sm text-slate mb-5">Based on your interests</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {personalizedBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}

      {/* Complete the Series */}
      <SeriesCompletionSection series={seriesBooks} />

      {/* Because you read X */}
      {becauseYouRead?.books?.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="font-serif text-2xl font-semibold mb-1">
            Because you read <span className="text-bloom italic">{becauseYouRead.seedTitle}</span>
          </h2>
          <p className="text-sm text-slate mb-5">Books with similar tropes you might love</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {becauseYouRead.books.slice(0, 12).map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}

      {/* Top rated */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="font-serif text-2xl font-semibold mb-5">Top Rated</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {books.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/search" className="btn-primary">
            Browse all books
          </Link>
        </div>
      </section>
    </>
  )
}

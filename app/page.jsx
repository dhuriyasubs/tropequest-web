import { Suspense } from 'react'
import Link from 'next/link'
import BookCard from '@/components/BookCard'
import HeroGrid from '@/components/HeroGrid'
import SeriesCompletionSection from '@/components/SeriesCompletionSection'
import { getFeaturedBooks, getPopularTropes, getPersonalizedBooks, getSeriesCompletionBooks, getBecauseYouReadBooks } from '@/lib/search'
import { createSupabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export const metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
}

// ── Personalized sections — streamed in after shell ───────────────────────
async function PersonalisedSections({ userId }) {
  const supabase = createSupabaseServer()

  const [interestsRes, shelfRes] = await Promise.all([
    supabase.from('user_interests').select('tropes, subjects, authors').eq('user_id', userId).single(),
    supabase.from('shelf').select('book_id').eq('user_id', userId).eq('status', 'read'),
  ])

  const interests = (interestsRes.data?.tropes?.length || interestsRes.data?.subjects?.length || interestsRes.data?.authors?.length)
    ? interestsRes.data : null
  const readBookIds = (shelfRes.data ?? []).map(r => r.book_id)

  const [personalizedBooks, seriesBooks, becauseYouRead] = await Promise.all([
    interests ? getPersonalizedBooks({ ...interests, excludeIds: readBookIds }) : Promise.resolve([]),
    getSeriesCompletionBooks(userId),
    getBecauseYouReadBooks(userId),
  ])

  return (
    <>
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

      <SeriesCompletionSection series={seriesBooks} />

      {becauseYouRead?.books?.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="font-serif text-2xl font-semibold mb-1">
            Because you read{' '}
            <Link href={`/search?like=${becauseYouRead.seedSlug}`} className="text-bloom italic hover:underline">
              {becauseYouRead.seedTitle}
            </Link>
          </h2>
          <p className="text-sm text-slate mb-5">Books with similar tropes you might love</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {becauseYouRead.books.slice(0, 12).map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function PersonalisedSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      {[1, 2].map(i => (
        <div key={i}>
          <div className="h-6 w-48 bg-gray-100 rounded animate-pulse mb-2" />
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-5" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="aspect-[2/3] bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default async function HomePage() {
  // Kick off cached public fetches immediately — don't wait for auth
  const publicPromise = Promise.all([
    getFeaturedBooks(12),
    getPopularTropes(50),
  ])

  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const [books, popularTropes] = await publicPromise

  return (
    <>
      <HeroGrid tropes={popularTropes} />

      {user && (
        <Suspense fallback={<PersonalisedSkeleton />}>
          <PersonalisedSections userId={user.id} />
        </Suspense>
      )}

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

import Link from 'next/link'
import BookCard from '@/components/BookCard'
import HeroGrid from '@/components/HeroGrid'
import { getFeaturedBooks, getPopularTropes, getPersonalizedBooks } from '@/lib/search'
import { createSupabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let interests = null
  if (user) {
    const { data } = await supabase
      .from('user_interests')
      .select('tropes, subjects, authors')
      .eq('user_id', user.id)
      .single()
    if (data && (data.tropes?.length || data.subjects?.length || data.authors?.length)) {
      interests = data
    }
  }

  const [books, popularTropes, personalizedBooks] = await Promise.all([
    getFeaturedBooks(12),
    getPopularTropes(20),
    interests ? getPersonalizedBooks(interests) : Promise.resolve([]),
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

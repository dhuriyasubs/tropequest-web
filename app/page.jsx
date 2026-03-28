import Link from 'next/link'
import BookCard from '@/components/BookCard'
import { getFeaturedBooks, getFilterOptions } from '@/lib/search'

export const revalidate = 3600 // regenerate every hour

const HERO_TROPES = [
  'Enemies to Lovers', 'Slow Burn', 'Forced Proximity',
  'Dark Romance', 'Fake Dating', 'Second Chance',
  'Grumpy x Sunshine', 'Found Family', 'Forbidden Love',
]

export default async function HomePage() {
  const [books, { tropes }] = await Promise.all([
    getFeaturedBooks(12),
    getFilterOptions(),
  ])

  return (
    <>
      {/* Hero */}
      <section className="bg-plum text-white py-20 px-4 text-center">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">
          Find books by the tropes you love
        </h1>
        <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
          Browse 500+ romance and thriller books. Filter by trope, author, series, or mood.
        </p>
        <Link href="/search" className="btn-primary text-base px-6 py-3">
          Start Browsing
        </Link>
      </section>

      {/* Trope pills */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="font-serif text-2xl font-semibold mb-5">Browse by Trope</h2>
        <div className="flex flex-wrap gap-2">
          {HERO_TROPES.map(t => (
            <Link
              key={t}
              href={`/search?tropes=${encodeURIComponent(t)}`}
              className="chip"
            >
              {t}
            </Link>
          ))}
          <Link href="/tropes" className="chip border-dashed">
            View all →
          </Link>
        </div>
      </section>

      {/* Featured books */}
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

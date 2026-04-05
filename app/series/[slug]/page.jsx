import { notFound } from 'next/navigation'
import Link from 'next/link'
import BookCard from '@/components/BookCard'
import Breadcrumb from '@/components/Breadcrumb'
import { getAllSeries, getBooksBySeries } from '@/lib/search'
import { slugify } from '@/lib/utils'

export const revalidate = 3600

export async function generateMetadata({ params }) {
  const series = await getAllSeries()
  const match  = series.find(s => slugify(s.series_name) === params.slug)
  if (!match) return {}
  const description = `Browse all books in the ${match.series_name} series by ${match.author} on TropeQuest.`
  return {
    title: `${match.series_name} Series`,
    description,
    alternates: { canonical: `/series/${params.slug}` },
    openGraph: {
      title: `${match.series_name} Series | TropeQuest`,
      description,
      url: `/series/${params.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${match.series_name} Series | TropeQuest`,
      description,
    },
  }
}

export default async function SeriesDetailPage({ params }) {
  const series = await getAllSeries()
  const match  = series.find(s => slugify(s.series_name) === params.slug)
  if (!match) notFound()

  const books = await getBooksBySeries(match.series_name)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Breadcrumb crumbs={[
        { label: 'Home', href: '/' },
        { label: 'Series', href: '/series' },
        { label: match.series_name },
      ]} />

      <h1 className="font-serif text-3xl font-bold mb-1">{match.series_name}</h1>
      <Link
        href={`/author/${encodeURIComponent(match.author)}`}
        className="text-bloom font-medium hover:underline text-sm"
      >
        {match.author}
      </Link>
      <p className="text-slate text-sm mt-1 mb-10">{books.length} {books.length === 1 ? 'book' : 'books'}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {books.map((b, i) => (
          <div key={b.id} className="relative">
            {b.series_number != null && (
              <span className="absolute top-2 left-2 z-10 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                #{b.series_number}
              </span>
            )}
            <BookCard book={b} />
          </div>
        ))}
      </div>
    </div>
  )
}

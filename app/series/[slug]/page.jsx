import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Breadcrumb from '@/components/Breadcrumb'
import { getAllSeries, getBooksBySeries } from '@/lib/search'
import { slugify } from '@/lib/utils'

export const revalidate = 3600

export async function generateMetadata({ params }) {
  const series = await getAllSeries()
  const match  = series.find(s => slugify(s.series_name) === params.slug)
  if (!match) return {}
  const { series_name, author } = match
  const title       = `${series_name} Series Reading Order — ${author}`
  const description = `The complete ${series_name} reading order by ${author}. All books in the series listed in order with ratings, tropes, and summaries.`
  return {
    title,
    description,
    alternates: { canonical: `/series/${params.slug}` },
    openGraph: {
      title: `${title} | TropeQuest`,
      description,
      url: `/series/${params.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | TropeQuest`,
      description,
    },
  }
}

export default async function SeriesDetailPage({ params }) {
  const series = await getAllSeries()
  const match  = series.find(s => slugify(s.series_name) === params.slug)
  if (!match) notFound()

  const books = await getBooksBySeries(match.series_name)
  if (!books.length) notFound()

  // Common tropes across series (top 6)
  const tropeCount = {}
  for (const b of books) {
    for (const t of b.tropes ?? []) {
      tropeCount[t] = (tropeCount[t] ?? 0) + 1
    }
  }
  const commonTropes = Object.entries(tropeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([t]) => t)

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BookSeries',
    name: match.series_name,
    author: { '@type': 'Person', name: match.author },
    numberOfItems: books.length,
    hasPart: books.map(b => ({
      '@type': 'Book',
      name: b.title,
      author: { '@type': 'Person', name: b.author },
      position: b.series_number,
      url: `https://tropequest.com/books/${b.slug}`,
      aggregateRating: b.rating ? {
        '@type': 'AggregateRating',
        ratingValue: b.rating,
        ratingCount: b.rating_count ?? 1,
        bestRating: 5,
      } : undefined,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Series', href: '/series' },
          { label: match.series_name },
        ]} />

        {/* Header */}
        <h1 className="font-serif text-3xl font-bold mb-1">
          {match.series_name}
        </h1>
        <div className="flex items-center gap-3 mb-2">
          <Link
            href={`/author/${encodeURIComponent(match.author)}`}
            className="text-bloom font-medium hover:underline text-sm"
          >
            {match.author}
          </Link>
          <span className="text-slate/40 text-sm">·</span>
          <span className="text-slate text-sm">{books.length} {books.length === 1 ? 'book' : 'books'}</span>
        </div>

        {/* Common tropes */}
        {commonTropes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 mb-8">
            {commonTropes.map(t => (
              <Link
                key={t}
                href={`/tropes/${slugify(t)}`}
                className="chip text-xs"
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        {/* Reading order heading */}
        <h2 className="font-serif text-xl font-semibold mb-4 mt-2">Reading Order</h2>

        {/* Book list */}
        <ol className="space-y-4">
          {books.map((b, i) => (
            <li key={b.id}>
              <Link
                href={`/books/${b.slug}`}
                className="group flex gap-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-3"
              >
                {/* Number */}
                <div className="shrink-0 w-7 flex items-start justify-center pt-1">
                  <span className="text-sm font-bold text-bloom/70">
                    {b.series_number != null ? `#${b.series_number}` : `${i + 1}`}
                  </span>
                </div>

                {/* Cover */}
                <div className="relative shrink-0 w-14 h-20 rounded overflow-hidden bg-gray-100">
                  {b.cover_url ? (
                    <Image
                      src={b.cover_url}
                      alt={`${b.title} cover`}
                      fill
                      sizes="56px"
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">📚</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col justify-center gap-1 min-w-0">
                  <p className="font-serif font-semibold text-sm leading-tight group-hover:text-bloom transition-colors line-clamp-2">
                    {b.title}
                  </p>
                  {b.rating && (
                    <p className="text-xs text-bloom font-medium">★ {b.rating.toFixed(1)}</p>
                  )}
                  {b.tropes?.length > 0 && (
                    <p className="text-xs text-slate/60 line-clamp-1">
                      {b.tropes.slice(0, 3).join(' · ')}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ol>

        {/* Footer CTA */}
        <p className="mt-10 text-sm text-slate">
          Looking for more by{' '}
          <Link href={`/author/${encodeURIComponent(match.author)}`} className="text-bloom hover:underline font-medium">
            {match.author}
          </Link>
          ? Browse all their books including standalones and other series.
        </p>
      </div>
    </>
  )
}

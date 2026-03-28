import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBookBySlug, getSeriesBooks, getMoreByAuthor, getAllSlugs } from '@/lib/search'
import BuyButtons from '@/components/BuyButtons'

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }) {
  const book = await getBookBySlug(params.slug)
  if (!book) return {}
  return {
    title: `${book.title} by ${book.author}`,
    description: book.description?.slice(0, 155) || `Find ${book.title} on TropeQuest.`,
    openGraph: {
      title: book.title,
      description: book.description?.slice(0, 155),
      images: book.cover_url ? [book.cover_url] : [],
    },
  }
}

export default async function BookPage({ params }) {
  const book = await getBookBySlug(params.slug)
  if (!book) notFound()

  const [seriesBooks, moreByAuthor] = await Promise.all([
    book.series_name ? getSeriesBooks(book.series_name, book.id) : [],
    getMoreByAuthor(book.author, book.id),
  ])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    author: { '@type': 'Person', name: book.author },
    image: book.cover_url,
    description: book.description,
    aggregateRating: book.rating
      ? { '@type': 'AggregateRating', ratingValue: book.rating, reviewCount: book.rating_count || 1 }
      : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row gap-10">
          {/* Cover */}
          <div className="shrink-0 mx-auto sm:mx-0">
            <div className="w-44 aspect-[2/3] rounded-lg overflow-hidden shadow-lg bg-gray-100">
              {book.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={book.cover_url} alt={`${book.title} cover`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">📚</div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1">
            <h1 className="font-serif text-3xl font-bold leading-tight">{book.title}</h1>

            {book.series_name && (
              <p className="text-slate text-sm mt-1">
                {book.series_name}
                {book.series_number ? ` · Book ${book.series_number}` : ''}
              </p>
            )}

            <Link
              href={`/author/${encodeURIComponent(book.author)}`}
              className="text-bloom font-medium hover:underline mt-1 inline-block"
            >
              {book.author}
            </Link>

            {book.rating && (
              <p className="text-sm text-slate mt-2">
                ★ {book.rating.toFixed(1)}
                {book.rating_count ? ` · ${book.rating_count.toLocaleString()} ratings` : ''}
                {book.rating_source ? ` · via ${book.rating_source}` : ''}
              </p>
            )}

            {/* Tropes */}
            {book.tropes?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {book.tropes.map(t => (
                  <Link key={t} href={`/search?tropes=${encodeURIComponent(t)}`} className="chip text-xs">
                    {t}
                  </Link>
                ))}
              </div>
            )}

            {/* Buy buttons */}
            <BuyButtons book={book} />

            {/* Description */}
            {book.description && (
              <div className="mt-6 prose prose-sm max-w-none text-ink/80 leading-relaxed">
                {book.description}
              </div>
            )}
          </div>
        </div>

        {/* Series nav */}
        {seriesBooks.length > 0 && (
          <section className="mt-14">
            <h2 className="font-serif text-xl font-semibold mb-4">
              More in {book.series_name}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-4">
              {seriesBooks.map(b => (
                <Link key={b.id} href={`/books/${b.slug}`} className="group text-center">
                  <div className="relative aspect-[2/3] rounded overflow-hidden bg-gray-100 mb-1">
                    {b.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-2xl">📚</div>
                    )}
                  </div>
                  <p className="text-xs text-slate">Book {b.series_number}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* More by author */}
        {moreByAuthor.length > 0 && (
          <section className="mt-14">
            <h2 className="font-serif text-xl font-semibold mb-4">
              More by {book.author}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-4">
              {moreByAuthor.map(b => (
                <Link key={b.id} href={`/books/${b.slug}`} className="group">
                  <div className="relative aspect-[2/3] rounded overflow-hidden bg-gray-100 mb-1">
                    {b.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-2xl">📚</div>
                    )}
                  </div>
                  <p className="text-xs font-medium line-clamp-2">{b.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}

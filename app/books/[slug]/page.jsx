import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBookBySlug, getSeriesBooks, getMoreByAuthor } from '@/lib/search'
import { slugify } from '@/lib/utils'
import { createSupabaseServer } from '@/lib/supabase'
import TbrButton from '@/components/TbrButton'
import ShelfButton from '@/components/ShelfButton'
import ShelfStatusSelect from '@/components/ShelfStatusSelect'

export const revalidate = 3600

export async function generateMetadata({ params }) {
  const book = await getBookBySlug(params.slug)
  if (!book) return {}
  const description = book.description?.slice(0, 155) || `Find ${book.title} on TropeQuest.`
  return {
    title: `${book.title} by ${book.author}`,
    description,
    alternates: { canonical: `/books/${book.slug}` },
    openGraph: {
      title: `${book.title} by ${book.author}`,
      description,
      url: `/books/${book.slug}`,
      images: book.cover_url ? [{ url: book.cover_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${book.title} by ${book.author}`,
      description,
      images: book.cover_url ? [book.cover_url] : [],
    },
  }
}

export default async function BookPage({ params }) {
  const book = await getBookBySlug(params.slug)
  if (!book) notFound()

  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  let isSaved = false
  let shelfStatus = null
  if (user) {
    const [tbrRes, shelfRes] = await Promise.all([
      supabase.from('tbr').select('id').eq('user_id', user.id).eq('book_id', book.id).single(),
      supabase.from('shelf').select('status').eq('user_id', user.id).eq('book_id', book.id).single(),
    ])
    isSaved = !!tbrRes.data
    shelfStatus = shelfRes.data?.status ?? null
  }

  const [seriesBooks, moreByAuthor] = await Promise.all([
    book.series_name ? getSeriesBooks(book.series_name, book.id) : [],
    getMoreByAuthor(book.author, book.id),
  ])

  // Fetch shelf status for all books shown in the two sections
  let sectionShelfMap = {}
  if (user && (seriesBooks.length || moreByAuthor.length)) {
    const sectionIds = [...seriesBooks, ...moreByAuthor].map(b => b.id)
    const { data: sectionShelf } = await supabase
      .from('shelf')
      .select('book_id, status')
      .eq('user_id', user.id)
      .in('book_id', sectionIds)
    for (const r of sectionShelf ?? []) sectionShelfMap[r.book_id] = r.status
  }

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
                  <Link key={t} href={`/tropes/${slugify(t)}`} className="chip text-xs">
                    {t}
                  </Link>
                ))}
              </div>
            )}

            {/* Buy Now + TBR + Shelf */}
            <div className="flex items-center gap-3 mt-5 flex-wrap">
              {book.buy_url_amazon_in && (
                <a
                  href={book.buy_url_amazon_in}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-2.5 bg-bloom text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Buy Now
                </a>
              )}
              <TbrButton bookId={book.id} initialSaved={isSaved} />
              <div className="flex items-center gap-2">
                <ShelfButton bookId={book.id} initialStatus={shelfStatus} />
                {shelfStatus && (
                  <ShelfStatusSelect bookId={book.id} currentStatus={shelfStatus} />
                )}
              </div>
            </div>

            {/* Description */}
            {book.description && (
              <div className="mt-6 text-sm text-ink/80 leading-relaxed space-y-3">
                {book.description
                  .replace(/\*\*\*(.*?)\*\*\*/gs, '$1')
                  .replace(/\*\*(.*?)\*\*/gs, '$1')
                  .replace(/\*(.*?)\*/gs, '$1')
                  .replace(/_(.*?)_/gs, '$1')
                  .split(/\n+/)
                  .filter(p => p.trim())
                  .map((para, i) => <p key={i}>{para.trim()}</p>)
                }
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
              {seriesBooks.map(b => {
                const status = sectionShelfMap[b.id] ?? null
                return (
                  <Link key={b.id} href={`/books/${b.slug}`} className="group text-center">
                    <div className="relative aspect-[2/3] rounded overflow-hidden bg-gray-100 mb-1">
                      {b.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl">📚</div>
                      )}
                      {status === 'read' && (
                        <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-xs font-semibold text-center py-0.5">✓ Read</div>
                      )}
                      {(status === 'reading' || status === 'unread') && (
                        <div className="absolute bottom-0 left-0 right-0 bg-petal/90 text-plum text-xs font-semibold text-center py-0.5">On Shelf</div>
                      )}
                    </div>
                    <p className="text-xs text-slate">Book {b.series_number}</p>
                  </Link>
                )
              })}
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
              {moreByAuthor.map(b => {
                const status = sectionShelfMap[b.id] ?? null
                return (
                  <Link key={b.id} href={`/books/${b.slug}`} className="group">
                    <div className="relative aspect-[2/3] rounded overflow-hidden bg-gray-100 mb-1">
                      {b.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl">📚</div>
                      )}
                      {status === 'read' && (
                        <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-xs font-semibold text-center py-0.5">✓ Read</div>
                      )}
                      {(status === 'reading' || status === 'unread') && (
                        <div className="absolute bottom-0 left-0 right-0 bg-petal/90 text-plum text-xs font-semibold text-center py-0.5">On Shelf</div>
                      )}
                    </div>
                    <p className="text-xs font-medium line-clamp-2">{b.title}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </>
  )
}

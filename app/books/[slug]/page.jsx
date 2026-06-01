import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getBookBySlug, getSeriesBooks, getMoreByAuthor, getSimilarBooks } from '@/lib/search'
import { getPostsFeaturingBook } from '@/lib/blog'
import { slugify, toTitleCase, formatAuthorName } from '@/lib/utils'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase'
import TbrButton from '@/components/TbrButton'
import DescriptionExpander from '@/components/DescriptionExpander'
import ShelfControls from '@/components/ShelfControls'
import StarRating from '@/components/StarRating'
import Breadcrumb from '@/components/Breadcrumb'
import FeaturePromo from '@/components/FeaturePromo'
import BookViewTracker from '@/components/BookViewTracker'
import RecLink from '@/components/RecLink'
import BuyButtons from '@/components/BuyButtons'
import ShareButton from '@/components/ShareButton'

export const revalidate = 3600

const WEB_FICTION_KEYS = ['buy_url_wattpad', 'buy_url_stck', 'buy_url_royal_road']
const STORE_KEYS = ['buy_url_amazon_in', 'buy_url_amazon_us', 'buy_url_flipkart', 'buy_url_abebooks']

function isWebFictionOnly(book) {
  return !STORE_KEYS.some(k => book[k]) && WEB_FICTION_KEYS.some(k => book[k])
}

function splitAuthors(author) {
  return author.split(/\s+and\s+/i).map(a => a.trim()).filter(Boolean)
}

function AuthorLinks({ author, className }) {
  const authors = splitAuthors(author)
  return (
    <>
      {authors.map((a, i) => (
        <span key={a}>
          {i > 0 && <span className="text-slate"> & </span>}
          <Link href={`/author/${encodeURIComponent(a)}`} className={className}>
            {formatAuthorName(a)}
          </Link>
        </span>
      ))}
    </>
  )
}

export async function generateMetadata({ params }) {
  const book = await getBookBySlug(params.slug)
  if (!book) return {}
  const baseDesc = book.description?.trim()
  const description = baseDesc
    ? `${book.title} by ${book.author} — ${baseDesc}`.slice(0, 160)
    : `${book.title} by ${book.author} — Find tropes, ratings, and more on TropeQuest.`
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
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  let isSaved = false
  let shelfStatus = null
  let userRating = null
  if (user) {
    const [tbrRes, shelfRes, ratingRes] = await Promise.all([
      supabase.from('tbr').select('id').eq('user_id', user.id).eq('book_id', book.id).single(),
      supabase.from('shelf').select('status').eq('user_id', user.id).eq('book_id', book.id).single(),
      supabase.from('ratings').select('rating').eq('user_id', user.id).eq('book_id', book.id).single(),
    ])
    isSaved = !!tbrRes.data
    shelfStatus = shelfRes.data?.status ?? null
    userRating = ratingRes.data?.rating ?? null
  }

  // Community ratings for this book (all users — needs public SELECT policy)
  const { data: communityRatings } = await supabase
    .from('ratings')
    .select('rating')
    .eq('book_id', book.id)
  const tqCount = communityRatings?.length ?? 0
  const tqSum = communityRatings?.reduce((s, r) => s + r.rating, 0) ?? 0
  const grCount = book.rating_count ?? 0
  const grSum = book.rating ? book.rating * grCount : 0
  const totalRatingCount = tqCount + grCount
  const blendedRating = totalRatingCount > 0 ? (tqSum + grSum) / totalRatingCount : null

  const featuredInPosts = getPostsFeaturingBook(params.slug)

  const [seriesBooks, moreByAuthor, readersAlsoEnjoyed, authorBioRow] = await Promise.all([
    book.series_name ? getSeriesBooks(book.series_name, book.id) : [],
    getMoreByAuthor(book.author, book.id, book.series_name ?? null),
    getSimilarBooks({ tropes: book.tropes ?? [], genres: book.genres ?? [], storyTags: book.story_tags ?? [], excludeId: book.id, limit: 8 }),
    supabaseAdmin.from('author_bios').select('bio').eq('author_name', book.author).maybeSingle(),
  ])
  const authorBio = authorBioRow.data?.bio ?? null
  const authorIntro = authorBio?.intro
    ? authorBio.intro.length > 220
      ? authorBio.intro.slice(0, 220).replace(/\s+\S*$/, '') + '…'
      : authorBio.intro
    : null

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
    aggregateRating: blendedRating
      ? { '@type': 'AggregateRating', ratingValue: blendedRating.toFixed(1), reviewCount: totalRatingCount || 1 }
      : undefined,
  }

  return (
    <>
      <BookViewTracker bookId={book.id} slug={book.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Browse', href: '/search' },
          { label: book.title },
        ]} />
        <div className="flex flex-col sm:flex-row gap-10">
          {/* Cover */}
          <div className="shrink-0 mx-auto sm:mx-0">
            <div className="w-44 aspect-[2/3] rounded-lg overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.25)] bg-gray-100 relative">
              {book.cover_url ? (
                <Image
                  src={book.cover_url}
                  alt={`${book.title} cover`}
                  fill
                  sizes="176px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">📚</div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-serif text-3xl font-bold leading-tight">{book.title}</h1>
              <ShareButton url={`https://tropequest.com/books/${book.slug}`} title={`${book.title} by ${book.author}`} className="shrink-0 mt-1" />
            </div>

            {book.series_name && (
              <p className="text-slate text-sm mt-1">
                <Link href={`/series/${slugify(book.series_name)}`} className="hover:text-bloom hover:underline transition-colors">
                  {book.series_name}
                </Link>
                {book.series_number ? ` · Book ${book.series_number}` : ''}
              </p>
            )}

            <p className="text-bloom font-medium mt-1">
              <AuthorLinks author={book.author} className="hover:underline" />
            </p>

            {(blendedRating || book.spice_rating) && (
              <p className="text-sm text-slate mt-2 flex items-center gap-3 flex-wrap">
                {blendedRating && (
                  <span>
                    ★ {blendedRating.toFixed(1)}
                    {totalRatingCount > 0 ? ` · ${totalRatingCount.toLocaleString()} ratings` : ''}
                  </span>
                )}
                {book.spice_rating && (
                  <span className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={i < book.spice_rating ? '' : 'opacity-20'}>🌶️</span>
                    ))}
                    <span className="text-xs ml-0.5">
                      {['', 'Tame', 'Mild', 'Steamy', 'Very Steamy', 'Explicit'][book.spice_rating]}
                    </span>
                  </span>
                )}
              </p>
            )}

            {/* All tags in one row */}
            {(book.genres?.length > 0 || book.tropes?.length > 0 || book.relationship_type?.length > 0 || book.story_tags?.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {book.genres?.map(g => (
                  <Link key={g} href={`/search?genres=${encodeURIComponent(g)}`} className="chip text-xs bg-petal/30">{toTitleCase(g)}</Link>
                ))}
                {book.tropes?.map(t => (
                  <Link key={t} href={`/tropes/${slugify(t)}`} className="chip text-xs">{toTitleCase(t)}</Link>
                ))}
                {book.relationship_type?.map(r => (
                  <Link key={r} href={`/search?relTypes=${encodeURIComponent(r)}`} className="chip text-xs bg-lavender/20">{toTitleCase(r)}</Link>
                ))}
                {book.story_tags?.map(s => (
                  <Link key={s} href={`/search?subjects=${encodeURIComponent(s)}`} className="chip text-xs bg-lavender/20">{toTitleCase(s)}</Link>
                ))}
              </div>
            )}

            {book.content_warnings?.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate/60 shrink-0">Content warnings:</span>
                {book.content_warnings.map(w => (
                  <span key={w} className="chip text-xs bg-slate/10 text-slate/70">{toTitleCase(w)}</span>
                ))}
              </div>
            )}

            {/* Platform badges */}
            {(book.is_kindle_unlimited || book.buy_url_audible) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {book.is_kindle_unlimited && (
                  <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    📱 Kindle Unlimited
                  </span>
                )}
                {book.buy_url_audible && (
                  <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                    🎧 Audible
                  </span>
                )}
              </div>
            )}

            {/* Adaptation badges */}
            {book.adaptations?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {book.adaptations.map((a, i) => (
                  a.watch_url ? (
                    <a
                      key={i}
                      href={a.watch_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors"
                    >
                      {a.type === 'series' ? '📺' : '🎬'} Watch {a.type === 'series' ? 'Series' : 'Movie'}{a.title ? `: ${a.title}` : ''}{a.year ? ` (${a.year})` : ''}
                    </a>
                  ) : (
                    <span
                      key={i}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200"
                    >
                      {a.type === 'series' ? '📺' : '🎬'} {a.type === 'series' ? 'Series' : 'Movie'}{a.title ? `: ${a.title}` : ''}{a.year ? ` (${a.year})` : ''}
                    </span>
                  )
                ))}
              </div>
            )}

            {/* User rating */}
            <div className="mt-4">
              <StarRating bookId={book.id} initialRating={userRating} />
            </div>

            {/* Buy Now + TBR + Shelf */}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <BuyButtons book={book} />
              <TbrButton bookId={book.id} initialSaved={isSaved} />
              {!isWebFictionOnly(book) && <ShelfControls bookId={book.id} initialStatus={shelfStatus} />}
            </div>

            {/* Description */}
            {book.description && (
              <DescriptionExpander paragraphs={
                book.description
                  .replace(/\*\*\*(.*?)\*\*\*/gs, '$1')
                  .replace(/\*\*(.*?)\*\*/gs, '$1')
                  .replace(/\*(.*?)\*/gs, '$1')
                  .replace(/_(.*?)_/gs, '$1')
                  .split(/\n\n+/)
                  .filter(p => p.trim())
                  .map(p => p.trim())
              } />
            )}

            {/* About the Author */}
            {authorIntro && (
              <div className="mt-6 border-t border-gray-100 pt-5">
                <p className="text-xs font-semibold text-slate uppercase tracking-wide mb-2">About the Author</p>
                <p className="text-sm text-ink/80 leading-relaxed">{authorIntro}</p>
                <p className="mt-2 text-xs font-medium text-bloom">
                  More about <AuthorLinks author={book.author} className="hover:underline" /> →
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Series nav */}
        {seriesBooks.length > 0 && (
          <section className="mt-14">
            <h2 className="font-serif text-xl font-semibold mb-4">
              More in{' '}
              <Link href={`/series/${slugify(book.series_name)}`} className="text-bloom transition-colors">
                {book.series_name}
              </Link>
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-4">
              {seriesBooks.map(b => {
                const status = sectionShelfMap[b.id] ?? null
                return (
                  <RecLink key={b.id} href={`/books/${b.slug}`} section="more_in_series" bookId={b.id} className="group text-center">
                    <div className="relative aspect-[2/3] rounded overflow-hidden bg-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.15)] mb-1">
                      {b.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl">📚</div>
                      )}
                      {b.series_number && (
                        <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">#{b.series_number}</div>
                      )}
                      {status === 'read' && (
                        <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-xs font-semibold text-center py-0.5">✓ Read</div>
                      )}
                      {(status === 'reading' || status === 'unread') && (
                        <div className="absolute bottom-0 left-0 right-0 bg-petal/90 text-plum text-xs font-semibold text-center py-0.5">On Shelf</div>
                      )}
                    </div>
                    <p className="text-xs font-medium line-clamp-2">{b.title}</p>
                  </RecLink>
                )
              })}
            </div>
          </section>
        )}

        {/* Readers also enjoyed */}
        {readersAlsoEnjoyed.length > 0 && (
          <section className="mt-14">
            <h2 className="font-serif text-xl font-semibold mb-4">Readers also enjoyed</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-4">
              {readersAlsoEnjoyed.map(b => (
                <RecLink key={b.id} href={`/books/${b.slug}`} section="readers_also_enjoyed" bookId={b.id} className="group">
                  <div className="relative aspect-[2/3] rounded overflow-hidden bg-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.15)] mb-1">
                    {b.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-2xl">📚</div>
                    )}
                  </div>
                  <p className="text-xs font-medium line-clamp-2">{b.title}</p>
                  <p className="text-xs text-slate line-clamp-1">{b.author}</p>
                </RecLink>
              ))}
            </div>
          </section>
        )}

        {/* More by author */}
        {moreByAuthor.length > 0 && (() => {
          // Group: series buckets (ordered by min series_number) + standalone
          const seriesMap = {}
          const standalone = []
          for (const b of moreByAuthor) {
            if (b.series_name) {
              if (!seriesMap[b.series_name]) seriesMap[b.series_name] = []
              seriesMap[b.series_name].push(b)
            } else {
              standalone.push(b)
            }
          }
          // Sort each series by series_number
          for (const key of Object.keys(seriesMap)) {
            seriesMap[key].sort((a, b) => (a.series_number ?? 999) - (b.series_number ?? 999))
          }
          const seriesGroups = Object.entries(seriesMap)
          const hasSeries = seriesGroups.length > 0

          const AuthorBookCard = ({ b }) => {
            const status = sectionShelfMap[b.id] ?? null
            return (
              <RecLink href={`/books/${b.slug}`} section="more_by_author" bookId={b.id} className="group">
                <div className="relative aspect-[2/3] rounded overflow-hidden bg-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.15)] mb-1">
                  {b.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">📚</div>
                  )}
                  {b.series_number && (
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">#{b.series_number}</div>
                  )}
                  {status === 'read' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-xs font-semibold text-center py-0.5">✓ Read</div>
                  )}
                  {(status === 'reading' || status === 'unread') && (
                    <div className="absolute bottom-0 left-0 right-0 bg-petal/90 text-plum text-xs font-semibold text-center py-0.5">On Shelf</div>
                  )}
                </div>
                <p className="text-xs font-medium line-clamp-2">{b.title}</p>
              </RecLink>
            )
          }

          return (
            <section className="mt-14">
              <h2 className="font-serif text-xl font-semibold mb-4">
                More by{' '}
                <AuthorLinks author={book.author} className="text-bloom transition-colors hover:underline" />
              </h2>

              {hasSeries ? (
                <div className="flex flex-col gap-8">
                  {seriesGroups.map(([seriesName, books]) => (
                    <div key={seriesName}>
                      <p className="text-sm font-semibold text-slate mb-3">
                        <Link href={`/series/${slugify(seriesName)}`} className="text-bloom transition-colors">
                          {seriesName}
                        </Link>
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-4">
                        {books.map(b => <AuthorBookCard key={b.id} b={b} />)}
                      </div>
                    </div>
                  ))}
                  {standalone.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate mb-3">Standalone</p>
                      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-4">
                        {standalone.map(b => <AuthorBookCard key={b.id} b={b} />)}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-4">
                  {moreByAuthor.map(b => <AuthorBookCard key={b.id} b={b} />)}
                </div>
              )}
            </section>
          )
        })()}
        {/* Featured in blog posts */}
        {featuredInPosts.length > 0 && (
          <section className="mt-14">
            <h2 className="font-serif text-xl font-semibold mb-4">This book is featured in</h2>
            <div className="flex flex-col gap-3">
              {featuredInPosts.map(post => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex items-center justify-between p-4 rounded-lg border border-petal/40 hover:border-bloom/40 hover:bg-petal/10 transition-colors no-underline"
                >
                  <div>
                    <p className="font-medium text-sm text-ink group-hover:text-bloom leading-snug">{post.title}</p>
                    {post.readingTime && (
                      <p className="text-xs text-slate/50 mt-0.5">{post.readingTime} min read</p>
                    )}
                  </div>
                  <span className="text-bloom text-sm shrink-0 ml-4">Read →</span>
                </Link>
              ))}
            </div>
          </section>
        )}
        <FeaturePromo />
      </div>
    </>
  )
}

import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Breadcrumb from '@/components/Breadcrumb'
import { getAllSeries, getBooksBySeries, getSeriesBio } from '@/lib/search'
import { slugify } from '@/lib/utils'

export const revalidate = 3600

export async function generateMetadata({ params }) {
  const series = await getAllSeries()
  const match  = series.find(s => slugify(s.series_name) === params.slug)
  if (!match) return {}
  const { series_name, author } = match
  const title       = `${series_name} Series Reading Order by ${author}`
  const description = `The complete ${series_name} reading order by ${author}. All books in the series listed in order with ratings, tropes, and summaries.`
  return {
    title,
    description,
    alternates: { canonical: `/series/${params.slug}` },
    openGraph: { title: `${title} | TropeQuest`, description, url: `/series/${params.slug}` },
    twitter:   { card: 'summary_large_image', title: `${title} | TropeQuest`, description },
  }
}

export default async function SeriesDetailPage({ params }) {
  const allSeries = await getAllSeries()
  const match     = allSeries.find(s => slugify(s.series_name) === params.slug)
  if (!match) notFound()

  const [books, bio] = await Promise.all([
    getBooksBySeries(match.series_name),
    getSeriesBio(match.series_name),
  ])
  if (!books.length) notFound()

  // Merge bio reading_order entries with DB books by series_number
  const bioByNumber = {}
  for (const entry of bio?.reading_order ?? []) {
    bioByNumber[entry.number] = entry
  }

  // Common tropes across series (top 6)
  const tropeCount = {}
  for (const b of books) {
    for (const t of b.tropes ?? []) tropeCount[t] = (tropeCount[t] ?? 0) + 1
  }
  const commonTropes = Object.entries(tropeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([t]) => t)

  // JSON-LD
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
      ...(b.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: b.rating, ratingCount: b.rating_count ?? 1, bestRating: 5 } } : {}),
    })),
  }

  const hasBioData = bio && (bio.intro || bio.what_to_expect?.length || bio.reading_tip)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Series', href: '/series' },
          { label: match.series_name },
        ]} />

        {/* Header */}
        <h1 className="font-serif text-3xl font-bold mb-1">{match.series_name}</h1>
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/author/${encodeURIComponent(match.author)}`} className="text-bloom font-medium hover:underline text-sm">
            {match.author}
          </Link>
          <span className="text-slate/40 text-sm">·</span>
          <span className="text-slate text-sm">{books.length} {books.length === 1 ? 'book' : 'books'}</span>
        </div>

        {/* Common tropes */}
        {commonTropes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {commonTropes.map(t => (
              <Link key={t} href={`/tropes/${slugify(t)}`} className="chip text-xs">{t}</Link>
            ))}
          </div>
        )}

        {/* Intro */}
        {bio?.intro && (
          <p className="text-sm text-slate leading-relaxed mb-10">{bio.intro}</p>
        )}

        {/* Reading Order */}
        <h2 className="font-serif text-xl font-semibold mb-2">Recommended Reading Order</h2>
        {bio?.reading_order_note && (
          <p className="text-sm text-slate mb-4">{bio.reading_order_note}</p>
        )}

        {/* Table header — only when bio has format/focus data */}
        {hasBioData && bio?.reading_order?.length > 0 && (
          <div className="hidden sm:grid grid-cols-[2rem_1fr_6rem_1fr] gap-x-4 px-3 py-2 mb-1 border-b border-gray-100">
            <span className="text-xs font-semibold text-slate/50">#</span>
            <span className="text-xs font-semibold text-slate/50">Title</span>
            <span className="text-xs font-semibold text-slate/50">Format</span>
            <span className="text-xs font-semibold text-slate/50">Focus</span>
          </div>
        )}

        <ol className="space-y-3 mb-10">
          {books.map((b, i) => {
            const entry = b.series_number != null ? bioByNumber[b.series_number] : null
            const num   = b.series_number != null ? `#${b.series_number}` : `${i + 1}`
            const hasFormatFocus = entry?.format || entry?.focus

            return (
              <li key={b.id}>
                {/* Mobile: stacked */}
                <div className="sm:hidden">
                  <Link href={`/books/${b.slug}`} className="group flex gap-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-3">
                    <span className="text-sm font-bold text-bloom/70 w-6 shrink-0 pt-0.5">{num}</span>
                    <div className="relative shrink-0 w-16 h-24 rounded overflow-hidden bg-gray-100">
                      {b.cover_url
                        ? <Image src={b.cover_url} alt={b.title} fill sizes="64px" className="object-contain" />
                        : <div className="w-full h-full flex items-center justify-center text-lg">📚</div>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-serif font-semibold text-sm leading-tight group-hover:text-bloom transition-colors line-clamp-2">{b.title}</p>
                      {b.rating && <p className="text-xs text-bloom font-medium mt-0.5">★ {b.rating.toFixed(1)}</p>}
                      {entry?.format && <span className="inline-block mt-1 text-xs bg-petal/20 text-bloom/80 rounded px-1.5 py-0.5">{entry.format}</span>}
                      {entry?.focus && <p className="text-xs text-slate mt-1">{entry.focus}</p>}
                      {!hasFormatFocus && b.description && (
                        <p className="text-xs text-slate/70 mt-1 line-clamp-2">{b.description}</p>
                      )}
                      {!hasFormatFocus && !b.description && b.tropes?.length > 0 && (
                        <p className="text-xs text-slate/60 mt-1 line-clamp-1">{b.tropes.slice(0, 3).join(' · ')}</p>
                      )}
                    </div>
                  </Link>
                </div>

                {/* Desktop: table row with format/focus OR simple row with description */}
                {hasBioData ? (
                  <div className="hidden sm:grid grid-cols-[2rem_1fr_6rem_1fr] gap-x-4 items-center bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow px-3 py-2">
                    <span className="text-sm font-bold text-bloom/70">{num}</span>
                    <Link href={`/books/${b.slug}`} className="group flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0 w-14 h-20 rounded overflow-hidden bg-gray-100">
                        {b.cover_url
                          ? <Image src={b.cover_url} alt={b.title} fill sizes="56px" className="object-contain" />
                          : <div className="w-full h-full flex items-center justify-center text-base">📚</div>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="font-serif font-semibold text-sm leading-tight group-hover:text-bloom transition-colors line-clamp-2">{b.title}</p>
                        {b.rating && <p className="text-xs text-bloom font-medium mt-0.5">★ {b.rating.toFixed(1)}</p>}
                      </div>
                    </Link>
                    <div>
                      {entry?.format
                        ? <span className="text-xs bg-petal/20 text-bloom/80 rounded px-2 py-0.5">{entry.format}</span>
                        : <span className="text-xs text-slate/30">—</span>
                      }
                    </div>
                    <p className="text-sm text-slate leading-snug">{entry?.focus ?? '—'}</p>
                  </div>
                ) : (
                  <Link href={`/books/${b.slug}`} className="hidden sm:flex group items-center gap-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow px-4 py-3">
                    <span className="text-sm font-bold text-bloom/70 w-6 shrink-0">{num}</span>
                    <div className="relative shrink-0 w-14 h-20 rounded overflow-hidden bg-gray-100">
                      {b.cover_url
                        ? <Image src={b.cover_url} alt={b.title} fill sizes="56px" className="object-contain" />
                        : <div className="w-full h-full flex items-center justify-center text-base">📚</div>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif font-semibold text-sm leading-tight group-hover:text-bloom transition-colors line-clamp-1">{b.title}</p>
                      {b.rating && <p className="text-xs text-bloom font-medium mt-0.5">★ {b.rating.toFixed(1)}</p>}
                      {b.description && (
                        <p className="text-xs text-slate/70 mt-1 line-clamp-2">{b.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-bloom shrink-0 font-medium">See more →</span>
                  </Link>
                )}
              </li>
            )
          })}
        </ol>

        {/* What to Expect */}
        {bio?.what_to_expect?.length > 0 && (
          <section className="mb-8">
            <h2 className="font-serif text-xl font-semibold mb-4">What to Expect</h2>
            <div className="space-y-3">
              {bio.what_to_expect.map((item, i) => (
                <div key={i}>
                  {item.label && (
                    <p className="text-sm font-semibold text-ink mb-1">{item.label}</p>
                  )}
                  <p className="text-sm text-slate leading-relaxed whitespace-pre-wrap">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reading Tip */}
        {bio?.reading_tip && (
          <div className="border-l-2 border-bloom/40 pl-4 mb-10">
            <p className="text-xs font-semibold text-bloom mb-1">Reading Tip</p>
            <p className="text-sm text-slate leading-relaxed">{bio.reading_tip}</p>
          </div>
        )}

        {/* Footer CTA */}
        <p className="mt-4 text-sm text-slate">
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

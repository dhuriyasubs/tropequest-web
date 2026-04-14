import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Breadcrumb from '@/components/Breadcrumb'
import AuthorBio from '@/components/AuthorBio'
import { getBooksByAuthor, getAuthorBio } from '@/lib/search'
import { slugify } from '@/lib/utils'

export const revalidate = 3600

function BookListRow({ book }) {
  return (
    <Link href={`/books/${book.slug}`}
      className="flex gap-4 py-3 hover:bg-petal/5 transition-colors rounded-lg px-2 -mx-2">
      <div className="relative w-12 shrink-0 aspect-[2/3] bg-gray-100 rounded overflow-hidden">
        {book.cover_url
          ? <Image src={book.cover_url} alt={book.title} fill sizes="48px" className="object-contain" />
          : <span className="absolute inset-0 flex items-center justify-center text-xl">📚</span>
        }
      </div>
      <div className="flex flex-col justify-center gap-1 min-w-0">
        <p className="font-serif font-semibold text-sm leading-tight line-clamp-2">{book.title}</p>
        {book.series_name && (
          <p className="text-xs text-slate">
            {book.series_name}{book.series_number ? ` #${book.series_number}` : ''}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
          {book.rating && <span className="text-xs text-bloom font-medium">★ {book.rating.toFixed(1)}</span>}
          {book.tropes?.slice(0, 3).map(t => (
            <span key={t} className="text-xs text-slate/70">{t}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}

export async function generateMetadata({ params }) {
  const author = decodeURIComponent(params.slug)
  const books = await getBooksByAuthor(author)
  const description = `Browse all books by ${author} on TropeQuest: series, standalones, ratings, and tropes.`
  return {
    title: `Books by ${author}`,
    description,
    alternates: { canonical: `/author/${encodeURIComponent(author)}` },
    robots: books.length < 2 ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `Books by ${author} | TropeQuest`,
      description,
      url: `/author/${encodeURIComponent(author)}`,
    },
    twitter: {
      card: 'summary',
      title: `Books by ${author} | TropeQuest`,
      description,
    },
  }
}

// Author-specific series display order (series names must match DB exactly)
const AUTHOR_SERIES_ORDER = {
  'Catharina Maura': ['Stolen Moments', 'Serendipity', 'Off-Limits', 'The Windsors'],
}

function sortedSeries(author, seriesMap) {
  const order = AUTHOR_SERIES_ORDER[author]
  if (!order) return Object.keys(seriesMap)
  const known = order.filter(s => seriesMap[s])
  const rest  = Object.keys(seriesMap).filter(s => !order.includes(s))
  return [...known, ...rest]
}

export default async function AuthorPage({ params }) {
  const author = decodeURIComponent(params.slug)
  const [books, bio] = await Promise.all([
    getBooksByAuthor(author),
    getAuthorBio(author),
  ])
  if (books.length === 0) notFound()

  // Group by series
  const seriesMap = {}
  const standalone = []
  for (const b of books) {
    if (b.series_name) {
      seriesMap[b.series_name] = seriesMap[b.series_name] || []
      seriesMap[b.series_name].push(b)
    } else {
      standalone.push(b)
    }
  }

  const orderedSeries = sortedSeries(author, seriesMap)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Breadcrumb crumbs={[
        { label: 'Home', href: '/' },
        { label: 'Authors', href: '/author' },
        { label: author },
      ]} />

      <h1 className="font-serif text-3xl font-bold mb-1">{author}</h1>
      <p className="text-slate mb-8">{books.length} books on TropeQuest</p>
      <AuthorBio bio={bio} />

      {orderedSeries.map(series => (
        <section key={series} className="mb-10">
          <h2 className="font-serif text-xl font-semibold mb-3">
            <Link href={`/series/${slugify(series)}`} className="hover:text-bloom transition-colors">{series}</Link>
          </h2>
          <div className="divide-y divide-gray-100">
            {seriesMap[series]
              .sort((a, b) => (a.series_number || 0) - (b.series_number || 0))
              .map(b => <BookListRow key={b.id} book={b} />)}
          </div>
        </section>
      ))}

      {standalone.length > 0 && (
        <section className="mb-10">
          <h2 className="font-serif text-xl font-semibold mb-3">Standalone</h2>
          <div className="divide-y divide-gray-100">
            {standalone.map(b => <BookListRow key={b.id} book={b} />)}
          </div>
        </section>
      )}
    </div>
  )
}

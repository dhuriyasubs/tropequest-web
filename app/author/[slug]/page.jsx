import { notFound } from 'next/navigation'
import Link from 'next/link'
import BookCard from '@/components/BookCard'
import Breadcrumb from '@/components/Breadcrumb'
import AuthorBio from '@/components/AuthorBio'
import { getBooksByAuthor, getAuthorBio } from '@/lib/search'

export const revalidate = 3600

export async function generateMetadata({ params }) {
  const author = decodeURIComponent(params.slug)
  const description = `Browse all books by ${author} on TropeQuest: series, standalones, ratings, and tropes.`
  return {
    title: `Books by ${author}`,
    description,
    alternates: { canonical: `/author/${params.slug}` },
    openGraph: {
      title: `Books by ${author} | TropeQuest`,
      description,
      url: `/author/${params.slug}`,
    },
    twitter: {
      card: 'summary',
      title: `Books by ${author} | TropeQuest`,
      description,
    },
  }
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

      {Object.entries(seriesMap).map(([series, seriesBooks]) => (
        <section key={series} className="mb-12">
          <h2 className="font-serif text-xl font-semibold mb-4">{series}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {seriesBooks
              .sort((a, b) => (a.series_number || 0) - (b.series_number || 0))
              .map(b => <BookCard key={b.id} book={b} />)}
          </div>
        </section>
      ))}

      {standalone.length > 0 && (
        <section className="mb-12">
          <h2 className="font-serif text-xl font-semibold mb-4">Standalone</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {standalone.map(b => <BookCard key={b.id} book={b} />)}
          </div>
        </section>
      )}
    </div>
  )
}

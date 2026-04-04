import { notFound } from 'next/navigation'
import Link from 'next/link'
import BookCard from '@/components/BookCard'
import { getFilterOptions, getBooksByTrope } from '@/lib/search'
import { slugify } from '@/lib/utils'

export const revalidate = 3600

export async function generateMetadata({ params }) {
  const { tropes } = await getFilterOptions()
  const trope = tropes.find(t => slugify(t) === params.slug)
  if (!trope) return {}
  const description = `Find the best ${trope} books on TropeQuest — sorted by rating, with covers, series info, and buy links.`
  return {
    title: `${trope} Books`,
    description,
    alternates: { canonical: `/tropes/${params.slug}` },
    openGraph: {
      title: `${trope} Books | TropeQuest`,
      description,
      url: `/tropes/${params.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${trope} Books | TropeQuest`,
      description,
    },
  }
}

export default async function TropeDetailPage({ params }) {
  const { tropes } = await getFilterOptions()
  const trope = tropes.find(t => slugify(t) === params.slug)
  if (!trope) notFound()

  const books = await getBooksByTrope(trope)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link href="/tropes" className="text-sm text-bloom hover:underline mb-6 inline-block">
        ← All Tropes
      </Link>

      <h1 className="font-serif text-3xl font-bold mb-2">{trope}</h1>
      <p className="text-slate mb-10">{books.length} book{books.length !== 1 ? 's' : ''}</p>

      {books.length === 0 ? (
        <p className="text-slate">No books found for this trope yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {books.map(b => <BookCard key={b.id} book={b} />)}
        </div>
      )}
    </div>
  )
}

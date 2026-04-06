import { notFound } from 'next/navigation'
import Link from 'next/link'
import BookCard from '@/components/BookCard'
import Breadcrumb from '@/components/Breadcrumb'
import { getSimilarBooks } from '@/lib/search'
import { slugify } from '@/lib/utils'

export const revalidate = 3600

// ── Content map ────────────────────────────────────────────────────────────
const BOOKS_LIKE = {
  'fourth-wing': {
    title: 'Fourth Wing',
    author: 'Rebecca Yarros',
    bookId: 623,
    bookSlug: 'fourth-wing',
    tropes: ['Enemies to Lovers', 'Dragon Riders', 'Deadly Trials', 'Romantasy', 'Slow Burn'],
    description: 'If you loved Fourth Wing, you\'ll love these books — romantasy picks with enemies-to-lovers tension, dangerous magic, and slow-burn romance.',
    intro: 'Fourth Wing hooked readers with its rare combination: a high-stakes fantasy world built on dragon-riding warriors, and a slow-burn enemies-to-lovers romance that crackles from chapter one. If you finished it and immediately needed something to fill the void, you\'re in the right place.',
    what: 'You\'re probably looking for: a fantasy world with real rules and danger, a love interest who starts as an obstacle, slow-burn tension that pays off, and writing that moves fast. The books below hit at least two of those — most hit all four.',
    searchQuery: 'enemies to lovers romantasy',
    relatedTropes: ['Enemies to Lovers', 'Slow Burn', 'Romantasy', 'Dark Romance'],
  },
  'a-court-of-thorns-and-roses': {
    title: 'A Court of Thorns and Roses',
    author: 'Sarah J. Maas',
    bookId: 622,
    bookSlug: 'a-court-of-thorns-and-roses',
    tropes: ['Fae', 'Beauty and the Beast', 'Enemies to Lovers', 'Romantasy', 'Forbidden Love'],
    description: 'Books like A Court of Thorns and Roses — fae romance, Beauty and the Beast retellings, and romantasy with morally complex love interests.',
    intro: 'A Court of Thorns and Roses set the template for the modern romantasy boom: a mortal girl pulled into a dangerous fae world, a Beauty and the Beast retelling with teeth, and a love interest who is more threat than comfort — until he isn\'t. If ACOTAR is your benchmark, these picks will feel familiar in the best way.',
    what: 'The ACOTAR formula: lush world-building, a heroine who grows into her power, fae courts with politics and danger, and romance that is slow, complicated, and absolutely worth it. The books below share that DNA.',
    searchQuery: 'fae romance romantasy',
    relatedTropes: ['Fae', 'Enemies to Lovers', 'Romantasy', 'Forbidden Love'],
  },
  'colleen-hoover': {
    title: 'Colleen Hoover',
    author: null,
    bookId: null,
    bookSlug: null,
    tropes: ['Angst', 'Forbidden Love', 'Second Chance', 'Slow Burn', 'Friends to Lovers', 'Forced Proximity'],
    description: 'Books like Colleen Hoover — emotional contemporary romance with angst, forbidden love, and the kind of endings that stay with you.',
    intro: 'Colleen Hoover built one of the most devoted readerships in romance by writing contemporary stories that feel emotionally raw and completely real. Her books are not comfortable reads — they deal with difficult relationships, moral complexity, and endings that leave readers genuinely shaken. If you\'ve burned through her backlist, here are the books most likely to hit the same nerve.',
    what: 'What makes a CoHo-style read: contemporary setting, deeply flawed characters who are hard to judge, relationships that feel complicated rather than idealistic, and emotional gut-punches that you didn\'t see coming. These picks deliver on that brief.',
    searchQuery: 'contemporary romance angst',
    relatedTropes: ['Angst', 'Second Chance', 'Forbidden Love', 'Friends to Lovers'],
  },
}

export function generateStaticParams() {
  return Object.keys(BOOKS_LIKE).map(slug => ({ slug }))
}

export async function generateMetadata({ params }) {
  const entry = BOOKS_LIKE[params.slug]
  if (!entry) return {}
  const title = entry.author
    ? `Books Like ${entry.title} by ${entry.author}`
    : `Books Like ${entry.title}`
  return {
    title,
    description: entry.description,
    alternates: { canonical: `/books-like/${params.slug}` },
    openGraph: {
      title: `${title} | TropeQuest`,
      description: entry.description,
      url: `/books-like/${params.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | TropeQuest`,
      description: entry.description,
    },
  }
}

export default async function BooksLikePage({ params }) {
  const entry = BOOKS_LIKE[params.slug]
  if (!entry) notFound()

  const books = await getSimilarBooks({
    tropes: entry.tropes,
    excludeId: entry.bookId,
    limit: 24,
  })

  const pageTitle = entry.author
    ? `Books Like ${entry.title} by ${entry.author}`
    : `Books Like ${entry.title}`

  const relatedSlugs = entry.relatedTropes.map(t => ({ name: t, slug: slugify(t) }))

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Breadcrumb crumbs={[
        { label: 'Home', href: '/' },
        { label: 'Browse', href: '/search' },
        { label: pageTitle },
      ]} />

      <h1 className="font-serif text-3xl font-bold mb-4">{pageTitle}</h1>

      <div className="max-w-2xl mb-8">
        <p className="text-ink/80 leading-relaxed mb-3">{entry.intro}</p>
        <p className="text-ink/70 text-sm leading-relaxed">{entry.what}</p>
      </div>

      {entry.bookSlug && (
        <p className="text-sm text-slate mb-2">
          Not sure? Start with{' '}
          <Link href={`/books/${entry.bookSlug}`} className="text-bloom hover:underline">
            {entry.title}
          </Link>{' '}
          itself — then come back here.
        </p>
      )}

      <p className="text-sm text-slate mb-8">{books.length} books found</p>

      {books.length === 0 ? (
        <p className="text-slate">No books found yet. Check back soon.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {books.map(b => <BookCard key={b.id} book={b} />)}
        </div>
      )}

      {/* CTA */}
      <div className="mt-14 p-6 rounded-xl bg-petal/20 border border-petal/40 text-center">
        <p className="font-serif text-lg font-semibold mb-2">Want a more personal recommendation?</p>
        <p className="text-sm text-slate mb-4">
          Pick any book you loved and TropeQuest will find others that share its exact tropes and mood.
        </p>
        <Link
          href="/because"
          className="inline-block px-6 py-2.5 bg-bloom text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          Try Because You Like →
        </Link>
      </div>

      {/* Related tropes */}
      <div className="mt-10">
        <h2 className="font-serif text-xl font-semibold mb-4">Browse by trope</h2>
        <div className="flex flex-wrap gap-2">
          {relatedSlugs.map(r => (
            <Link key={r.slug} href={`/tropes/${r.slug}`} className="chip text-sm">
              {r.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

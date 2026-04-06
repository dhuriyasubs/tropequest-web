import Link from 'next/link'
import { getAllAuthors } from '@/lib/search'

export const metadata = {
  title: 'Browse Authors',
  description: 'Explore all authors on TropeQuest: find books by your favourite romance, romantasy, and thriller writers.',
  alternates: { canonical: '/author' },
  openGraph: {
    title: 'Browse Authors | TropeQuest',
    description: 'Explore all authors on TropeQuest.',
    url: '/author',
  },
}

export const revalidate = 3600

export default async function AuthorsPage() {
  const authors = await getAllAuthors()
  const sorted  = [...authors].sort((a, b) => {
    const lastA = a.split(' ').at(-1)
    const lastB = b.split(' ').at(-1)
    return lastA.localeCompare(lastB)
  })

  // Group by first letter of last name
  const grouped = sorted.reduce((acc, a) => {
    const letter = a.split(' ').at(-1)[0].toUpperCase()
    acc[letter] = acc[letter] || []
    acc[letter].push(a)
    return acc
  }, {})

  const letters = Object.keys(grouped).sort()

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-2">Browse Authors</h1>
      <p className="text-slate mb-10">{authors.length} authors on TropeQuest</p>

      {letters.map(letter => (
        <section key={letter} className="mb-8">
          <h2 className="font-serif text-xl font-semibold mb-3 text-bloom">{letter}</h2>
          <div className="flex flex-wrap gap-2">
            {grouped[letter].map(a => (
              <Link
                key={a}
                href={`/author/${encodeURIComponent(a)}`}
                className="chip"
              >
                {a}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

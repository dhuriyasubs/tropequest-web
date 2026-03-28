import Link from 'next/link'
import { getFilterOptions } from '@/lib/search'

export const metadata = {
  title: 'Browse by Trope',
  description:
    'Explore all romance and thriller book tropes. Find books by Enemies to Lovers, ' +
    'Slow Burn, Dark Romance, Fake Dating and many more.',
}

export const revalidate = 3600

export default async function TropesPage() {
  const { tropes } = await getFilterOptions()

  // Group alphabetically
  const grouped = tropes.reduce((acc, t) => {
    const letter = t[0].toUpperCase()
    acc[letter] = acc[letter] || []
    acc[letter].push(t)
    return acc
  }, {})

  const letters = Object.keys(grouped).sort()

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-2">Browse by Trope</h1>
      <p className="text-slate mb-10">
        {tropes.length} tropes across romance, romantasy, and thriller.
      </p>

      {letters.map(letter => (
        <section key={letter} className="mb-8">
          <h2 className="font-serif text-xl font-semibold mb-3 text-bloom">{letter}</h2>
          <div className="flex flex-wrap gap-2">
            {grouped[letter].map(t => (
              <Link
                key={t}
                href={`/search?tropes=${encodeURIComponent(t)}`}
                className="chip"
              >
                {t}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

import Link from 'next/link'
import { getAllSeries } from '@/lib/search'
import { slugify } from '@/lib/utils'

export const metadata = {
  title: 'Browse Series',
  description: 'Explore all book series on TropeQuest — romance, romantasy, thriller, and more.',
  alternates: { canonical: '/series' },
  openGraph: {
    title: 'Browse Book Series | TropeQuest',
    description: 'Explore all book series on TropeQuest — romance, romantasy, thriller, and more.',
    url: '/series',
  },
  twitter: {
    card: 'summary',
    title: 'Browse Book Series | TropeQuest',
    description: 'Explore all book series on TropeQuest — romance, romantasy, thriller, and more.',
  },
}

export const revalidate = 3600

export default async function SeriesPage() {
  const series = await getAllSeries()

  // Group alphabetically
  const grouped = series.reduce((acc, s) => {
    const letter = s.series_name[0].toUpperCase()
    acc[letter] = acc[letter] || []
    acc[letter].push(s)
    return acc
  }, {})

  const letters = Object.keys(grouped).sort()

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-2">Browse Series</h1>
      <p className="text-slate mb-10">{series.length} series on TropeQuest</p>

      {letters.map(letter => (
        <section key={letter} className="mb-8">
          <h2 className="font-serif text-xl font-semibold mb-3 text-bloom">{letter}</h2>
          <div className="flex flex-col gap-1">
            {grouped[letter].map(s => (
              <Link
                key={s.series_name}
                href={`/series/${slugify(s.series_name)}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-petal/10 transition-colors group"
              >
                <div>
                  <span className="font-medium group-hover:text-bloom transition-colors">{s.series_name}</span>
                  <span className="text-sm text-slate ml-2">by {s.author}</span>
                </div>
                <span className="text-xs text-slate">{s.count} {s.count === 1 ? 'book' : 'books'}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

import { getAllSeries } from '@/lib/search'
import { slugify } from '@/lib/utils'
import SeriesList from '@/components/SeriesList'

export const metadata = {
  title: 'Book Series Reading Order: Romance, Fantasy & Thriller',
  description: 'Find the reading order for your favourite book series. Browse romance, romantasy, and thriller series with books listed in order on TropeQuest.',
  alternates: { canonical: '/series' },
  openGraph: {
    title: 'Book Series Reading Order | TropeQuest',
    description: 'Find the reading order for your favourite book series on TropeQuest.',
    url: '/series',
  },
  twitter: {
    card: 'summary',
    title: 'Book Series Reading Order | TropeQuest',
    description: 'Find the reading order for your favourite book series on TropeQuest.',
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
      <p className="text-slate mb-8">{series.length} series on TropeQuest</p>
      <SeriesList series={series} grouped={grouped} letters={letters} />
    </div>
  )
}

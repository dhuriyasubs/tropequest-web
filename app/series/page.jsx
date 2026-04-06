import { getAllSeries } from '@/lib/search'
import { slugify } from '@/lib/utils'
import SeriesList from '@/components/SeriesList'

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
      <p className="text-slate mb-8">{series.length} series on TropeQuest</p>
      <SeriesList series={series} grouped={grouped} letters={letters} />
    </div>
  )
}

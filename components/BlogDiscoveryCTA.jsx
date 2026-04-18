import Link from 'next/link'

const FALLBACK_TROPES = [
  'enemies to lovers', 'slow burn', 'arranged marriage',
  'second chances', 'forced proximity', 'fated mates',
]

export default function BlogDiscoveryCTA({ tropes, genres }) {
  const tropeChips = tropes?.length ? tropes : FALLBACK_TROPES
  const genreChips = genres?.length ? genres : []

  return (
    <div className="bg-petal/20 border border-petal/60 rounded-2xl px-6 py-7 my-10">
      <p className="font-serif text-xl font-bold text-ink mb-1">Find your next read</p>
      <p className="text-sm text-slate mb-5">
        Browse 2,000+ romance books — filter by trope, genre, spice level, and more.
      </p>

      {tropeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tropeChips.map(trope => (
            <Link key={trope}
              href={`/search?tropes=${encodeURIComponent(trope)}`}
              className="text-xs bg-white border border-petal text-bloom rounded-full px-3 py-1.5 hover:bg-bloom hover:text-white hover:border-bloom transition-colors">
              {trope}
            </Link>
          ))}
        </div>
      )}

      {genreChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {genreChips.map(genre => (
            <Link key={genre}
              href={`/search?genres=${encodeURIComponent(genre)}`}
              className="text-xs bg-white border border-gray-200 text-slate rounded-full px-3 py-1.5 hover:bg-gray-50 transition-colors">
              {genre}
            </Link>
          ))}
        </div>
      )}

      <Link href="/search"
        className="inline-block bg-bloom text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-bloom/90 transition-colors">
        Browse all books →
      </Link>
    </div>
  )
}

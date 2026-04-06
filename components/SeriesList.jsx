'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { slugify } from '@/lib/utils'

export default function SeriesList({ series, grouped, letters }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return { letters, grouped }
    const q = query.toLowerCase()
    const filteredGrouped = {}
    for (const letter of letters) {
      const hits = grouped[letter].filter(
        s => s.series_name.toLowerCase().includes(q) || s.author.toLowerCase().includes(q)
      )
      if (hits.length) filteredGrouped[letter] = hits
    }
    return { letters: Object.keys(filteredGrouped).sort(), grouped: filteredGrouped }
  }, [query, letters, grouped])

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-8">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search series or author…"
          className="w-full sm:max-w-sm border border-petal/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/30 focus:border-bloom"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate/50 hover:text-slate text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {filtered.letters.length === 0 && (
        <p className="text-slate text-sm">No series match &ldquo;{query}&rdquo;</p>
      )}

      {filtered.letters.map(letter => (
        <section key={letter} className="mb-8">
          <h2 className="font-serif text-xl font-semibold mb-3 text-bloom">{letter}</h2>
          <div className="flex flex-col gap-1">
            {filtered.grouped[letter].map(s => (
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
    </>
  )
}

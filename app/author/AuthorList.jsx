'use client'
import { useState } from 'react'
import Link from 'next/link'
import { formatAuthorName } from '@/lib/utils'

export default function AuthorList({ authors }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? authors.filter(a => a.toLowerCase().includes(query.toLowerCase()))
    : authors

  // Group filtered list by first letter
  const grouped = filtered.reduce((acc, a) => {
    const letter = a[0].toUpperCase()
    acc[letter] = acc[letter] || []
    acc[letter].push(a)
    return acc
  }, {})
  const letters = Object.keys(grouped).sort()

  return (
    <>
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search authors..."
        className="w-full sm:w-72 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40 mb-10"
      />

      {filtered.length === 0 && (
        <p className="text-slate text-sm">No authors match &quot;{query}&quot;</p>
      )}

      {letters.map(letter => (
        <section key={letter} className="mb-8">
          <h2 className="font-serif text-xl font-semibold mb-3 text-bloom">{letter}</h2>
          <div className="flex flex-wrap gap-2">
            {grouped[letter].map(a => (
              <Link key={a} href={`/author/${encodeURIComponent(a)}`} className="chip">
                {formatAuthorName(a)}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

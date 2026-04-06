'use client'

import { useState, useMemo } from 'react'
import BookCard from '@/components/BookCard'

export default function TropeBookList({ books }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return books
    const q = query.toLowerCase()
    return books.filter(b =>
      b.title?.toLowerCase().includes(q) ||
      b.author?.toLowerCase().includes(q) ||
      b.tropes?.some(t => t.toLowerCase().includes(q))
    )
  }, [query, books])

  return (
    <>
      <div className="relative mb-6">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filter books…"
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

      <p className="text-sm text-slate mb-6">
        {filtered.length} book{filtered.length !== 1 ? 's' : ''}
        {query.trim() ? ` matching "${query}"` : ''}
      </p>

      {filtered.length === 0 ? (
        <p className="text-slate">No books match &ldquo;{query}&rdquo;</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(b => <BookCard key={b.id} book={b} />)}
        </div>
      )}
    </>
  )
}

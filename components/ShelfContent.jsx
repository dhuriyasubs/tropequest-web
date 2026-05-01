'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import ShelfButton from '@/components/ShelfButton'
import ShelfStatusSelect from '@/components/ShelfStatusSelect'

const STATUSES = [
  { value: '',        label: 'All'     },
  { value: 'unread',  label: 'Unread'  },
  { value: 'reading', label: 'Reading' },
  { value: 'read',    label: 'Read'    },
]

const UNCATEGORISED_LABEL = 'Off the Map'

export default function ShelfContent({ entries }) {
  const [query, setQuery]           = useState('')
  const [activeStatus, setStatus]   = useState('')

  const statusCounts = useMemo(() => {
    const c = { unread: 0, reading: 0, read: 0 }
    for (const e of entries) c[e.status] = (c[e.status] ?? 0) + 1
    return c
  }, [entries])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries.filter(e => {
      if (activeStatus && e.status !== activeStatus) return false
      if (!q) return true
      const b = e.books
      return (
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.series_name?.toLowerCase().includes(q)
      )
    })
  }, [entries, query, activeStatus])

  const { genreMap, sortedGenres } = useMemo(() => {
    const map = new Map()
    for (const entry of filtered) {
      const genre = entry.books.genres?.[0] || UNCATEGORISED_LABEL
      if (!map.has(genre)) map.set(genre, [])
      map.get(genre).push(entry)
    }
    const sorted = [...map.keys()].sort((a, b) => {
      if (a === UNCATEGORISED_LABEL) return 1
      if (b === UNCATEGORISED_LABEL) return -1
      return a.localeCompare(b)
    })
    return { genreMap: map, sortedGenres: sorted }
  }, [filtered])

  function getCount(value) {
    if (!value) return entries.length
    return statusCounts[value] ?? 0
  }

  return (
    <>
      {/* Status filter tabs */}
      {entries.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-3">
          {STATUSES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                activeStatus === value
                  ? 'bg-bloom text-white'
                  : 'bg-petal/15 text-plum hover:bg-petal/30'
              }`}
            >
              {label} · {getCount(value)}
            </button>
          ))}
        </div>
      )}

      {/* Inline search */}
      {entries.length > 0 && (
        <div className="relative mt-3 mb-8">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate/50 pointer-events-none"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search your shelf by title or author…"
            className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-petal/30 bg-white focus:outline-none focus:ring-2 focus:ring-bloom/30 text-ink placeholder:text-slate/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate/50 hover:text-ink"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Book list */}
      {filtered.length === 0 ? (
        <p className="text-slate text-sm py-6">
          {query ? `No books matching "${query}".` : activeStatus ? `No ${activeStatus} books yet.` : ''}
        </p>
      ) : (
        <div className="space-y-8">
          {sortedGenres.map(genre => (
            <section key={genre}>
              <h2 className="font-serif text-lg font-semibold text-ink mb-3 flex items-center gap-2">
                {genre}
                <span className="text-sm font-normal text-slate">({genreMap.get(genre).length})</span>
              </h2>
              <div className="grid gap-3">
                {genreMap.get(genre).map(({ status, books: book }) => (
                  <div key={book.id} className="flex gap-4 p-4 rounded-xl border border-petal/30 bg-white">
                    <Link
                      href={`/books/${book.slug}`}
                      className="shrink-0 w-14 rounded-lg overflow-hidden bg-gray-50 block flex items-center justify-center"
                      style={{ aspectRatio: '2/3' }}
                    >
                      {book.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={book.cover_url} alt={book.title} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">📚</div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/books/${book.slug}`} className="font-semibold text-ink hover:text-bloom line-clamp-1">
                          {book.title}
                        </Link>
                        <ShelfStatusSelect bookId={book.id} currentStatus={status} />
                      </div>
                      <p className="text-sm text-slate mt-0.5">{book.author}</p>
                      {book.series_name && (
                        <p className="text-xs text-slate/60 mt-0.5 line-clamp-1">{book.series_name}</p>
                      )}
                      {book.tropes?.length > 0 && (
                        <p className="text-xs text-slate/70 mt-1.5 line-clamp-1">
                          {book.tropes.slice(0, 3).join(' · ')}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        <ShelfButton bookId={book.id} initialStatus={status} />
                        <span className="text-xs text-slate">Remove from shelf</span>
                        {book.rating && (
                          <span className="text-xs text-slate ml-auto">★ {book.rating.toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}

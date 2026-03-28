'use client'
import { useState, useEffect, useCallback, useTransition, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useDebounce } from 'use-debounce'
import BookCard from './BookCard'

export default function SearchClient({
  initialBooks, initialTotal, tropes,
  initialQuery = '', initialSelTropes = [], initialPage = 1,
}) {
  const router      = useRouter()
  const pathname    = usePathname()
  const [isPending, startTransition] = useTransition()
  const isMounted   = useRef(false)

  const [query,     setQuery]     = useState(initialQuery)
  const [selTropes, setSelTropes] = useState(initialSelTropes)
  const [page,      setPage]      = useState(initialPage)

  const [books,    setBooks]    = useState(initialBooks ?? [])
  const [total,    setTotal]    = useState(initialTotal ?? 0)
  const [loading,  setLoading]  = useState(false)

  const [debouncedQuery] = useDebounce(query, 350)

  // Push updated filters into URL (enables shareable links + SSR on refresh)
  const syncUrl = useCallback((q, tropes, p) => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    tropes.forEach(t => sp.append('tropes', t))
    if (p > 1) sp.set('page', p)
    startTransition(() => {
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
    })
  }, [pathname, router])

  // Fetch results from API route whenever filters change.
  // Skip the very first run — the server already provided correct initialBooks/initialTotal.
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      return
    }

    const sp = new URLSearchParams()
    if (debouncedQuery) sp.set('q', debouncedQuery)
    selTropes.forEach(t => sp.append('tropes', t))
    sp.set('page', page)

    setLoading(true)
    fetch(`/api/search?${sp.toString()}`)
      .then(r => r.json())
      .then(({ books, total }) => { setBooks(books ?? []); setTotal(total ?? 0) })
      .finally(() => setLoading(false))

    syncUrl(debouncedQuery, selTropes, page)
  }, [debouncedQuery, selTropes, page, syncUrl])

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1) }, [debouncedQuery, selTropes])

  const toggleTrope = t =>
    setSelTropes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar filters */}
      <aside className="w-full lg:w-64 shrink-0">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Title, author, series…"
          className="w-full border border-petal/40 rounded-lg px-3 py-2 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-bloom"
        />

        <FilterSection title="Tropes" items={tropes} selected={selTropes} onToggle={toggleTrope} />
      </aside>

      {/* Results */}
      <div className="flex-1">
        <p className="text-sm text-slate mb-4">
          {loading ? 'Searching…' : `${total.toLocaleString()} books found`}
        </p>

        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 transition-opacity ${loading ? 'opacity-40' : ''}`}>
          {books.map(b => <BookCard key={b.id} book={b} />)}
        </div>

        {books.length === 0 && !loading && (
          <p className="text-slate text-center py-16">No books found. Try different filters.</p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-petal/40 text-sm disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="px-4 py-2 text-sm text-slate">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-petal/40 text-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterSection({ title, items, selected, onToggle }) {
  const [expanded, setExpanded] = useState(false)

  // Always show selected items even if they fall outside the first 10
  const selectedSet = new Set(selected)
  const unselected  = items.filter(i => !selectedSet.has(i))
  const visible     = expanded
    ? items
    : [...selected, ...unselected.slice(0, Math.max(0, 10 - selected.length))]

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-sm mb-2">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {visible.map(item => (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className={`chip text-xs ${selected.includes(item) ? 'chip-active' : ''}`}
          >
            {item}
          </button>
        ))}
      </div>
      {items.length > 10 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs text-bloom mt-2 hover:underline"
        >
          {expanded ? 'Show less' : `+${items.length - 10} more`}
        </button>
      )}
    </div>
  )
}

'use client'
import { useState, useEffect, useCallback, useTransition, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useDebounce } from 'use-debounce'
import BookCard from './BookCard'
import { trackEvent } from '@/lib/events'

const SPICE_LABELS = { 1: 'Tame', 2: 'Mild', 3: 'Steamy', 4: 'Very Steamy', 5: 'Explicit' }

export default function SearchClient({
  initialBooks, initialTotal, tropes, genres = [], relationshipTypes = [],
  initialQuery = '', initialSelTropes = [], initialSelGenres = [], initialSelRelTypes = [], initialMinSpice = null,
  initialPage = 1, shelfMap = {}, autoFocus = false,
}) {
  const router      = useRouter()
  const pathname    = usePathname()
  const [isPending, startTransition] = useTransition()
  const isMounted   = useRef(false)
  const searchRef   = useRef(null)
  const resultsRef  = useRef(null)
  const searchWrapRef = useRef(null)

  const [query,     setQuery]     = useState(initialQuery)
  const [selTropes,   setSelTropes]   = useState(initialSelTropes)
  const [selGenres,   setSelGenres]   = useState(initialSelGenres)
  const [selRelTypes, setSelRelTypes] = useState(initialSelRelTypes)
  const [minSpice,    setMinSpice]    = useState(initialMinSpice)
  const [page,      setPage]      = useState(initialPage)

  const [books,    setBooks]    = useState(initialBooks ?? [])
  const [total,    setTotal]    = useState(initialTotal ?? 0)
  const [loading,  setLoading]  = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [debouncedQuery] = useDebounce(query, 350)

  const activeFilterCount = selTropes.length + selGenres.length + selRelTypes.length + (minSpice ? 1 : 0)

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const syncUrl = useCallback((q, tropes, genres, relTypes, spice, p) => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    tropes.forEach(t => sp.append('tropes', t))
    genres.forEach(g => sp.append('genres', g))
    relTypes.forEach(r => sp.append('relTypes', r))
    if (spice) sp.set('minSpice', spice)
    if (p > 1) sp.set('page', p)
    startTransition(() => {
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
    })
  }, [pathname, router])

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      return
    }

    const sp = new URLSearchParams()
    if (debouncedQuery) sp.set('q', debouncedQuery)
    selTropes.forEach(t => sp.append('tropes', t))
    selGenres.forEach(g => sp.append('genres', g))
    selRelTypes.forEach(r => sp.append('relTypes', r))
    if (minSpice) sp.set('minSpice', minSpice)
    sp.set('page', page)

    setLoading(true)
    fetch(`/api/search?${sp.toString()}`)
      .then(r => r.json())
      .then(({ books, total }) => {
        setBooks(books ?? [])
        setTotal(total ?? 0)
        trackEvent('search', { query: debouncedQuery, genres: selGenres, tropes: selTropes, rel_types: selRelTypes, min_spice: minSpice, result_count: total ?? 0 })
      })
      .finally(() => setLoading(false))

    syncUrl(debouncedQuery, selTropes, selGenres, selRelTypes, minSpice, page)
  }, [debouncedQuery, selTropes, selGenres, selRelTypes, minSpice, page, syncUrl])

  useEffect(() => { setPage(1) }, [debouncedQuery, selTropes, selGenres, selRelTypes, minSpice])

  useEffect(() => {
    if (autoFocus && searchRef.current) {
      searchRef.current.focus()
      if (searchWrapRef.current) {
        searchWrapRef.current.classList.add('search-animate-in')
        const t = setTimeout(() => searchWrapRef.current?.classList.remove('search-animate-in'), 400)
        return () => clearTimeout(t)
      }
    }
  }, [autoFocus])

  const toggleTrope = t => {
    const adding = !selTropes.includes(t)
    setSelTropes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
    if (adding) trackEvent('filter_apply', { filter_type: 'trope', value: t, query: debouncedQuery })
  }

  const toggleGenre = g => {
    const adding = !selGenres.includes(g)
    setSelGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
    if (adding) trackEvent('filter_apply', { filter_type: 'genre', value: g, query: debouncedQuery })
  }

  const handleSpiceChange = v => {
    setMinSpice(v)
    if (v) trackEvent('filter_apply', { filter_type: 'spice', value: v, query: debouncedQuery })
  }

  const toggleRelType = r => {
    const adding = !selRelTypes.includes(r)
    setSelRelTypes(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])
    if (adding) trackEvent('filter_apply', { filter_type: 'relationship_type', value: r, query: debouncedQuery })
  }

  const clearAll = () => { setSelTropes([]); setSelGenres([]); setSelRelTypes([]); setMinSpice(null) }

  const closeDrawer = () => {
    setDrawerOpen(false)
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="flex flex-col lg:flex-row gap-8">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div ref={searchWrapRef} className="mb-6">
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Title, author, trope, series…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom shadow-sm"
          />
        </div>
        <SpiceFilter value={minSpice} onChange={handleSpiceChange} />
        {genres.length > 0 && (
          <FilterSection title="Genres" items={genres} selected={selGenres} onToggle={toggleGenre} />
        )}
        <FilterSection title="Tropes" items={tropes} selected={selTropes} onToggle={toggleTrope} />
        {relationshipTypes.length > 0 && (
          <FilterSection title="Who Falls in Love" items={relationshipTypes} selected={selRelTypes} onToggle={toggleRelType} />
        )}
      </aside>

      {/* ── Results column ── */}
      <div className="flex-1">

        {/* Mobile: search + filter bar */}
        <div className="flex gap-2 mb-2 lg:hidden">
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Title, author, trope, series…"
            className="flex-1 border border-petal/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom"
          />
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-petal/40 text-sm shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 3h13M3 7.5h9M5.5 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-bloom text-white text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active filter chips (mobile) */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2 lg:hidden">
            {selGenres.map(g => (
              <button key={g} onClick={() => toggleGenre(g)} className="chip chip-active text-xs flex items-center gap-1">
                {g} <span className="opacity-60">×</span>
              </button>
            ))}
            {selTropes.map(t => (
              <button key={t} onClick={() => toggleTrope(t)} className="chip chip-active text-xs flex items-center gap-1">
                {t} <span className="opacity-60">×</span>
              </button>
            ))}
            {selRelTypes.map(r => (
              <button key={r} onClick={() => toggleRelType(r)} className="chip chip-active text-xs flex items-center gap-1">
                {r} <span className="opacity-60">×</span>
              </button>
            ))}
            <button onClick={clearAll} className="text-xs text-bloom hover:underline ml-1">
              Clear all
            </button>
          </div>
        )}

        <div ref={resultsRef}>
          <p className="text-sm text-slate mb-2 sm:mb-4">
            {loading ? 'Searching…' : `${total.toLocaleString()} books found`}
          </p>

          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 transition-opacity ${loading ? 'opacity-40' : ''}`}>
            {books.map(b => <BookCard key={b.id} book={b} shelfStatus={shelfMap[b.id] ?? null} />)}
          </div>

          {books.length === 0 && !loading && (
            <p className="text-slate text-center py-16">No books found. Try different filters.</p>
          )}

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

      {/* ── Mobile filter drawer ── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={closeDrawer}
          />
          {/* Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden bg-white rounded-t-2xl shadow-xl flex flex-col max-h-[85dvh]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-petal/30">
              <span className="font-semibold text-sm">Filters</span>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button onClick={clearAll} className="text-sm text-bloom hover:underline">
                    Clear all
                  </button>
                )}
                <button onClick={closeDrawer} className="text-slate/60 hover:text-ink">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>

            {/* Scrollable filter content */}
            <div className="overflow-y-auto flex-1 px-4 py-4">
              <SpiceFilter value={minSpice} onChange={handleSpiceChange} />
              {genres.length > 0 && (
                <FilterSection title="Genres" items={genres} selected={selGenres} onToggle={toggleGenre} />
              )}
              <FilterSection title="Tropes" items={tropes} selected={selTropes} onToggle={toggleTrope} />
              {relationshipTypes.length > 0 && (
                <FilterSection title="Who Falls in Love" items={relationshipTypes} selected={selRelTypes} onToggle={toggleRelType} />
              )}
            </div>

            {/* Footer CTA */}
            <div className="px-4 py-4 border-t border-petal/30">
              <button
                onClick={closeDrawer}
                className="w-full py-3 bg-bloom text-white font-semibold text-sm rounded-xl"
              >
                {loading ? 'Searching…' : `Show ${total.toLocaleString()} books`}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  )
}

function FilterSection({ title, items, selected, onToggle }) {
  const [expanded, setExpanded] = useState(false)

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

function SpiceFilter({ value, onChange }) {
  return (
    <div className="mb-6">
      <h3 className="font-semibold text-sm mb-2">Spice Level</h3>
      <div className="flex flex-wrap gap-1.5">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onChange(value === n ? null : n)}
            className={`chip text-xs ${value === n ? 'chip-active' : ''}`}
            title={SPICE_LABELS[n]}
          >
            {'🌶️'.repeat(n)}
          </button>
        ))}
      </div>
      {value && (
        <p className="text-xs text-slate/60 mt-1">{SPICE_LABELS[value]}{value < 5 ? ' and above' : ' only'}</p>
      )}
    </div>
  )
}

'use client'
import { useState, useEffect, useCallback, useTransition, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useDebounce } from 'use-debounce'
import BookCard from './BookCard'
import { trackEvent } from '@/lib/events'

const SPICE_LABELS = { 1: 'Tame', 2: 'Mild', 3: 'Steamy', 4: 'Very Steamy', 5: 'Explicit' }

export default function SearchClient({
  initialBooks, initialTotal, tropes, genres = [], relationshipTypes = [], representationOptions = [],
  initialQuery = '', initialSelTropes = [], initialSelGenres = [], initialSelRelTypes = [], initialSelRepresentation = [],
  initialExcludeTropes = [], initialExcludeGenres = [], initialExcludeRepresentation = [], initialSpice = null,
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
  const [selRepresentation, setSelRepresentation] = useState(initialSelRepresentation)
  const [exclTropes,         setExclTropes]         = useState(initialExcludeTropes)
  const [exclGenres,         setExclGenres]         = useState(initialExcludeGenres)
  const [exclRepresentation, setExclRepresentation] = useState(initialExcludeRepresentation)
  const [spice,    setSpice]    = useState(initialSpice)
  const [page,      setPage]      = useState(initialPage)

  const [books,    setBooks]    = useState(initialBooks ?? [])
  const [total,    setTotal]    = useState(initialTotal ?? 0)
  const [loading,  setLoading]  = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [smartText,    setSmartText]    = useState('')
  const [smartLoading, setSmartLoading] = useState(false)
  const [smartNote,    setSmartNote]    = useState(null)

  const [debouncedQuery] = useDebounce(query, 350)

  const activeFilterCount = selTropes.length + selGenres.length + selRelTypes.length + selRepresentation.length
    + exclTropes.length + exclGenres.length + exclRepresentation.length + (spice ? 1 : 0)

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const syncUrl = useCallback((q, tropes, genres, relTypes, representation, exclTropes, exclGenres, exclRepresentation, spice, p) => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    tropes.forEach(t => sp.append('tropes', t))
    genres.forEach(g => sp.append('genres', g))
    relTypes.forEach(r => sp.append('relTypes', r))
    representation.forEach(r => sp.append('representation', r))
    exclTropes.forEach(t => sp.append('excludeTropes', t))
    exclGenres.forEach(g => sp.append('excludeGenres', g))
    exclRepresentation.forEach(r => sp.append('excludeRepresentation', r))
    if (spice) sp.set('spice', spice)
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
    selRepresentation.forEach(r => sp.append('representation', r))
    exclTropes.forEach(t => sp.append('excludeTropes', t))
    exclGenres.forEach(g => sp.append('excludeGenres', g))
    exclRepresentation.forEach(r => sp.append('excludeRepresentation', r))
    if (spice) sp.set('spice', spice)
    sp.set('page', page)

    setLoading(true)
    fetch(`/api/search?${sp.toString()}`)
      .then(r => r.json())
      .then(({ books, total }) => {
        setBooks(books ?? [])
        setTotal(total ?? 0)
        trackEvent('search', {
          query: debouncedQuery, genres: selGenres, tropes: selTropes, rel_types: selRelTypes,
          representation: selRepresentation, exclude_tropes: exclTropes, exclude_genres: exclGenres,
          exclude_representation: exclRepresentation, spice: spice, result_count: total ?? 0,
        })
      })
      .finally(() => setLoading(false))

    syncUrl(debouncedQuery, selTropes, selGenres, selRelTypes, selRepresentation, exclTropes, exclGenres, exclRepresentation, spice, page)
  }, [debouncedQuery, selTropes, selGenres, selRelTypes, selRepresentation, exclTropes, exclGenres, exclRepresentation, spice, page, syncUrl])

  useEffect(() => { setPage(1) }, [debouncedQuery, selTropes, selGenres, selRelTypes, selRepresentation, exclTropes, exclGenres, exclRepresentation, spice])

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

  // Generic 3-state cycle: unselected → included → excluded → unselected.
  function makeCycler(filterType, selected, setSelected, excluded, setExcluded) {
    return item => {
      if (selected.includes(item)) {
        setSelected(prev => prev.filter(x => x !== item))
        setExcluded(prev => [...prev, item])
        trackEvent('filter_apply', { filter_type: filterType, value: item, mode: 'exclude', query: debouncedQuery })
      } else if (excluded.includes(item)) {
        setExcluded(prev => prev.filter(x => x !== item))
      } else {
        setSelected(prev => [...prev, item])
        trackEvent('filter_apply', { filter_type: filterType, value: item, mode: 'include', query: debouncedQuery })
      }
    }
  }

  const toggleTrope          = makeCycler('trope', selTropes, setSelTropes, exclTropes, setExclTropes)
  const toggleGenre          = makeCycler('genre', selGenres, setSelGenres, exclGenres, setExclGenres)
  const toggleRepresentation = makeCycler('representation', selRepresentation, setSelRepresentation, exclRepresentation, setExclRepresentation)

  const handleSpiceChange = v => {
    setSpice(v)
    if (v) trackEvent('filter_apply', { filter_type: 'spice', value: v, query: debouncedQuery })
  }

  const toggleRelType = r => {
    const adding = !selRelTypes.includes(r)
    setSelRelTypes(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])
    if (adding) trackEvent('filter_apply', { filter_type: 'relationship_type', value: r, query: debouncedQuery })
  }

  const clearAll = () => {
    setSelTropes([]); setSelGenres([]); setSelRelTypes([]); setSelRepresentation([])
    setExclTropes([]); setExclGenres([]); setExclRepresentation([])
    setSpice(null)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSmartSearch = async e => {
    e.preventDefault()
    const text = smartText.trim()
    if (!text || smartLoading) return

    setSmartLoading(true)
    setSmartNote(null)
    try {
      const res = await fetch('/api/search/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')

      const f = data.filters
      const matchedAny = f.tropes.length || f.excludeTropes.length || f.genres.length || f.excludeGenres.length
        || f.representation.length || f.excludeRepresentation.length || f.relationshipTypes.length || f.spice

      setSelTropes(f.tropes)
      setExclTropes(f.excludeTropes)
      setSelGenres(f.genres)
      setExclGenres(f.excludeGenres)
      setSelRepresentation(f.representation)
      setExclRepresentation(f.excludeRepresentation)
      setSelRelTypes(f.relationshipTypes)
      setSpice(f.spice)
      setQuery(matchedAny ? (f.query || '') : text)

      trackEvent('smart_search', { text, ...f, matched: !!matchedAny })
      setSmartNote(matchedAny ? null : "Couldn't match specific filters — searching by keyword instead.")
    } catch (err) {
      setSmartNote(err.message)
    } finally {
      setSmartLoading(false)
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div>
      <form onSubmit={handleSmartSearch} className="mb-6 rounded-xl border border-petal/40 bg-pink-50/40 p-3 sm:p-4">
        <label htmlFor="smart-search" className="block text-sm font-semibold mb-1.5">
          Describe what you&apos;re looking for
        </label>
        <div className="flex gap-2">
          <input
            id="smart-search"
            type="text"
            value={smartText}
            onChange={e => setSmartText(e.target.value)}
            placeholder="e.g. enemies to lovers, but the heroine isn&apos;t a virgin"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-bloom"
          />
          <button
            type="submit"
            disabled={smartLoading || !smartText.trim()}
            className="px-4 py-2 rounded-lg bg-bloom text-white text-sm font-medium shrink-0 disabled:opacity-50"
          >
            {smartLoading ? 'Thinking…' : 'Find books'}
          </button>
        </div>
        {smartNote && <p className="text-xs text-slate/70 mt-2">{smartNote}</p>}
      </form>

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
        <SpiceFilter value={spice} onChange={handleSpiceChange} />
        {genres.length > 0 && (
          <FilterSection title="Genres" items={genres} selected={selGenres} excluded={exclGenres} onToggle={toggleGenre} />
        )}
        <FilterSection title="Tropes" items={tropes} selected={selTropes} excluded={exclTropes} onToggle={toggleTrope} />
        {relationshipTypes.length > 0 && (
          <FilterSection title="Who Falls in Love" items={relationshipTypes} selected={selRelTypes} onToggle={toggleRelType} />
        )}
        {representationOptions.length > 0 && (
          <FilterSection title="Representation" items={representationOptions} selected={selRepresentation} excluded={exclRepresentation} onToggle={toggleRepresentation} />
        )}
        {activeFilterCount > 0 && (
          <p className="text-xs text-slate/50 mt-1">Click a filter again to exclude it, once more to clear.</p>
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
              <button key={`g-${g}`} onClick={() => setSelGenres(prev => prev.filter(x => x !== g))} className="chip chip-active text-xs flex items-center gap-1">
                {g} <span className="opacity-60">×</span>
              </button>
            ))}
            {selTropes.map(t => (
              <button key={`t-${t}`} onClick={() => setSelTropes(prev => prev.filter(x => x !== t))} className="chip chip-active text-xs flex items-center gap-1">
                {t} <span className="opacity-60">×</span>
              </button>
            ))}
            {selRelTypes.map(r => (
              <button key={`rt-${r}`} onClick={() => toggleRelType(r)} className="chip chip-active text-xs flex items-center gap-1">
                {r} <span className="opacity-60">×</span>
              </button>
            ))}
            {selRepresentation.map(r => (
              <button key={`rep-${r}`} onClick={() => setSelRepresentation(prev => prev.filter(x => x !== r))} className="chip chip-active text-xs flex items-center gap-1">
                {r} <span className="opacity-60">×</span>
              </button>
            ))}
            {exclGenres.map(g => (
              <button key={`xg-${g}`} onClick={() => setExclGenres(prev => prev.filter(x => x !== g))} className="chip chip-excluded text-xs flex items-center gap-1">
                no {g} <span className="opacity-60">×</span>
              </button>
            ))}
            {exclTropes.map(t => (
              <button key={`xt-${t}`} onClick={() => setExclTropes(prev => prev.filter(x => x !== t))} className="chip chip-excluded text-xs flex items-center gap-1">
                no {t} <span className="opacity-60">×</span>
              </button>
            ))}
            {exclRepresentation.map(r => (
              <button key={`xrep-${r}`} onClick={() => setExclRepresentation(prev => prev.filter(x => x !== r))} className="chip chip-excluded text-xs flex items-center gap-1">
                no {r} <span className="opacity-60">×</span>
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
              <SpiceFilter value={spice} onChange={handleSpiceChange} />
              {genres.length > 0 && (
                <FilterSection title="Genres" items={genres} selected={selGenres} excluded={exclGenres} onToggle={toggleGenre} />
              )}
              <FilterSection title="Tropes" items={tropes} selected={selTropes} excluded={exclTropes} onToggle={toggleTrope} />
              {relationshipTypes.length > 0 && (
                <FilterSection title="Who Falls in Love" items={relationshipTypes} selected={selRelTypes} onToggle={toggleRelType} />
              )}
              {representationOptions.length > 0 && (
                <FilterSection title="Representation" items={representationOptions} selected={selRepresentation} excluded={exclRepresentation} onToggle={toggleRepresentation} />
              )}
              {activeFilterCount > 0 && (
                <p className="text-xs text-slate/50 -mt-4">Tap a filter again to exclude it, once more to clear.</p>
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
    </div>
  )
}

function FilterSection({ title, items, selected, excluded = [], onToggle }) {
  const [expanded, setExpanded] = useState(false)

  const pinned      = new Set([...selected, ...excluded])
  const unselected  = items.filter(i => !pinned.has(i))
  const visible     = expanded
    ? items
    : [...selected, ...excluded, ...unselected.slice(0, Math.max(0, 10 - pinned.size))]

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-sm mb-2">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {visible.map(item => (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className={`chip text-xs ${selected.includes(item) ? 'chip-active' : ''} ${excluded.includes(item) ? 'chip-excluded' : ''}`}
          >
            {excluded.includes(item) ? `no ${item}` : item}
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
        <p className="text-xs text-slate/60 mt-1">{SPICE_LABELS[value]}</p>
      )}
    </div>
  )
}

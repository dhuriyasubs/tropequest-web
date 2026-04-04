'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useDebounce } from 'use-debounce'
import BookCard from './BookCard'

export default function BecauseYouLike() {
  const [query, setQuery]           = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [results, setResults]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [sugLoading, setSugLoading] = useState(false)
  const inputRef = useRef(null)
  const wrapperRef = useRef(null)

  const [debouncedQuery] = useDebounce(query, 300)

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (!debouncedQuery.trim() || selectedBook) {
      setSuggestions([])
      return
    }
    setSugLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&page=1`)
      .then(r => r.json())
      .then(({ books }) => setSuggestions(books?.slice(0, 6) ?? []))
      .finally(() => setSugLoading(false))
  }, [debouncedQuery, selectedBook])

  // Close suggestions on outside click
  useEffect(() => {
    function handler(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fetch similar books when a book is selected
  const fetchSimilar = useCallback(async (book) => {
    if (!book.tropes?.length) { setResults([]); return }
    setLoading(true)
    const sp = new URLSearchParams()
    book.tropes.slice(0, 5).forEach(t => sp.append('tropes', t))
    // exclude the selected book
    const res = await fetch(`/api/search?${sp.toString()}`)
    const { books } = await res.json()
    setResults((books ?? []).filter(b => b.id !== book.id))
    setLoading(false)
  }, [])

  function selectBook(book) {
    setSelectedBook(book)
    setQuery(book.title)
    setSuggestions([])
    setShowSuggestions(false)
    fetchSimilar(book)
  }

  function clearSelection() {
    setSelectedBook(null)
    setQuery('')
    setResults([])
    setSuggestions([])
    inputRef.current?.focus()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-1">Because you like…</h1>
      <p className="text-sm text-slate mb-8">Search a book or series you loved — we'll find similar reads.</p>

      {/* Search input */}
      <div ref={wrapperRef} className="relative max-w-lg mb-10">
        <div className="flex items-center gap-2 border border-petal/40 rounded-xl px-4 py-3 bg-white focus-within:ring-2 focus-within:ring-bloom focus-within:border-bloom transition-all">
          <svg className="w-4 h-4 text-slate/40 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedBook(null); setShowSuggestions(true) }}
            onFocus={() => { if (suggestions.length) setShowSuggestions(true) }}
            placeholder="e.g. A Court of Thorns and Roses"
            className="flex-1 text-sm bg-transparent focus:outline-none text-ink placeholder:text-slate/40"
            autoFocus
          />
          {query && (
            <button onClick={clearSelection} className="text-slate/40 hover:text-slate transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && (query.trim()) && !selectedBook && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-petal/30 rounded-xl shadow-lg z-30 overflow-hidden">
            {sugLoading ? (
              <div className="px-4 py-3 text-sm text-slate">Searching…</div>
            ) : suggestions.length > 0 ? (
              suggestions.map(book => (
                <button
                  key={book.id}
                  onMouseDown={() => selectBook(book)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left"
                >
                  {book.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.cover_url} alt="" className="w-8 h-12 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-12 bg-gray-100 rounded flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink line-clamp-1">{book.title}</p>
                    <p className="text-xs text-slate">{book.author}</p>
                    {book.series_name && (
                      <p className="text-xs text-slate/60">{book.series_name}</p>
                    )}
                  </div>
                </button>
              ))
            ) : debouncedQuery.trim() ? (
              <div className="px-4 py-3 text-sm text-slate">No books found</div>
            ) : null}
          </div>
        )}
      </div>

      {/* Results */}
      {selectedBook && (
        <>
          <div className="flex items-center gap-3 mb-6">
            {selectedBook.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedBook.cover_url} alt="" className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />
            )}
            <div>
              <p className="text-xs text-slate uppercase tracking-wide font-medium mb-0.5">Because you like</p>
              <p className="font-serif text-lg font-semibold text-ink leading-tight">{selectedBook.title}</p>
              {selectedBook.tropes?.length > 0 && (
                <p className="text-xs text-slate/60 mt-0.5">{selectedBook.tropes.slice(0, 3).join(' · ')}</p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {results.map(book => <BookCard key={book.id} book={book} />)}
            </div>
          ) : (
            <p className="text-slate text-center py-16">No similar books found.</p>
          )}
        </>
      )}

      {/* Empty state */}
      {!selectedBook && !query && (
        <div className="text-center py-16 text-slate/50">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-sm">Start typing a book you love</p>
        </div>
      )}
    </div>
  )
}

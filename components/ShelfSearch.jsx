'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function ShelfSearch() {
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [added,   setAdded]   = useState(new Set())  // bookIds already added
  const [adding,  setAdding]  = useState(null)        // bookId being added
  const inputRef = useRef(null)
  const router   = useRouter()

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else { setQuery(''); setResults([]) }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&page=1`)
        const data = await res.json()
        setResults(data.books ?? [])
      } catch { setResults([]) }
      setLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  async function addToShelf(book) {
    setAdding(book.id)
    const res = await fetch('/api/shelf', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ bookId: book.id, status: 'owned' }),
    })
    if (res.ok) {
      const { status } = await res.json()
      if (status) {
        setAdded(s => new Set(s).add(book.id))
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: `"${book.title}" added to shelf` },
        }))
        router.refresh()
      }
    }
    setAdding(null)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-colors ${
          open
            ? 'bg-bloom text-white border-bloom'
            : 'bg-white text-ink border-petal/40 hover:border-bloom hover:text-bloom'
        }`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
        </svg>
        Search & Add
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white border border-petal/30 rounded-2xl shadow-xl z-40 overflow-hidden">
          <div className="p-3 border-b border-petal/20">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by title or author…"
              className="w-full text-sm px-3 py-2 rounded-lg border border-petal/30 focus:outline-none focus:ring-2 focus:ring-bloom/30"
            />
          </div>

          <div className="max-h-72 overflow-y-auto">
            {loading && (
              <p className="text-xs text-slate text-center py-4">Searching…</p>
            )}
            {!loading && query && results.length === 0 && (
              <p className="text-xs text-slate text-center py-4">No books found for &ldquo;{query}&rdquo;</p>
            )}
            {!loading && !query && (
              <p className="text-xs text-slate text-center py-4">Type to search books</p>
            )}
            {results.map(book => (
              <div key={book.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 border-b border-petal/10 last:border-0">
                {book.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.cover_url} alt="" className="w-8 rounded shrink-0 object-cover" style={{ aspectRatio: '2/3' }} />
                ) : (
                  <span className="w-8 shrink-0 text-center">📚</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{book.title}</p>
                  <p className="text-xs text-slate">{book.author}</p>
                </div>
                <button
                  onClick={() => addToShelf(book)}
                  disabled={adding === book.id || added.has(book.id)}
                  className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    added.has(book.id)
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : 'bg-bloom/10 text-bloom hover:bg-bloom hover:text-white disabled:opacity-50'
                  }`}
                >
                  {adding === book.id ? '…' : added.has(book.id) ? 'Added ✓' : '+ Add'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
      )}
    </div>
  )
}

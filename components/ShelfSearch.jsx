'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'

export default function ShelfSearch({ existingBookIds = [] }) {
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [added,   setAdded]   = useState(new Set())  // bookIds added this session
  const [adding,  setAdding]  = useState(null)        // bookId being added
  const existingSet = useMemo(() => new Set(existingBookIds), [existingBookIds])

  const [manualOpen,   setManualOpen]   = useState(false)
  const [manualTitle,  setManualTitle]  = useState('')
  const [manualAuthor, setManualAuthor] = useState('')
  const [manualSaving, setManualSaving] = useState(false)
  const [manualDone,   setManualDone]   = useState(null) // { title, alreadyInShelf } | null
  const inputRef = useRef(null)
  const router   = useRouter()

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else {
      setQuery(''); setResults([])
      setManualOpen(false); setManualTitle(''); setManualAuthor(''); setManualDone(null)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&page=1&coreOnly=false`)
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
      body:    JSON.stringify({ bookId: book.id, status: 'unread' }),
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

  function openManual() {
    setManualOpen(true)
    setManualTitle(query)
    setManualAuthor('')
    setManualDone(null)
  }

  async function addManually(e) {
    e.preventDefault()
    const title = manualTitle.trim()
    if (!title) return
    setManualSaving(true)
    try {
      const res  = await fetch('/api/shelf/manual-add', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title, author: manualAuthor.trim() || null }),
      })
      const data = await res.json()
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: data.alreadyInShelf ? `"${title}" is already on your shelf` : `"${title}" added to shelf` },
        }))
        setManualDone({ title, alreadyInShelf: data.alreadyInShelf })
        setManualOpen(false)
        router.refresh()
      } else {
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: data.error ?? 'Could not add book' } }))
      }
    } catch {
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Could not add book' } }))
    }
    setManualSaving(false)
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
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>Add Books</span>
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white border border-petal/30 rounded-2xl shadow-xl z-40 overflow-hidden">
          <div className="p-3 border-b border-petal/20">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search catalogue to add…"
              className="w-full text-sm px-3 py-2 rounded-lg border border-petal/30 focus:outline-none focus:ring-2 focus:ring-bloom/30"
            />
          </div>

          <div className="max-h-72 overflow-y-auto">
            {loading && (
              <p className="text-xs text-slate text-center py-4">Searching…</p>
            )}
            {!loading && query && results.length === 0 && !manualOpen && (
              <div className="text-center py-4 px-3">
                <p className="text-xs text-slate mb-2">No books found for &ldquo;{query}&rdquo;</p>
                <button
                  onClick={openManual}
                  className="text-xs font-semibold text-bloom hover:underline"
                >
                  + Add &ldquo;{query}&rdquo; manually
                </button>
              </div>
            )}
            {!loading && !query && !manualOpen && (
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
                {existingSet.has(book.id) ? (
                  <span
                    className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-slate cursor-default"
                    title="Already on your shelf"
                  >
                    Already in shelf
                  </span>
                ) : (
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
                )}
              </div>
            ))}

            {!loading && results.length > 0 && !manualOpen && (
              <button
                onClick={openManual}
                className="w-full text-left text-xs font-medium text-slate hover:text-bloom px-3 py-2.5"
              >
                Can&apos;t find it? + Add manually
              </button>
            )}

            {manualOpen && (
              <form onSubmit={addManually} className="p-3 space-y-2 border-t border-petal/20">
                <input
                  type="text"
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                  placeholder="Title"
                  autoFocus
                  className="w-full text-sm px-3 py-2 rounded-lg border border-petal/30 focus:outline-none focus:ring-2 focus:ring-bloom/30"
                />
                <input
                  type="text"
                  value={manualAuthor}
                  onChange={e => setManualAuthor(e.target.value)}
                  placeholder="Author (optional)"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-petal/30 focus:outline-none focus:ring-2 focus:ring-bloom/30"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={manualSaving || !manualTitle.trim()}
                    className="flex-1 text-xs font-semibold bg-bloom text-white py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {manualSaving ? 'Adding…' : 'Add to shelf'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualOpen(false)}
                    className="text-xs text-slate hover:text-ink px-3 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {manualDone && (
              <p className="text-xs text-center py-3 px-3 text-green-700 bg-green-50">
                {manualDone.alreadyInShelf
                  ? `"${manualDone.title}" is already on your shelf`
                  : `"${manualDone.title}" added to shelf`}
              </p>
            )}
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

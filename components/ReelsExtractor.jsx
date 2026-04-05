'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

export default function ReelsExtractor() {
  const [url,        setUrl]        = useState('')
  const [text,       setText]       = useState('')
  const [showText,   setShowText]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [books,      setBooks]      = useState(null)
  const [message,    setMessage]    = useState(null)
  const [selected,   setSelected]   = useState(new Set())
  const [shelfMap,   setShelfMap]   = useState({}) // bookId -> status
  const [tbrIds,     setTbrIds]     = useState(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const router = useRouter()

  // Fetch user's shelf + TBR once books are extracted
  useEffect(() => {
    if (!books?.length) return
    const dbIds = books.map(b => b.dbBook?.id).filter(Boolean)
    if (!dbIds.length) return

    async function fetchUserData() {
      const supabase = createSupabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: shelf }, { data: tbr }] = await Promise.all([
        supabase.from('shelf').select('book_id, status').eq('user_id', user.id).in('book_id', dbIds),
        supabase.from('tbr').select('book_id').eq('user_id', user.id).in('book_id', dbIds),
      ])
      const map = {}
      ;(shelf ?? []).forEach(r => { map[r.book_id] = r.status })
      const tbrSet = new Set((tbr ?? []).map(r => r.book_id))
      setShelfMap(map)
      setTbrIds(tbrSet)
      // Remove already-read or already-in-TBR books from selection
      setSelected(prev => {
        const next = new Set(prev)
        for (const id of next) {
          if (tbrSet.has(id) || map[id] === 'read') next.delete(id)
        }
        return next
      })
    }
    fetchUserData()
  }, [books])

  async function extract() {
    const hasUrl  = url.trim()
    const hasText = text.trim()
    if (!hasUrl && !hasText) return
    setLoading(true)
    setError(null)
    setBooks(null)
    setMessage(null)
    setSelected(new Set())
    setShelfMap({})
    setTbrIds(new Set())

    try {
      const res  = await fetch('/api/reels', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url: hasUrl || null, text: hasText || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
      } else {
        setBooks(data.books ?? [])
        if (data.message) setMessage(data.message)
        // Pre-select all suggested books that have a dbBook
        const preSelected = new Set(
          (data.books ?? [])
            .filter(b => b.suggested && b.dbBook?.id)
            .map(b => b.dbBook.id)
        )
        setSelected(preSelected)
      }
    } catch {
      setError('Failed to reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    const eligible = (books ?? []).filter(b => b.dbBook?.id).map(b => b.dbBook.id)
    if (selected.size === eligible.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(eligible))
    }
  }

  async function addSelectedToTbr() {
    if (!selected.size) return
    const supabase = createSupabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      sessionStorage.setItem('authRedirect', '/reels')
      router.push('/login')
      return
    }

    setBulkLoading(true)
    const res = await fetch('/api/tbr', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ bookIds: [...selected], source: 'video' }),
    })
    if (res.ok) {
      setTbrIds(prev => new Set([...prev, ...selected]))
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: `${selected.size} book${selected.size !== 1 ? 's' : ''} added to TBR` },
      }))
      setSelected(new Set())
    }
    setBulkLoading(false)
  }

  const eligibleBooks  = (books ?? []).filter(b => b.dbBook?.id && !tbrIds.has(b.dbBook.id) && shelfMap[b.dbBook.id] !== 'read')
  const allInTbr       = eligibleBooks.length > 0 && eligibleBooks.every(b => tbrIds.has(b.dbBook.id))
  const allSelected    = eligibleBooks.length > 0 && selected.size === eligibleBooks.length
  const canSubmit      = !loading && (url.trim() || text.trim())

  function bookSortKey(item) {
    const id = item.dbBook?.id
    if (!id) return 1                          // no db match — after eligible
    if (shelfMap[id] === 'read') return 3      // read — last
    if (tbrIds.has(id)) return 2               // in TBR — second to last
    return 0                                   // eligible — first
  }
  const sortedBooks = (books ?? []).slice().sort((a, b) => bookSortKey(a) - bookSortKey(b))

  return (
    <div>
      {/* URL input */}
      <div className="flex gap-3 mb-3">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && canSubmit && extract()}
          placeholder="Paste a YouTube URL…"
          className="flex-1 border border-petal/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/30"
        />
        <button
          onClick={extract}
          disabled={!canSubmit}
          className="bg-bloom text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm whitespace-nowrap"
        >
          {loading ? 'Extracting…' : 'Extract Books'}
        </button>
      </div>

      {/* Toggle manual paste */}
      <button
        onClick={() => setShowText(v => !v)}
        className="text-xs text-slate hover:text-bloom underline underline-offset-2 mb-6 block"
      >
        {showText ? 'Hide text input' : 'Instagram not working? Paste the caption or transcript instead'}
      </button>

      {showText && (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste the video caption, comments, or transcript here…"
          rows={5}
          className="w-full border border-petal/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/30 mb-6 resize-none"
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-bloom/30 border-t-bloom rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate">Transcribing &amp; extracting books…</p>
          <p className="text-xs text-slate/60 mt-1">This may take 15–30 seconds</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
          {error.toLowerCase().includes('instagram') && !showText && (
            <button
              onClick={() => setShowText(true)}
              className="block mt-2 underline underline-offset-2 font-medium"
            >
              Paste the caption manually instead
            </button>
          )}
        </div>
      )}

      {/* No books found */}
      {!loading && books?.length === 0 && (
        <p className="text-center text-slate py-12">
          {message || 'No books found in this content.'}
        </p>
      )}

      {/* Results */}
      {!loading && books?.length > 0 && (
        <>
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate">
              {books.length} book{books.length !== 1 ? 's' : ''} found &mdash;{' '}
              <span className="text-green-600">{books.filter(b => b.suggested).length} suggested</span>
              {books.some(b => !b.suggested) && (
                <>, <span className="text-red-500">{books.filter(b => !b.suggested).length} not suggested</span></>
              )}
            </p>
            {eligibleBooks.length > 0 && !allInTbr && (
              <button
                onClick={toggleAll}
                className="text-xs text-bloom hover:underline underline-offset-2 font-medium"
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            )}
          </div>

          <div className="grid gap-3">
            {sortedBooks.map((item, i) => (
              <BookResultCard
                key={i}
                item={item}
                selected={item.dbBook?.id ? selected.has(item.dbBook.id) : false}
                onToggle={item.dbBook?.id && !tbrIds.has(item.dbBook.id) && shelfMap[item.dbBook.id] !== 'read' ? () => toggleSelect(item.dbBook.id) : null}
                shelfStatus={item.dbBook?.id ? (shelfMap[item.dbBook.id] ?? null) : null}
                isInTbr={item.dbBook?.id ? tbrIds.has(item.dbBook.id) : false}
              />
            ))}
          </div>

          {/* Bulk add bar */}
          {eligibleBooks.length > 0 && (
            <div className="sticky bottom-4 mt-6 flex items-center justify-between gap-4 bg-white border border-petal/30 rounded-2xl shadow-lg px-5 py-3">
              {allInTbr ? (
                <p className="text-sm text-slate italic">Nothing new to add to TBR</p>
              ) : (
                <>
                  <p className="text-sm text-slate">
                    {selected.size > 0
                      ? <><span className="font-semibold text-ink">{selected.size}</span> book{selected.size !== 1 ? 's' : ''} selected</>
                      : 'Select books to add to TBR'
                    }
                  </p>
                  <button
                    onClick={addSelectedToTbr}
                    disabled={!selected.size || bulkLoading}
                    className="bg-bloom text-white text-sm font-semibold px-5 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 whitespace-nowrap"
                  >
                    {bulkLoading ? 'Adding…' : 'Add to TBR'}
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function BookResultCard({ item, selected, onToggle, shelfStatus, isInTbr }) {
  const { title, author, suggested, reason, dbBook } = item

  return (
    <div
      className={`flex gap-4 p-4 rounded-xl border transition-colors ${
        selected
          ? 'border-bloom/40 bg-bloom/5'
          : suggested
          ? 'border-green-200 bg-green-50/40'
          : 'border-red-200 bg-red-50/20'
      }`}
    >
      {/* Checkbox */}
      {onToggle && (
        <div className="shrink-0 flex items-center">
          <button
            onClick={onToggle}
            aria-label={selected ? 'Deselect' : 'Select'}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              selected ? 'bg-bloom border-bloom' : 'border-slate/30 hover:border-bloom'
            }`}
          >
            {selected && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Cover */}
      <div className="shrink-0 w-14 rounded-lg overflow-hidden bg-gray-100" style={{ aspectRatio: '2/3' }}>
        {dbBook?.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dbBook.cover_url} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">📚</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            {dbBook ? (
              <Link href={`/books/${dbBook.slug}`} className="font-semibold text-ink hover:text-bloom line-clamp-1 block">
                {dbBook.title}
              </Link>
            ) : (
              <p className="font-semibold text-ink line-clamp-1">{title}</p>
            )}
            <p className="text-sm text-slate mt-0.5">{dbBook?.author || author || 'Unknown author'}</p>
          </div>

          <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
            suggested ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}>
            {suggested ? '✓ Suggested' : '✗ Not Suggested'}
          </span>
        </div>

        {reason && (
          <p className="text-xs text-slate/80 mt-1.5 line-clamp-2 italic">{reason}</p>
        )}

        {/* Tags */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {shelfStatus === 'read' && (
            <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2 py-0.5 font-medium">
              Already read
            </span>
          )}
          {shelfStatus && shelfStatus !== 'read' && (
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-medium">
              On shelf
            </span>
          )}
          {isInTbr && !shelfStatus && (
            <span className="text-xs bg-bloom/10 text-bloom border border-bloom/20 rounded-full px-2 py-0.5 font-medium">
              In TBR
            </span>
          )}
          {dbBook?.rating && (
            <span className="text-xs text-slate ml-auto">★ {dbBook.rating.toFixed(1)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

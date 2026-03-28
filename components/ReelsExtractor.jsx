'use client'
import { useState } from 'react'
import Link from 'next/link'
import TbrButton from './TbrButton'

export default function ReelsExtractor() {
  const [url,     setUrl]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [books,   setBooks]   = useState(null)
  const [message, setMessage] = useState(null)

  async function extract() {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setBooks(null)
    setMessage(null)

    try {
      const res  = await fetch('/api/reels', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
      } else {
        setBooks(data.books)
        if (data.message) setMessage(data.message)
      }
    } catch {
      setError('Failed to reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* URL input */}
      <div className="flex gap-3 mb-8">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && extract()}
          placeholder="Paste a YouTube or Instagram reel URL…"
          className="flex-1 border border-petal/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/30"
        />
        <button
          onClick={extract}
          disabled={loading || !url.trim()}
          className="bg-bloom text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm whitespace-nowrap"
        >
          {loading ? 'Extracting…' : 'Extract Books'}
        </button>
      </div>

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
          <p className="text-sm text-slate mb-4">
            {books.length} book{books.length !== 1 ? 's' : ''} found &mdash;{' '}
            <span className="text-green-600">{books.filter(b => b.suggested).length} suggested</span>
            {books.some(b => !b.suggested) && (
              <>, <span className="text-red-500">{books.filter(b => !b.suggested).length} not suggested</span></>
            )}
          </p>
          <div className="grid gap-3">
            {books.map((item, i) => <BookResultCard key={i} item={item} />)}
          </div>
        </>
      )}
    </div>
  )
}

function BookResultCard({ item }) {
  const { title, author, suggested, reason, dbBook } = item

  return (
    <div className={`flex gap-4 p-4 rounded-xl border ${
      suggested
        ? 'border-green-200 bg-green-50/40'
        : 'border-red-200 bg-red-50/20'
    }`}>
      {/* Cover */}
      <div className="shrink-0 w-14 rounded-lg overflow-hidden bg-gray-100" style={{ aspectRatio: '2/3' }}>
        {dbBook?.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dbBook.cover_url}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">📚</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            {dbBook ? (
              <Link
                href={`/books/${dbBook.slug}`}
                className="font-semibold text-ink hover:text-bloom line-clamp-1 block"
              >
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

        <div className="flex items-center gap-2 mt-3">
          {dbBook && (
            <>
              <TbrButton bookId={dbBook.id} size="sm" />
              <span className="text-xs text-slate">Add to TBR</span>
              {dbBook.rating && (
                <span className="text-xs text-slate ml-auto">★ {dbBook.rating.toFixed(1)}</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

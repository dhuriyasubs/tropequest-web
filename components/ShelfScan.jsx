'use client'
import { useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

function FeedbackForm({ book, onDone }) {
  const [correctTitle,  setCorrectTitle]  = useState(book.dbBook?.title  ?? book.title)
  const [correctAuthor, setCorrectAuthor] = useState(book.dbBook?.author ?? book.author)
  const [notes,         setNotes]         = useState('')
  const [saving,        setSaving]        = useState(false)
  const [done,          setDone]          = useState(false)

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/shelf/scan-feedback', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifiedTitle:  book.title,
        identifiedAuthor: book.author,
        correctTitle:     correctTitle.trim()  || null,
        correctAuthor:    correctAuthor.trim() || null,
        notes:            notes.trim()         || null,
      }),
    })
    setSaving(false)
    setDone(true)
    setTimeout(onDone, 1200)
  }

  if (done) return <p className="text-xs text-green-600 py-1">Thanks for the feedback!</p>

  return (
    <form onSubmit={submit} className="mt-2 space-y-1.5 border-t border-petal/20 pt-2">
      <input
        type="text"
        value={correctTitle}
        onChange={e => setCorrectTitle(e.target.value)}
        placeholder="Correct title"
        className="w-full text-xs border border-petal/30 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloom/40"
      />
      <input
        type="text"
        value={correctAuthor}
        onChange={e => setCorrectAuthor(e.target.value)}
        placeholder="Correct author"
        className="w-full text-xs border border-petal/30 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloom/40"
      />
      <input
        type="text"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Anything else? (optional)"
        className="w-full text-xs border border-petal/30 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloom/40"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="text-xs bg-bloom text-white px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Sending…' : 'Submit'}
        </button>
        <button type="button" onClick={onDone} className="text-xs text-slate hover:text-ink px-2 py-1.5">
          Cancel
        </button>
      </div>
    </form>
  )
}

async function resizeImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1200
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else { width = Math.round(width * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      const base64 = canvas.toDataURL('image/jpeg', 0.82).split(',')[1]
      resolve(base64)
    }
    img.src = url
  })
}

export default function ShelfScan({ showLabel = false }) {
  const fileRef   = useRef(null)
  const router    = useRouter()
  const [phase,    setPhase]    = useState('idle')   // idle | scanning | results
  const [books,    setBooks]    = useState([])
  const [selected, setSelected] = useState(new Set())
  const [adding,   setAdding]   = useState(false)
  const [preview,  setPreview]  = useState(null)
  const [error,    setError]    = useState(null)
  const [feedback, setFeedback] = useState(new Set())  // indices showing feedback form

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const supabase = createSupabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      sessionStorage.setItem('authRedirect', '/shelf')
      router.push('/login')
      return
    }

    setPreview(URL.createObjectURL(file))
    setPhase('scanning')
    setError(null)
    setBooks([])

    try {
      const image = await resizeImage(file)
      const res = await fetch('/api/shelf/scan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image, mimeType: 'image/jpeg' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Scan failed')

      const allBooks = data.books ?? []
      setBooks(allBooks)
      setSelected(new Set(allBooks.filter(b => b.dbBook).map(b => b.dbBook.id)))
      setPhase('results')
    } catch (err) {
      setError(err.message)
      setPhase('idle')
    }

    // Reset file input so same file can be re-selected
    e.target.value = ''
  }

  function toggleSelect(id) {
    setSelected(s => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function addToShelf() {
    setAdding(true)
    await Promise.all([...selected].map(bookId =>
      fetch('/api/shelf', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bookId, status: 'unread' }),
      })
    ))
    setAdding(false)
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { message: `${selected.size} book${selected.size !== 1 ? 's' : ''} added to shelf!` },
    }))
    closeResults()
    router.refresh()
  }

  function closeResults() {
    setPhase('idle')
    setBooks([])
    setSelected(new Set())
    setPreview(null)
    setError(null)
  }

  return (
    <>
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-2 bg-bloom text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        <span className={showLabel ? '' : 'hidden sm:inline'}>
          {showLabel ? 'Scan your shelf' : 'Scan Shelf'}
        </span>
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-100 text-red-700 text-sm px-4 py-2 rounded-xl shadow z-50">
          {error}
        </div>
      )}

      {/* Scanning overlay */}
      {phase === 'scanning' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center">
            {preview && (
              <img src={preview} alt="shelf" className="w-full max-h-48 object-cover rounded-xl mb-4" />
            )}
            <div className="flex items-center justify-center gap-2 text-bloom">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span className="text-sm font-medium">Identifying books…</span>
            </div>
          </div>
        </div>
      )}

      {/* Results modal */}
      {phase === 'results' && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-petal/20">
              <div>
                <h2 className="font-semibold text-ink">Books Found</h2>
                <p className="text-xs text-slate mt-0.5">{books.length} identified · {selected.size} selected</p>
              </div>
              <button onClick={closeResults} className="text-slate hover:text-ink p-1">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {books.length === 0 && (
                <p className="text-slate text-sm text-center py-6">No books could be identified.</p>
              )}
              {books.map((b, i) => {
                const id = b.dbBook?.id
                const showFeedback = feedback.has(i)
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border transition-colors ${
                      id && selected.has(id)
                        ? 'border-bloom bg-bloom/5'
                        : 'border-petal/30'
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!(id && selected.has(id))}
                        onChange={() => id && toggleSelect(id)}
                        className="accent-bloom w-4 h-4 shrink-0"
                      />
                      {b.dbBook?.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.dbBook.cover_url} alt="" className="w-8 rounded shrink-0 object-cover" style={{ aspectRatio: '2/3' }} />
                      ) : (
                        <span className="w-8 shrink-0 text-center text-base">📚</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium line-clamp-1">{b.dbBook?.title ?? b.title}</p>
                        <p className="text-xs text-slate">{b.dbBook?.author ?? b.author}</p>
                        {!b.dbBook?.cover_url && (
                          <p className="text-xs text-slate/50 mt-0.5">Will be enriched soon</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={e => { e.preventDefault(); setFeedback(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n }) }}
                        className="shrink-0 text-xs text-slate/50 hover:text-red-400 transition-colors px-1"
                        title="Report wrong identification"
                      >
                        Wrong?
                      </button>
                    </label>
                    {showFeedback && (
                      <FeedbackForm
                        book={b}
                        onDone={() => setFeedback(s => { const n = new Set(s); n.delete(i); return n })}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {selected.size > 0 && (
              <div className="p-4 border-t border-petal/20">
                <button
                  onClick={addToShelf}
                  disabled={adding}
                  className="w-full bg-bloom text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {adding ? 'Adding…' : `Add ${selected.size} book${selected.size !== 1 ? 's' : ''} to Shelf`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

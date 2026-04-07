'use client'
import { useState, useEffect } from 'react'

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40'

const EMPTY_BOOK = {
  title: '', author: '', slug: '', cover_url: '',
  series_name: '', series_number: '', rating: '', rating_count: '', rating_source: '',
  primary_genre: '', secondary_genre: '', genres: '', tropes: '', description: '',
  release_date: '', release_year: '',
  buy_url_amazon_us: '', buy_url_amazon_in: '', buy_url_flipkart: '',
  price_amazon_us: '', price_amazon_in: '',
}

function missingFields(b) {
  const missing = []
  if (!b.description)                              missing.push('description')
  if (!b.cover_url)                                missing.push('cover')
  if (!b.tropes || b.tropes.length === 0)          missing.push('tropes')
  if (!b.buy_url_amazon_us && !b.buy_url_amazon_in) missing.push('buy links')
  if (!b.primary_genre)                            missing.push('genre')
  return missing
}

function toSlug(title, author) {
  return `${title}-${author}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function buildPayload(book, isNew) {
  return {
    ...(!isNew && { id: book.id }),
    title:             book.title.trim(),
    author:            book.author.trim(),
    slug:              book.slug.trim(),
    cover_url:         book.cover_url         || null,
    description:       book.description       || null,
    series_name:       book.series_name       || null,
    series_number:     book.series_number !== '' ? Number(book.series_number) : null,
    rating:            book.rating        !== '' ? Number(book.rating)        : null,
    rating_count:      book.rating_count  !== '' ? Number(book.rating_count)  : null,
    rating_source:     book.rating_source || null,
    primary_genre:     book.primary_genre   || null,
    secondary_genre:   book.secondary_genre || null,
    release_date:      book.release_date    || null,
    release_year:      book.release_year !== '' ? Number(book.release_year) : null,
    genres:            book.genres  ? book.genres.split(',').map(s => s.trim()).filter(Boolean)  : [],
    tropes:            book.tropes  ? book.tropes.split(',').map(s => s.trim()).filter(Boolean)  : [],
    buy_url_amazon_us: book.buy_url_amazon_us || null,
    buy_url_amazon_in: book.buy_url_amazon_in || null,
    buy_url_flipkart:  book.buy_url_flipkart  || null,
    price_amazon_in:   book.price_amazon_in  !== '' ? Number(book.price_amazon_in)  : null,
    price_amazon_us:   book.price_amazon_us  !== '' ? Number(book.price_amazon_us)  : null,
  }
}

function normaliseBook(b) {
  return {
    ...b,
    tropes:        Array.isArray(b.tropes) ? b.tropes.join(', ') : (b.tropes ?? ''),
    genres:        Array.isArray(b.genres) ? b.genres.join(', ') : (b.genres ?? ''),
    series_number: b.series_number ?? '',
    rating:        b.rating        ?? '',
    rating_count:  b.rating_count  ?? '',
    rating_source: b.rating_source ?? '',
    cover_url:     b.cover_url     ?? '',
    description:   b.description   ?? '',
    series_name:   b.series_name   ?? '',
    primary_genre:   b.primary_genre   ?? '',
    secondary_genre: b.secondary_genre ?? '',
    release_date:    b.release_date    ?? '',
    release_year:    b.release_year    ?? '',
    buy_url_amazon_us: b.buy_url_amazon_us ?? '',
    buy_url_amazon_in: b.buy_url_amazon_in ?? '',
    buy_url_flipkart:  b.buy_url_flipkart  ?? '',
    price_amazon_us:   b.price_amazon_us   ?? '',
    price_amazon_in:   b.price_amazon_in   ?? '',
  }
}

// ── Shared book fields ────────────────────────────────────────────────────
function BookFields({ book, set }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate mb-1">Title <span className="text-red-400">*</span></label>
          <input type="text" required value={book.title} onChange={e => set('title', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate mb-1">Author <span className="text-red-400">*</span></label>
          <input type="text" required value={book.author} onChange={e => set('author', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate mb-1">Slug <span className="text-red-400">*</span></label>
          <input type="text" required value={book.slug} onChange={e => set('slug', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate mb-1">Cover URL</label>
          <input type="text" value={book.cover_url} onChange={e => set('cover_url', e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs text-slate mb-1">Series Name</label>
          <input type="text" value={book.series_name} onChange={e => set('series_name', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate mb-1">Series #</label>
          <input type="number" value={book.series_number} onChange={e => set('series_number', e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-slate mb-1">Rating</label>
          <input type="number" step="0.01" min="0" max="5" value={book.rating} onChange={e => set('rating', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate mb-1">Rating Count</label>
          <input type="number" value={book.rating_count} onChange={e => set('rating_count', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate mb-1">Rating Source</label>
          <input type="text" value={book.rating_source} onChange={e => set('rating_source', e.target.value)} placeholder="e.g. Goodreads" className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate mb-1">Primary Genre</label>
          <input type="text" value={book.primary_genre} onChange={e => set('primary_genre', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate mb-1">Secondary Genre</label>
          <input type="text" value={book.secondary_genre} onChange={e => set('secondary_genre', e.target.value)} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-slate mb-1">Genres (comma-separated)</label>
          <input type="text" value={book.genres} onChange={e => set('genres', e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate mb-1">Release Date</label>
          <input type="date" value={book.release_date} onChange={e => set('release_date', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate mb-1">Release Year</label>
          <input type="number" value={book.release_year} onChange={e => set('release_year', e.target.value)} placeholder="e.g. 2023" className={inputCls} />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate mb-1">Tropes (comma-separated)</label>
        <textarea rows={3} value={book.tropes} onChange={e => set('tropes', e.target.value)} className={`${inputCls} resize-y`} />
      </div>

      <div>
        <label className="block text-xs text-slate mb-1">Description</label>
        <textarea rows={5} value={book.description} onChange={e => set('description', e.target.value)} className={`${inputCls} resize-y`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate mb-1">Amazon US URL</label>
          <input type="text" value={book.buy_url_amazon_us} onChange={e => set('buy_url_amazon_us', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate mb-1">Price Amazon US ($)</label>
          <input type="number" step="0.01" value={book.price_amazon_us} onChange={e => set('price_amazon_us', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate mb-1">Amazon IN URL</label>
          <input type="text" value={book.buy_url_amazon_in} onChange={e => set('buy_url_amazon_in', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-slate mb-1">Price Amazon IN (₹)</label>
          <input type="number" step="0.01" value={book.price_amazon_in} onChange={e => set('price_amazon_in', e.target.value)} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-slate mb-1">Flipkart URL</label>
          <input type="text" value={book.buy_url_flipkart} onChange={e => set('buy_url_flipkart', e.target.value)} className={inputCls} />
        </div>
      </div>
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────
export default function BookEditForm() {
  const [mode, setMode] = useState('edit') // 'edit' | 'new'

  // Edit state
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState([])
  const [searching, setSearching] = useState(false)
  const [editBook, setEditBook]   = useState(null)

  // New book state
  const [newBook, setNewBook]     = useState(EMPTY_BOOK)
  const [bookUrl, setBookUrl]     = useState('')
  const [fetching, setFetching]   = useState(false)
  const [fetchError, setFetchError] = useState('')

  // Shared status
  const [status, setStatus]     = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Enrichment queue
  const [pending, setPending]         = useState([])
  const [pendingLoading, setPendingLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/books?pending=1')
      .then(r => r.json())
      .then(d => setPending(d.books ?? []))
      .finally(() => setPendingLoading(false))
  }, [])

  // ── Edit mode helpers ──────────────────────────────────────────────────
  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setResults([])
    setEditBook(null)
    try {
      const res  = await fetch(`/api/admin/books?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      setResults(data.books ?? [])
    } finally {
      setSearching(false)
    }
  }

  function selectBook(b) {
    setEditBook(normaliseBook(b))
    setResults([])
    setStatus(null)
    setErrorMsg('')
    setMode('edit')
  }

  function setEdit(key, value) { setEditBook(b => ({ ...b, [key]: value })) }

  async function handleUpdate(e) {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg('')
    try {
      const res  = await fetch('/api/admin/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(editBook, false)),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus('saved')
      // Refresh pending list
      fetch('/api/admin/books?pending=1').then(r => r.json()).then(d => setPending(d.books ?? []))
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message)
    }
  }

  // ── New book helpers ───────────────────────────────────────────────────
  function setNew(key, value) {
    setNewBook(b => {
      const updated = { ...b, [key]: value }
      // Auto-generate slug from title + author
      if ((key === 'title' || key === 'author') && !b._slugEdited) {
        updated.slug = toSlug(
          key === 'title'  ? value : b.title,
          key === 'author' ? value : b.author,
        )
      }
      if (key === 'slug') updated._slugEdited = true
      return updated
    })
  }

  async function handleFetchUrl() {
    if (!bookUrl.trim()) return
    setFetching(true)
    setFetchError('')
    try {
      const res  = await fetch('/api/admin/fetch-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: bookUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const b = data.book
      setNewBook(prev => ({
        ...prev,
        title:         b.title         ?? prev.title,
        author:        b.author        ?? prev.author,
        slug:          b.title && b.author ? toSlug(b.title, b.author) : prev.slug,
        cover_url:     b.cover_url     ?? prev.cover_url,
        description:   b.description   ?? prev.description,
        series_name:   b.series_name   ?? prev.series_name,
        series_number: b.series_number ?? prev.series_number,
        rating:        b.rating        ?? prev.rating,
        rating_count:  b.rating_count  ?? prev.rating_count,
        genres:        Array.isArray(b.genres) ? b.genres.join(', ') : (b.genres ?? prev.genres),
      }))
      setBookUrl('')
    } catch (err) {
      setFetchError(err.message)
    } finally {
      setFetching(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg('')
    try {
      const res  = await fetch('/api/admin/books', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(newBook, true)),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus('saved')
      setNewBook(EMPTY_BOOK)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-10">

      {/* Mode tabs */}
      <div className="flex gap-1 border border-gray-200 rounded-xl p-1 w-fit">
        {['edit', 'new'].map(m => (
          <button key={m} type="button" onClick={() => { setMode(m); setStatus(null); setErrorMsg('') }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === m ? 'bg-bloom text-white' : 'text-slate hover:bg-petal/10'}`}>
            {m === 'edit' ? 'Edit Book' : 'Add New'}
          </button>
        ))}
      </div>

      {/* Edit mode */}
      {mode === 'edit' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-1">Search Book</label>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Title, author, or slug..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40" />
              <button type="submit" disabled={searching}
                className="px-4 py-2 text-sm bg-bloom text-white rounded-lg hover:bg-bloom/90 transition-colors disabled:opacity-50">
                {searching ? '...' : 'Search'}
              </button>
            </form>
            {results.length > 0 && (
              <ul className="mt-2 border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                {results.map(b => (
                  <li key={b.id}>
                    <button type="button" onClick={() => selectBook(b)}
                      className="w-full text-left px-4 py-3 hover:bg-petal/10 transition-colors">
                      <p className="text-sm font-medium">{b.title}</p>
                      <p className="text-xs text-slate">{b.author}{b.series_name ? ` · ${b.series_name}` : ''}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {editBook && (
            <form onSubmit={handleUpdate} className="space-y-6">
              <p className="text-xs text-slate font-mono bg-gray-50 rounded px-3 py-1.5">id: {editBook.id}</p>
              <BookFields book={editBook} set={setEdit} />
              <div className="flex items-center gap-4 pt-2">
                <button type="submit" disabled={status === 'saving'}
                  className="bg-bloom text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-bloom/90 transition-colors disabled:opacity-60">
                  {status === 'saving' ? 'Saving...' : 'Save Changes'}
                </button>
                {status === 'saved' && <span className="text-sm text-green-600 font-medium">Saved!</span>}
                {status === 'error'  && <span className="text-sm text-red-500">{errorMsg}</span>}
              </div>
            </form>
          )}
        </div>
      )}

      {/* New book mode */}
      {mode === 'new' && (
        <form onSubmit={handleCreate} className="space-y-6">

          {/* Fetch from URL */}
          <div className="bg-petal/10 rounded-xl p-4 space-y-3">
            <label className="block text-sm font-semibold">Import from URL</label>
            <p className="text-xs text-slate">Paste a Goodreads or Amazon book page URL — we&apos;ll prefill the fields below.</p>
            <div className="flex gap-2">
              <input
                type="url"
                value={bookUrl}
                onChange={e => setBookUrl(e.target.value)}
                placeholder="https://www.goodreads.com/book/show/..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40 bg-white"
              />
              <button type="button" onClick={handleFetchUrl} disabled={fetching || !bookUrl.trim()}
                className="px-4 py-2 text-sm bg-bloom text-white rounded-lg hover:bg-bloom/90 transition-colors disabled:opacity-50 whitespace-nowrap">
                {fetching ? 'Fetching...' : 'Import'}
              </button>
            </div>
            {fetchError && <p className="text-xs text-red-500">{fetchError}</p>}
          </div>

          <BookFields book={newBook} set={setNew} />
          <div className="flex items-center gap-4 pt-2">
            <button type="submit" disabled={status === 'saving'}
              className="bg-bloom text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-bloom/90 transition-colors disabled:opacity-60">
              {status === 'saving' ? 'Adding...' : 'Add Book'}
            </button>
            {status === 'saved' && <span className="text-sm text-green-600 font-medium">Book added!</span>}
            {status === 'error'  && <span className="text-sm text-red-500">{errorMsg}</span>}
          </div>
        </form>
      )}

      {/* Needs Enrichment */}
      <div>
        <h2 className="font-serif text-lg font-semibold mb-1">Needs Enrichment</h2>
        <p className="text-xs text-slate mb-4">Top books missing key fields — click to load for editing.</p>
        {pendingLoading && <p className="text-sm text-slate">Loading...</p>}
        {!pendingLoading && pending.length === 0 && (
          <p className="text-sm text-green-600">All good — no books need enrichment.</p>
        )}
        {pending.length > 0 && (
          <ul className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
            {pending.map(b => {
              const missing = missingFields(b)
              return (
                <li key={b.id}>
                  <button type="button" onClick={() => selectBook(b)}
                    className="w-full text-left px-4 py-3 hover:bg-petal/10 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{b.title}</p>
                        <p className="text-xs text-slate">{b.author}{b.series_name ? ` · ${b.series_name}` : ''}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end shrink-0">
                        {missing.map(f => (
                          <span key={f} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

    </div>
  )
}

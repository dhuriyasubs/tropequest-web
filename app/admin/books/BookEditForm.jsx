'use client'
import { useState, useEffect } from 'react'

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40'

const EMPTY_BOOK = {
  title: '', author: '', slug: '', cover_url: '',
  series_name: '', series_number: '', rating: '', rating_count: '', rating_source: '',
  primary_genre: '', secondary_genre: '', genres: '', tropes: '', characters: '', description: '',
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
    genres:            book.genres      ? book.genres.split(',').map(s => s.trim()).filter(Boolean)      : [],
    tropes:            book.tropes      ? book.tropes.split(',').map(s => s.trim()).filter(Boolean)      : [],
    characters:        book.characters  ? book.characters.split(',').map(s => s.trim()).filter(Boolean)  : [],
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
    tropes:        Array.isArray(b.tropes)      ? b.tropes.join(', ')      : (b.tropes      ?? ''),
    genres:        Array.isArray(b.genres)      ? b.genres.join(', ')      : (b.genres      ?? ''),
    characters:    Array.isArray(b.characters)  ? b.characters.join(', ')  : (b.characters  ?? ''),
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
        <label className="block text-xs text-slate mb-1">Characters (comma-separated)</label>
        <input type="text" value={book.characters} onChange={e => set('characters', e.target.value)} className={inputCls} />
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

  // Bulk import state
  const [bulkUrl,      setBulkUrl]      = useState('')
  const [bulkBooks,    setBulkBooks]    = useState([])   // [{ ...bookFields, selected, status, error }]
  const [bulkFetching, setBulkFetching] = useState(false)
  const [bulkError,    setBulkError]    = useState('')
  const [bulkAdding,   setBulkAdding]   = useState(false)

  // Enrichment queue
  const [pending, setPending]         = useState([])
  const [pendingLoading, setPendingLoading] = useState(true)

  // DB stats
  const [stats,        setStats]        = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [activeFilter,    setActiveFilter]    = useState(null)
  const [filteredBooks,   setFilteredBooks]   = useState([])
  const [filteredLoading, setFilteredLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/books?pending=1')
      .then(r => r.json())
      .then(d => setPending(d.books ?? []))
      .finally(() => setPendingLoading(false))
    fetch('/api/admin/books?stats=1')
      .then(r => r.json())
      .then(d => setStats(d))
      .finally(() => setStatsLoading(false))
  }, [])

  async function loadMissing(field) {
    if (activeFilter === field) { setActiveFilter(null); setFilteredBooks([]); return }
    setActiveFilter(field)
    setFilteredLoading(true)
    setFilteredBooks([])
    const res  = await fetch(`/api/admin/books?missing=${field}`)
    const data = await res.json()
    setFilteredBooks(data.books ?? [])
    setFilteredLoading(false)
  }

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

  async function handleFetchUrl(applyTo) {
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
      applyTo(prev => ({
        ...prev,
        title:         b.title         ?? prev.title,
        author:        b.author        ?? prev.author,
        slug:          b.title && b.author ? toSlug(b.title, b.author) : prev.slug,
        cover_url:     b.cover_url     ?? prev.cover_url,
        description:   b.description   ?? prev.description,
        series_name:   b.series_name   ?? prev.series_name,
        series_number: b.series_number ?? prev.series_number,
        primary_genre: b.primary_genre ?? prev.primary_genre,
        genres:        Array.isArray(b.genres) ? b.genres.join(', ') : (b.genres ?? prev.genres),
        release_date:  b.release_date  ?? prev.release_date,
        release_year:  b.release_year  ?? prev.release_year,
        rating:        b.rating        ?? prev.rating,
        rating_count:  b.rating_count  ?? prev.rating_count,
        rating_source: b.rating_source ?? prev.rating_source,
      }))
      setBookUrl('')
    } catch (err) {
      setFetchError(err.message)
    } finally {
      setFetching(false)
    }
  }

  // ── Bulk import helpers ────────────────────────────────────────────────
  async function handleFetchAuthor() {
    if (!bulkUrl.trim()) return
    setBulkFetching(true)
    setBulkError('')
    setBulkBooks([])
    try {
      const isSeries = /goodreads\.com\/series\//.test(bulkUrl)
      const endpoint = isSeries ? '/api/admin/fetch-series' : '/api/admin/fetch-author'
      const res  = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: bulkUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Check which slugs already exist in DB
      const slugs = data.books.map(b => b.slug).join(',')
      const checkRes  = await fetch(`/api/admin/books?slugs=${encodeURIComponent(slugs)}`)
      const checkData = await checkRes.json()
      const dbMap = checkData.books ?? {}

      setBulkBooks(data.books.map(b => {
        const db = dbMap[b.slug]
        if (!db) return { ...b, selected: true, status: 'pending', error: null, _dbStatus: 'new' }
        // Determine which missing DB fields this extraction can fill
        const enrichFields = db.missingFields.filter(f => b[f] != null && b[f] !== '')
        if (enrichFields.length === 0) return { ...b, selected: false, status: 'exists', error: null, _dbStatus: 'exists', _dbId: db.id }
        return { ...b, selected: true, status: 'pending', error: null, _dbStatus: 'enrich', _dbId: db.id, _enrichFields: enrichFields }
      }))
      if (data.has_more) setBulkError(`Showing first page only (${data.books.length} books). Goodreads paginates results.`)
    } catch (err) {
      setBulkError(err.message)
    } finally {
      setBulkFetching(false)
    }
  }

  function toggleBulkBook(idx) {
    setBulkBooks(bs => bs.map((b, i) => i === idx ? { ...b, selected: !b.selected } : b))
  }

  function toggleAllBulk(val) {
    setBulkBooks(bs => bs.map(b => b.status === 'pending' ? { ...b, selected: val } : b))
  }

  async function handleBulkAdd() {
    const toAdd = bulkBooks.filter(b => b.selected && b.status === 'pending')
    if (!toAdd.length) return
    setBulkAdding(true)
    for (const book of toAdd) {
      setBulkBooks(bs => bs.map(b => b.slug === book.slug ? { ...b, status: 'adding' } : b))
      try {
        let res
        if (book._dbStatus === 'enrich') {
          // Only send the fields that were missing in DB and present in extraction
          const patch = { id: book._dbId }
          for (const f of book._enrichFields) patch[f] = book[f] ?? null
          res = await fetch('/api/admin/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
          })
        } else {
          const payload = {
            title:         book.title.trim(),
            author:        book.author.trim(),
            slug:          book.slug.trim(),
            cover_url:     book.cover_url     || null,
            series_name:   book.series_name   || null,
            series_number: book.series_number ?? null,
            rating:        book.rating        ?? null,
            rating_count:  book.rating_count  ?? null,
            rating_source: book.rating_source || null,
            genres:        [],
            tropes:        [],
            characters:    [],
          }
          res = await fetch('/api/admin/books', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        }
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setBulkBooks(bs => bs.map(b => b.slug === book.slug ? { ...b, status: book._dbStatus === 'enrich' ? 'enriched' : 'added' } : b))
      } catch (err) {
        setBulkBooks(bs => bs.map(b => b.slug === book.slug ? { ...b, status: 'error', error: err.message } : b))
      }
    }
    setBulkAdding(false)
    fetch('/api/admin/books?pending=1').then(r => r.json()).then(d => setPending(d.books ?? []))
  }

  async function handleDelete() {
    if (!editBook?.id) return
    if (!window.confirm(`Delete "${editBook.title}"? This cannot be undone.`)) return
    setStatus('saving')
    setErrorMsg('')
    try {
      const res  = await fetch('/api/admin/books', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editBook.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEditBook(null)
      setStatus(null)
      // Refresh pending list
      fetch('/api/admin/books?pending=1').then(r => r.json()).then(d => setPending(d.books ?? []))
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message)
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
        {[['edit', 'Edit Book'], ['new', 'Add New'], ['bulk', 'Bulk Import']].map(([m, label]) => (
          <button key={m} type="button" onClick={() => { setMode(m); setStatus(null); setErrorMsg('') }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === m ? 'bg-bloom text-white' : 'text-slate hover:bg-petal/10'}`}>
            {label}
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

              {/* Import from URL */}
              <div className="bg-petal/10 rounded-xl p-4 space-y-3">
                <label className="block text-sm font-semibold">Import from URL</label>
                <p className="text-xs text-slate">Paste a Goodreads or Amazon URL to overwrite fields below.</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={bookUrl}
                    onChange={e => setBookUrl(e.target.value)}
                    placeholder="https://www.goodreads.com/book/show/..."
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40 bg-white"
                  />
                  <button type="button" onClick={() => handleFetchUrl(setEditBook)} disabled={fetching || !bookUrl.trim()}
                    className="px-4 py-2 text-sm bg-bloom text-white rounded-lg hover:bg-bloom/90 transition-colors disabled:opacity-50 whitespace-nowrap">
                    {fetching ? 'Fetching...' : 'Import'}
                  </button>
                </div>
                {fetchError && <p className="text-xs text-red-500">{fetchError}</p>}
              </div>

              <BookFields book={editBook} set={setEdit} />
              <div className="flex items-center gap-4 pt-2">
                <button type="submit" disabled={status === 'saving'}
                  className="bg-bloom text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-bloom/90 transition-colors disabled:opacity-60">
                  {status === 'saving' ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={handleDelete} disabled={status === 'saving'}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold border border-red-300 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60">
                  Delete
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
              <button type="button" onClick={() => handleFetchUrl(setNewBook)} disabled={fetching || !bookUrl.trim()}
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

      {/* Bulk Import mode */}
      {mode === 'bulk' && (
        <div className="space-y-6">
          <div className="bg-petal/10 rounded-xl p-4 space-y-3">
            <label className="block text-sm font-semibold">Goodreads Author or Series URL</label>
            <p className="text-xs text-slate">Paste a Goodreads author list URL or series page URL to extract all books at once.</p>
            <div className="flex gap-2">
              <input
                type="url"
                value={bulkUrl}
                onChange={e => setBulkUrl(e.target.value)}
                placeholder="https://www.goodreads.com/author/list/... or /series/..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40 bg-white"
              />
              <button type="button" onClick={handleFetchAuthor} disabled={bulkFetching || !bulkUrl.trim()}
                className="px-4 py-2 text-sm bg-bloom text-white rounded-lg hover:bg-bloom/90 transition-colors disabled:opacity-50 whitespace-nowrap">
                {bulkFetching ? 'Fetching...' : 'Extract Books'}
              </button>
            </div>
            {bulkError && <p className="text-xs text-amber-600">{bulkError}</p>}
          </div>

          {bulkBooks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{bulkBooks.length} books found</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => toggleAllBulk(true)}
                    className="text-xs text-bloom underline">Select all</button>
                  <button type="button" onClick={() => toggleAllBulk(false)}
                    className="text-xs text-slate underline">None</button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {bulkBooks.map((book, idx) => (
                  <div key={idx} className={`flex items-center gap-3 px-3 py-2.5 ${
                    book.status === 'added' || book.status === 'enriched' ? 'bg-green-50' :
                    book.status === 'error' ? 'bg-red-50' :
                    book._dbStatus === 'exists' ? 'opacity-50' : ''
                  }`}>
                    <input
                      type="checkbox"
                      checked={book.selected && book.status === 'pending'}
                      disabled={book.status !== 'pending'}
                      onChange={() => toggleBulkBook(idx)}
                      className="shrink-0"
                    />
                    {book.cover_url
                      ? <img src={book.cover_url} alt={book.title} className="w-8 h-12 object-contain rounded shrink-0" />
                      : <div className="w-8 h-12 bg-gray-100 rounded shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{book.title}</p>
                      <p className="text-xs text-slate">
                        {book.series_name ? `${book.series_name} #${book.series_number} · ` : ''}
                        {book.rating ? `★ ${book.rating}` : ''}
                      </p>
                      {book._dbStatus === 'enrich' && book.status === 'pending' && (
                        <p className="text-xs text-amber-600">Enrich: {book._enrichFields.join(', ')}</p>
                      )}
                      {book.status === 'error' && <p className="text-xs text-red-500">{book.error}</p>}
                    </div>
                    <span className={`text-xs shrink-0 font-medium ${
                      book.status === 'added'    ? 'text-green-600' :
                      book.status === 'enriched' ? 'text-green-600' :
                      book.status === 'adding'   ? 'text-bloom' :
                      book.status === 'error'    ? 'text-red-500' :
                      book._dbStatus === 'exists' ? 'text-slate/40' : ''
                    }`}>
                      {book.status === 'added'    ? '✓ Added' :
                       book.status === 'enriched' ? '✓ Enriched' :
                       book.status === 'adding'   ? 'Adding...' :
                       book.status === 'error'    ? '✗ Error' :
                       book._dbStatus === 'exists' ? 'Exists' : ''}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <button type="button" onClick={handleBulkAdd}
                  disabled={bulkAdding || !bulkBooks.some(b => b.selected && b.status === 'pending')}
                  className="bg-bloom text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-bloom/90 transition-colors disabled:opacity-60">
                  {bulkAdding ? 'Working...' : `Add / Enrich Selected (${bulkBooks.filter(b => b.selected && b.status === 'pending').length})`}
                </button>
                {(bulkBooks.some(b => b.status === 'added') || bulkBooks.some(b => b.status === 'enriched')) && (
                  <span className="text-sm text-green-600 font-medium">
                    {bulkBooks.filter(b => b.status === 'added').length > 0 && `${bulkBooks.filter(b => b.status === 'added').length} added`}
                    {bulkBooks.filter(b => b.status === 'added').length > 0 && bulkBooks.filter(b => b.status === 'enriched').length > 0 && ', '}
                    {bulkBooks.filter(b => b.status === 'enriched').length > 0 && `${bulkBooks.filter(b => b.status === 'enriched').length} enriched`}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DB Stats */}
      {(() => {
        const STAT_FIELDS = [
          { key: 'missing_description',     field: 'description',     label: 'Description' },
          { key: 'missing_author',          field: 'author',          label: 'Author' },
          { key: 'missing_cover',           field: 'cover',           label: 'Cover' },
          { key: 'missing_rating',          field: 'rating',          label: 'Rating' },
          { key: 'missing_rating_count',    field: 'rating_count',    label: 'Rating Count' },
          { key: 'missing_rating_source',   field: 'rating_source',   label: 'Rating Source' },
          { key: 'zero_tropes',             field: 'tropes',          label: 'Tropes' },
          { key: 'missing_primary_genre',   field: 'primary_genre',   label: 'Primary Genre' },
          { key: 'missing_secondary_genre', field: 'secondary_genre', label: 'Secondary Genre' },
          { key: 'zero_genres',             field: 'genres',          label: 'Genres' },
          { key: 'missing_isbn',            field: 'isbn',            label: 'ISBN' },
          { key: 'missing_isbn13',          field: 'isbn13',          label: 'ISBN13' },
        ]
        return (
          <div>
            <div className="flex items-baseline gap-3 mb-3">
              <h2 className="font-serif text-lg font-semibold">Database Coverage</h2>
              {stats && <span className="text-xs text-slate">{stats.total.toLocaleString()} books total</span>}
            </div>
            {statsLoading && <p className="text-sm text-slate">Loading stats...</p>}
            {stats && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                {STAT_FIELDS.map(({ key, field, label }) => {
                  const count = stats[key] ?? 0
                  const isActive = activeFilter === field
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => loadMissing(field)}
                      className={`text-left px-3 py-2 rounded-xl border text-xs transition-colors ${
                        count === 0
                          ? 'border-green-200 bg-green-50 text-green-700 cursor-default'
                          : isActive
                            ? 'border-bloom bg-bloom/10 text-bloom font-semibold'
                            : 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400'
                      }`}
                      disabled={count === 0}
                    >
                      <p className="font-medium truncate">{label}</p>
                      <p className="text-base font-bold mt-0.5">{count === 0 ? '✓' : count.toLocaleString()}</p>
                    </button>
                  )
                })}
              </div>
            )}
            {filteredLoading && <p className="text-sm text-slate">Loading books...</p>}
            {!filteredLoading && filteredBooks.length > 0 && (
              <div>
                <p className="text-xs text-slate mb-2">{filteredBooks.length} books missing {activeFilter} — click to edit</p>
                <ul className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden max-h-64 overflow-y-auto">
                  {filteredBooks.map(b => (
                    <li key={b.id}>
                      <button type="button" onClick={() => { selectBook(b); setActiveFilter(null); setFilteredBooks([]) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-petal/10 transition-colors">
                        <p className="text-sm font-medium">{b.title}</p>
                        <p className="text-xs text-slate">{b.author}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })()}

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

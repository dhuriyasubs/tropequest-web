'use client'
import { useState } from 'react'

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40'

export default function BookEditForm() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const [book, setBook]       = useState(null)
  const [status, setStatus]   = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setResults([])
    setBook(null)
    try {
      const res  = await fetch(`/api/admin/books?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      setResults(data.books ?? [])
    } finally {
      setSearching(false)
    }
  }

  function selectBook(b) {
    setBook({
      ...b,
      tropes:  Array.isArray(b.tropes)  ? b.tropes.join(', ')  : (b.tropes ?? ''),
      genres:  Array.isArray(b.genres)  ? b.genres.join(', ')  : (b.genres ?? ''),
      series_number: b.series_number ?? '',
      rating:        b.rating        ?? '',
      rating_count:  b.rating_count  ?? '',
    })
    setResults([])
    setStatus(null)
    setErrorMsg('')
  }

  function set(key, value) {
    setBook(b => ({ ...b, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg('')
    const payload = {
      id:                book.id,
      title:             book.title,
      author:            book.author,
      slug:              book.slug,
      cover_url:         book.cover_url,
      description:       book.description,
      series_name:       book.series_name || null,
      series_number:     book.series_number !== '' ? Number(book.series_number) : null,
      rating:            book.rating        !== '' ? Number(book.rating)        : null,
      rating_count:      book.rating_count  !== '' ? Number(book.rating_count)  : null,
      primary_genre:     book.primary_genre || null,
      genres:            book.genres  ? book.genres.split(',').map(s => s.trim()).filter(Boolean)  : [],
      tropes:            book.tropes  ? book.tropes.split(',').map(s => s.trim()).filter(Boolean)  : [],
      buy_url_amazon_us: book.buy_url_amazon_us || null,
      buy_url_amazon_in: book.buy_url_amazon_in || null,
      buy_url_flipkart:  book.buy_url_flipkart  || null,
      price_amazon_in:   book.price_amazon_in   !== '' ? Number(book.price_amazon_in)   : null,
      price_amazon_us:   book.price_amazon_us   !== '' ? Number(book.price_amazon_us)   : null,
    }
    try {
      const res = await fetch('/api/admin/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus('saved')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message)
    }
  }

  return (
    <div className="space-y-8">
      {/* Search */}
      <div>
        <label className="block text-sm font-semibold mb-1">Search Book</label>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Title, author, or slug..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40"
          />
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

      {/* Edit form */}
      {book && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-xs text-slate font-mono bg-gray-50 rounded px-3 py-1.5">id: {book.id}</p>

          {/* Core fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate mb-1">Title</label>
              <input type="text" value={book.title} onChange={e => set('title', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate mb-1">Author</label>
              <input type="text" value={book.author} onChange={e => set('author', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate mb-1">Slug</label>
              <input type="text" value={book.slug} onChange={e => set('slug', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate mb-1">Cover URL</label>
              <input type="text" value={book.cover_url ?? ''} onChange={e => set('cover_url', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Series */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate mb-1">Series Name</label>
              <input type="text" value={book.series_name ?? ''} onChange={e => set('series_name', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate mb-1">Series #</label>
              <input type="number" value={book.series_number} onChange={e => set('series_number', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Ratings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate mb-1">Rating</label>
              <input type="number" step="0.01" min="0" max="5" value={book.rating} onChange={e => set('rating', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate mb-1">Rating Count</label>
              <input type="number" value={book.rating_count} onChange={e => set('rating_count', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Genre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate mb-1">Primary Genre</label>
              <input type="text" value={book.primary_genre ?? ''} onChange={e => set('primary_genre', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate mb-1">Genres (comma-separated)</label>
              <input type="text" value={book.genres} onChange={e => set('genres', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Tropes */}
          <div>
            <label className="block text-xs text-slate mb-1">Tropes (comma-separated)</label>
            <textarea rows={3} value={book.tropes} onChange={e => set('tropes', e.target.value)} className={`${inputCls} resize-y`} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-slate mb-1">Description</label>
            <textarea rows={5} value={book.description ?? ''} onChange={e => set('description', e.target.value)} className={`${inputCls} resize-y`} />
          </div>

          {/* Buy links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate mb-1">Amazon US URL</label>
              <input type="text" value={book.buy_url_amazon_us ?? ''} onChange={e => set('buy_url_amazon_us', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate mb-1">Price Amazon US ($)</label>
              <input type="number" step="0.01" value={book.price_amazon_us ?? ''} onChange={e => set('price_amazon_us', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate mb-1">Amazon IN URL</label>
              <input type="text" value={book.buy_url_amazon_in ?? ''} onChange={e => set('buy_url_amazon_in', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate mb-1">Price Amazon IN (₹)</label>
              <input type="number" step="0.01" value={book.price_amazon_in ?? ''} onChange={e => set('price_amazon_in', e.target.value)} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate mb-1">Flipkart URL</label>
              <input type="text" value={book.buy_url_flipkart ?? ''} onChange={e => set('buy_url_flipkart', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Submit */}
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
  )
}

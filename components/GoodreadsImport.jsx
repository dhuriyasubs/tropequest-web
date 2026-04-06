'use client'

import { useState, useRef } from 'react'

const STATUS_LABELS = {
  read:    'Read',
  reading: 'Reading',
  unread:  'Want to Read',
}

const GR_STATUS_MAP = {
  'read':              'read',
  'currently-reading': 'reading',
  'to-read':           'unread',
}

// Minimal RFC-4180 CSV parser
function parseCSV(text) {
  const rows = []
  let row = [], field = '', inQuote = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuote) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuote = false
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuote = true
    } else if (ch === ',') {
      row.push(field); field = ''
    } else if (ch === '\n') {
      row.push(field); field = ''
      rows.push(row); row = []
    } else if (ch !== '\r') {
      field += ch
    }
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows
}

function extractBooks(csvText) {
  const rows = parseCSV(csvText)
  if (rows.length < 2) return []

  const header = rows[0].map(h => h.trim())
  const idx = key => header.indexOf(key)

  const iTitle     = idx('Title')
  const iAuthor    = idx('Author')
  const iShelf     = idx('Exclusive Shelf')
  const iISBN      = idx('ISBN')
  const iISBN13    = idx('ISBN13')
  const iGrRating  = idx('Average Rating')

  if (iTitle === -1 || iAuthor === -1 || iShelf === -1) return null // wrong format

  // Goodreads wraps ISBNs in ="..." — strip that
  const cleanISBN = s => s?.replace(/^="?|"?=?$/g, '').replace(/[^0-9X]/gi, '').trim() || null

  // Parse "Title (Series Name, #1)" or "Title (Series, #1; Other, #2)" — take first series only
  const parseSeries = raw => {
    const m = raw.trim().match(/^(.*?)\s*\(([^,)]+),\s*#(\d+(?:\.\d+)?).*\)$/)
    if (!m) return { title: raw.trim(), series_name: null, series_number: null }
    return {
      title:         m[1].trim(),
      series_name:   m[2].trim(),
      series_number: m[3].includes('.') ? parseFloat(m[3]) : parseInt(m[3], 10),
    }
  }

  return rows.slice(1)
    .filter(r => r.length > Math.max(iTitle, iAuthor, iShelf))
    .map(r => {
      const { title, series_name, series_number } = parseSeries(r[iTitle]?.trim() ?? '')
      return {
        title,
        series_name,
        series_number,
        author:    r[iAuthor]?.trim() ?? '',
        status:    GR_STATUS_MAP[r[iShelf]?.trim()] ?? 'unread',
        isbn:      iISBN   >= 0 ? cleanISBN(r[iISBN])   : null,
        isbn13:    iISBN13 >= 0 ? cleanISBN(r[iISBN13]) : null,
        gr_rating: iGrRating >= 0 ? parseFloat(r[iGrRating]) || null : null,
      }
    })
    .filter(b => b.title)
}

export default function GoodreadsImport() {
  const [books, setBooks]       = useState(null)  // parsed rows
  const [parseErr, setParseErr] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const inputRef = useRef()

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    setParseErr(null)

    const reader = new FileReader()
    reader.onload = ev => {
      const extracted = extractBooks(ev.target.result)
      if (extracted === null) {
        setParseErr('This doesn&apos;t look like a Goodreads export. Make sure you upload the CSV from Goodreads → My Books → Import/Export.')
        setBooks(null)
      } else if (extracted.length === 0) {
        setParseErr('No books found in this file.')
        setBooks(null)
      } else {
        setBooks(extracted)
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!books?.length) return
    setLoading(true)
    try {
      const res = await fetch('/api/import/goodreads', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ books }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')
      setResult(data)
      setBooks(null)
    } catch (err) {
      setParseErr(err.message)
    } finally {
      setLoading(false)
    }
  }

  const counts = books
    ? { read: 0, reading: 0, unread: 0, ...books.reduce((acc, b) => { acc[b.status] = (acc[b.status] ?? 0) + 1; return acc }, {}) }
    : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-2">Import from Goodreads</h1>
      <p className="text-slate text-sm mb-8">
        Export your library from Goodreads (My Books → Import/Export → Export Library), then upload the CSV here.
        We&apos;ll match your books and add them to your shelf.
      </p>

      {/* Upload area */}
      {!books && !result && (
        <div
          className="border-2 border-dashed border-petal/50 rounded-2xl p-10 text-center cursor-pointer hover:border-bloom transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <div className="text-4xl mb-3">📂</div>
          <p className="font-semibold text-ink mb-1">Click to upload your Goodreads CSV</p>
          <p className="text-slate text-xs">goodreads_library_export.csv</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      )}

      {parseErr && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {parseErr}
        </div>
      )}

      {/* Preview */}
      {books && (
        <div className="mt-6 space-y-5">
          <div className="bg-blush rounded-2xl p-5">
            <p className="font-semibold text-ink mb-3">{books.length} books found</p>
            <div className="flex gap-4 text-sm">
              {Object.entries(counts).map(([status, n]) => n > 0 && (
                <span key={status} className="text-slate">
                  <span className="font-semibold text-ink">{n}</span> {STATUS_LABELS[status]}
                </span>
              ))}
            </div>
          </div>

          {/* Sample preview */}
          <div>
            <p className="text-xs text-slate mb-2 uppercase tracking-wide font-semibold">Preview (first 5)</p>
            <div className="space-y-2">
              {books.slice(0, 5).map((b, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-sm p-3 bg-white border border-petal/30 rounded-xl">
                  <div className="min-w-0">
                    <p className="font-medium text-ink line-clamp-1">{b.title}</p>
                    <p className="text-slate text-xs">{b.author}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    b.status === 'read'    ? 'bg-green-100 text-green-700' :
                    b.status === 'reading' ? 'bg-blue-100 text-blue-700' :
                                             'bg-petal/30 text-plum'
                  }`}>
                    {STATUS_LABELS[b.status]}
                  </span>
                </div>
              ))}
              {books.length > 5 && (
                <p className="text-xs text-slate text-center pt-1">
                  +{books.length - 5} more books
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={loading}
              className="bg-bloom text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
            >
              {loading ? 'Importing…' : `Import ${books.length} books`}
            </button>
            <button
              onClick={() => { setBooks(null); setParseErr(null); if (inputRef.current) inputRef.current.value = '' }}
              className="text-slate text-sm hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-6">
          <p className="font-serif text-xl font-bold text-green-800 mb-1">Import complete!</p>
          <div className="text-sm text-green-700 space-y-1 mt-3">
            {result.imported > 0 && <p>✓ {result.imported} new book{result.imported !== 1 ? 's' : ''} added to your shelf</p>}
            {result.updated  > 0 && <p>✓ {result.updated} existing book{result.updated !== 1 ? 's' : ''} updated</p>}
            {result.queued > 0 && (
              <p className="text-green-600">
                {result.queued} book{result.queued !== 1 ? 's' : ''} queued for enrichment. We&apos;ll add them to your shelf once processed.
              </p>
            )}
          </div>
          <a
            href="/shelf"
            className="inline-block mt-5 bg-bloom text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm"
          >
            Go to My Shelf
          </a>
        </div>
      )}
    </div>
  )
}

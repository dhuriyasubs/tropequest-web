'use client'
import { useState, useEffect, useRef } from 'react'
import {
  GENRES, GENRE_GROUPS, TROPES, TROPE_GROUPS,
  TIME_PERIODS, TIME_PERIOD_GROUPS, RELATIONSHIP_TYPES,
  KINK_TAGS, STORY_TAGS, CONTENT_WARNINGS, REPRESENTATION,
  SETTING_TAGS, GEOGRAPHY_TAGS,
} from '@/lib/taxonomy'

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40'

const EMPTY_BOOK = {
  title: '', author: '', slug: '', cover_url: '',
  series_name: '', series_number: '', rating: '', rating_count: '', rating_source: '',
  genres: [], tropes: [], time_period: [], relationship_type: [],
  kink_tags: [], story_tags: [], content_warnings: [], representation: [],
  setting_tags: [], geography_tags: [],
  data_source: {},
  characters: '', description: '',
  release_date: '', release_year: '',
  buy_url_amazon_us: '', buy_url_amazon_in: '', buy_url_flipkart: '',
  price_amazon_us: '', price_amazon_in: '',
  spice_rating: '',
}

const SPICE_LABELS = { 1: 'Closed Door', 2: 'Fade to Black', 3: 'Some Steam', 4: 'Steamy', 5: 'Explicit' }

const TRACKED_FIELDS = new Set([
  'description', 'tropes', 'genres', 'time_period', 'relationship_type',
  'kink_tags', 'story_tags', 'content_warnings', 'representation', 'setting_tags', 'geography_tags',
])

const SOURCE_CFG = {
  admin_manual: { label: 'manual', cls: 'bg-gray-100 text-gray-500' },
  admin_url:    { label: 'URL',    cls: 'bg-green-100 text-green-700' },
  pipeline:     { label: 'AI',     cls: 'bg-blue-100 text-blue-700' },
  import:       { label: 'import', cls: 'bg-orange-100 text-orange-700' },
}
function SourceBadge({ source }) {
  if (!source || !SOURCE_CFG[source]) return null
  const { label, cls } = SOURCE_CFG[source]
  return <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cls}`}>{label}</span>
}

function missingFields(b) {
  const missing = []
  if (!b.description)                                    missing.push('description')
  if (!b.cover_url)                                      missing.push('cover')
  if (!b.tropes || b.tropes.length === 0)                missing.push('tropes')
  if (!b.buy_url_amazon_us && !b.buy_url_amazon_in)      missing.push('buy links')
  if (!b.genres || b.genres.length === 0)                missing.push('genres')
  return missing
}

function TagPicker({ label, field, options, groups, value = [], onChange, badge }) {
  const [open, setOpen]           = useState(false)
  const [search, setSearch]       = useState('')
  const [customOpts, setCustomOpts] = useState([])
  const ref = useRef(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(`taxonomy_custom_${field}`) || '[]')
      setCustomOpts(stored)
    } catch { setCustomOpts([]) }
  }, [field])

  useEffect(() => {
    function onOut(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [])

  const allOpts = [...options, ...customOpts.filter(c => !options.includes(c))]
  const lc      = search.toLowerCase()
  const filtered = lc ? allOpts.filter(o => o.toLowerCase().includes(lc)) : allOpts
  const canAdd   = search.trim() && !allOpts.some(o => o.toLowerCase() === search.trim().toLowerCase())

  function toggle(opt) {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])
  }

  function addToTaxonomy() {
    const val = search.trim()
    if (!val) return
    const next = [...customOpts, val]
    setCustomOpts(next)
    localStorage.setItem(`taxonomy_custom_${field}`, JSON.stringify(next))
    if (!value.includes(val)) onChange([...value, val])
    setSearch('')
  }

  function renderOpt(opt) {
    const selected = value.includes(opt)
    return (
      <button key={opt} type="button" onClick={() => toggle(opt)}
        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-petal/20 flex items-center gap-2 ${selected ? 'text-bloom font-medium' : 'text-ink'}`}>
        <span className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center text-[10px] ${selected ? 'bg-bloom border-bloom text-white' : 'border-gray-300'}`}>
          {selected ? '✓' : ''}
        </span>
        {opt}
      </button>
    )
  }

  return (
    <div ref={ref} className="relative">
      <label className="flex items-center gap-1.5 text-xs text-slate mb-1">{label}{badge}</label>
      <div
        className="min-h-[38px] flex flex-wrap gap-1 border border-gray-200 rounded-lg px-2 py-1.5 cursor-text focus-within:ring-2 focus-within:ring-bloom/40"
        onClick={() => setOpen(true)}
      >
        {value.map(v => (
          <span key={v} className="flex items-center gap-1 bg-bloom/10 text-bloom text-xs px-2 py-0.5 rounded-full">
            {v}
            <button type="button" onClick={e => { e.stopPropagation(); toggle(v) }} className="hover:text-red-500 leading-none">×</button>
          </span>
        ))}
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? `Select ${label.toLowerCase()}...` : ''}
          className="flex-1 min-w-[100px] outline-none text-sm bg-transparent"
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {canAdd && (
            <button type="button" onClick={addToTaxonomy}
              className="w-full text-left px-3 py-2 text-sm text-bloom font-medium border-b border-gray-100 hover:bg-petal/10">
              + Add &ldquo;{search.trim()}&rdquo; to taxonomy
            </button>
          )}
          {groups && !lc
            ? Object.entries(groups).map(([gName, gOpts]) => {
                const opts = gOpts.filter(o => allOpts.includes(o))
                if (!opts.length) return null
                return (
                  <div key={gName}>
                    <p className="text-[11px] text-slate/50 px-3 pt-2 pb-0.5 font-semibold uppercase tracking-wide">{gName}</p>
                    {opts.map(renderOpt)}
                  </div>
                )
              })
            : filtered.map(renderOpt)
          }
          {filtered.length === 0 && !canAdd && (
            <p className="px-3 py-2 text-xs text-slate">No matches</p>
          )}
        </div>
      )}
    </div>
  )
}

function toSlug(title, author) {
  return `${title}-${author}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function normalizeAuthor(raw) {
  return (raw ?? '')
    .replace(/[\u00a0\u200b\u200c\u200d\ufeff]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/(^|[^a-z0-9])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase())
}

function buildPayload(book, isNew) {
  return {
    ...(!isNew && { id: book.id }),
    title:             book.title.trim(),
    author:            normalizeAuthor(book.author),
    slug:              book.slug.trim(),
    cover_url:         book.cover_url         || null,
    description:       book.description       || null,
    series_name:       book.series_name       || null,
    series_number:     book.series_number !== '' ? Number(book.series_number) : null,
    rating:            book.rating        !== '' ? Number(book.rating)        : null,
    rating_count:      book.rating_count  !== '' ? Number(book.rating_count)  : null,
    rating_source:     book.rating_source || null,
    release_date:      book.release_date    || null,
    release_year:      book.release_year !== '' ? Number(book.release_year) : null,
    genres:            Array.isArray(book.genres)            ? book.genres            : [],
    tropes:            Array.isArray(book.tropes)            ? book.tropes            : [],
    time_period:       Array.isArray(book.time_period)       ? book.time_period       : [],
    relationship_type: Array.isArray(book.relationship_type) ? book.relationship_type : [],
    kink_tags:         Array.isArray(book.kink_tags)         ? book.kink_tags         : [],
    story_tags:        Array.isArray(book.story_tags)        ? book.story_tags        : [],
    content_warnings:  Array.isArray(book.content_warnings)  ? book.content_warnings  : [],
    representation:    Array.isArray(book.representation)    ? book.representation    : [],
    setting_tags:      Array.isArray(book.setting_tags)      ? book.setting_tags      : [],
    geography_tags:    Array.isArray(book.geography_tags)    ? book.geography_tags    : [],
    characters:        book.characters ? book.characters.split(',').map(s => s.trim()).filter(Boolean) : [],
    buy_url_amazon_us: book.buy_url_amazon_us || null,
    buy_url_amazon_in: book.buy_url_amazon_in || null,
    buy_url_flipkart:  book.buy_url_flipkart  || null,
    price_amazon_in:   book.price_amazon_in  !== '' ? Number(book.price_amazon_in)  : null,
    price_amazon_us:   book.price_amazon_us  !== '' ? Number(book.price_amazon_us)  : null,
    spice_rating:      book.spice_rating     !== '' ? Number(book.spice_rating)     : null,
    data_source:       book.data_source      ?? {},
  }
}

function normaliseBook(b) {
  return {
    ...b,
    tropes:            Array.isArray(b.tropes)            ? b.tropes            : [],
    genres:            Array.isArray(b.genres)            ? b.genres            : [],
    time_period:       Array.isArray(b.time_period)       ? b.time_period       : [],
    relationship_type: Array.isArray(b.relationship_type) ? b.relationship_type : [],
    kink_tags:         Array.isArray(b.kink_tags)         ? b.kink_tags         : [],
    story_tags:        Array.isArray(b.story_tags)        ? b.story_tags        : [],
    content_warnings:  Array.isArray(b.content_warnings)  ? b.content_warnings  : [],
    representation:    Array.isArray(b.representation)    ? b.representation    : [],
    setting_tags:      Array.isArray(b.setting_tags)      ? b.setting_tags      : [],
    geography_tags:    Array.isArray(b.geography_tags)    ? b.geography_tags    : [],
    characters:    Array.isArray(b.characters) ? b.characters.join(', ')  : (b.characters  ?? ''),
    series_number: b.series_number ?? '',
    rating:        b.rating        ?? '',
    rating_count:  b.rating_count  ?? '',
    rating_source: b.rating_source ?? '',
    cover_url:     b.cover_url     ?? '',
    description:   b.description   ?? '',
    series_name:   b.series_name   ?? '',
    release_date:    b.release_date    ?? '',
    release_year:    b.release_year    ?? '',
    buy_url_amazon_us: b.buy_url_amazon_us ?? '',
    buy_url_amazon_in: b.buy_url_amazon_in ?? '',
    buy_url_flipkart:  b.buy_url_flipkart  ?? '',
    price_amazon_us:   b.price_amazon_us   ?? '',
    price_amazon_in:   b.price_amazon_in   ?? '',
    spice_rating:      b.spice_rating      ?? '',
    data_source:       b.data_source       ?? {},
  }
}

// ── Tag splitter ──────────────────────────────────────────────────────────
const SPLITTER_FIELD_MAP = [
  ['genres',            GENRES],
  ['tropes',            TROPES],
  ['time_period',       TIME_PERIODS],
  ['relationship_type', RELATIONSHIP_TYPES],
  ['kink_tags',         KINK_TAGS],
  ['story_tags',        STORY_TAGS],
  ['content_warnings',  CONTENT_WARNINGS],
  ['representation',    REPRESENTATION],
  ['setting_tags',      SETTING_TAGS],
  ['geography_tags',    GEOGRAPHY_TAGS],
]
const SPLITTER_FIELD_LABELS = {
  genres: 'Genres', tropes: 'Tropes', time_period: 'Time Period',
  relationship_type: 'Relationship Type', kink_tags: 'Kink Tags',
  story_tags: 'Story Tags', content_warnings: 'Content Warnings',
  representation: 'Representation', setting_tags: 'Setting Tags',
  geography_tags: 'Geography Tags',
}

function TagSplitter({ book, set }) {
  const [raw, setRaw]       = useState('')
  const [result, setResult] = useState(null)

  function parse() {
    const tokens = raw.split(/[\n,]+/).map(t => t.trim()).filter(Boolean)
    const matched = {}
    const unmatched = []
    for (const token of tokens) {
      const lc = token.toLowerCase()
      let found = false
      for (const [field, opts] of SPLITTER_FIELD_MAP) {
        const canonical = opts.find(o => o.toLowerCase() === lc)
        if (canonical) {
          if (!matched[field]) matched[field] = []
          if (!matched[field].includes(canonical)) matched[field].push(canonical)
          found = true
          break
        }
      }
      if (!found) unmatched.push(token)
    }
    setResult({ matched, unmatched })
  }

  function apply() {
    if (!result) return
    for (const [field, tags] of Object.entries(result.matched)) {
      const existing = Array.isArray(book[field]) ? book[field] : []
      set(field, [...new Set([...existing, ...tags])])
    }
    setRaw('')
    setResult(null)
  }

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
      <label className="block text-sm font-semibold">Paste Tags</label>
      <p className="text-xs text-slate">Comma or newline separated — matched tags are routed to the right fields automatically.</p>
      <textarea
        rows={3}
        value={raw}
        onChange={e => { setRaw(e.target.value); setResult(null) }}
        placeholder="enemies to lovers, dark romance, slow burn, ..."
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40 bg-white resize-y"
      />
      <button type="button" onClick={parse} disabled={!raw.trim()}
        className="px-4 py-2 text-sm bg-bloom text-white rounded-lg hover:bg-bloom/90 transition-colors disabled:opacity-50">
        Parse Tags
      </button>
      {result && (
        <div className="space-y-2 pt-1">
          {Object.entries(result.matched).map(([field, tags]) => (
            <p key={field} className="text-xs">
              <span className="font-semibold text-green-700">{SPLITTER_FIELD_LABELS[field]}:</span>{' '}
              <span className="text-green-600">{tags.join(', ')}</span>
            </p>
          ))}
          {result.unmatched.length > 0 && (
            <p className="text-xs">
              <span className="font-semibold text-amber-700">Unmatched:</span>{' '}
              <span className="text-amber-600">{result.unmatched.join(', ')}</span>
            </p>
          )}
          {Object.keys(result.matched).length > 0 && (
            <button type="button" onClick={apply}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Apply to Fields
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Shared book fields ────────────────────────────────────────────────────
function BookFields({ book, set }) {
  return (
    <div className="space-y-6">
      <TagSplitter book={book} set={set} />
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

      <div>
        <label className="block text-xs text-slate mb-2">Spice Rating</label>
        <div className="flex items-center gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => set('spice_rating', book.spice_rating === n ? '' : n)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                Number(book.spice_rating) === n
                  ? 'bg-red-50 border-red-400 text-red-700 font-semibold'
                  : 'border-gray-200 text-slate hover:border-red-300'
              }`}
            >
              {'🌶️'.repeat(n)} <span className="text-xs">{SPICE_LABELS[n]}</span>
            </button>
          ))}
          {book.spice_rating !== '' && (
            <button type="button" onClick={() => set('spice_rating', '')} className="text-xs text-slate underline">Clear</button>
          )}
        </div>
      </div>

      <TagPicker
        label="Genres"
        field="genres"
        options={GENRES}
        groups={GENRE_GROUPS}
        value={book.genres}
        onChange={v => set('genres', v)}
        badge={<SourceBadge source={book.data_source?.genres} />}
      />

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

      <TagPicker
        label="Tropes"
        field="tropes"
        options={TROPES}
        groups={TROPE_GROUPS}
        value={book.tropes}
        onChange={v => set('tropes', v)}
        badge={<SourceBadge source={book.data_source?.tropes} />}
      />

      <TagPicker
        label="Time Period"
        field="time_period"
        options={TIME_PERIODS}
        groups={TIME_PERIOD_GROUPS}
        value={book.time_period}
        onChange={v => set('time_period', v)}
        badge={<SourceBadge source={book.data_source?.time_period} />}
      />

      <TagPicker
        label="Relationship Type"
        field="relationship_type"
        options={RELATIONSHIP_TYPES}
        value={book.relationship_type}
        onChange={v => set('relationship_type', v)}
        badge={<SourceBadge source={book.data_source?.relationship_type} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TagPicker
          label="Setting Tags"
          field="setting_tags"
          options={SETTING_TAGS}
          value={book.setting_tags}
          onChange={v => set('setting_tags', v)}
          badge={<SourceBadge source={book.data_source?.setting_tags} />}
        />
        <TagPicker
          label="Geography Tags"
          field="geography_tags"
          options={GEOGRAPHY_TAGS}
          value={book.geography_tags}
          onChange={v => set('geography_tags', v)}
          badge={<SourceBadge source={book.data_source?.geography_tags} />}
        />
      </div>

      <TagPicker
        label="Story Tags"
        field="story_tags"
        options={STORY_TAGS}
        value={book.story_tags}
        onChange={v => set('story_tags', v)}
        badge={<SourceBadge source={book.data_source?.story_tags} />}
      />

      <TagPicker
        label="Content Warnings"
        field="content_warnings"
        options={CONTENT_WARNINGS}
        value={book.content_warnings}
        onChange={v => set('content_warnings', v)}
        badge={<SourceBadge source={book.data_source?.content_warnings} />}
      />

      <TagPicker
        label="Representation"
        field="representation"
        options={REPRESENTATION}
        value={book.representation}
        onChange={v => set('representation', v)}
        badge={<SourceBadge source={book.data_source?.representation} />}
      />

      <TagPicker
        label="Kink Tags"
        field="kink_tags"
        options={KINK_TAGS}
        value={book.kink_tags}
        onChange={v => set('kink_tags', v)}
        badge={<SourceBadge source={book.data_source?.kink_tags} />}
      />

      <div>
        <label className="block text-xs text-slate mb-1">Characters (comma-separated)</label>
        <input type="text" value={book.characters} onChange={e => set('characters', e.target.value)} className={inputCls} />
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs text-slate mb-1">
          Description <SourceBadge source={book.data_source?.description} />
        </label>
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

  function setEdit(key, value) {
    setEditBook(b => {
      const next = { ...b, [key]: value }
      if (TRACKED_FIELDS.has(key)) {
        const hasVal = Array.isArray(value) ? value.length > 0 : Boolean(value)
        const ds = { ...(b.data_source || {}) }
        if (hasVal) ds[key] = 'admin_manual'; else delete ds[key]
        next.data_source = ds
      }
      return next
    })
  }

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
      if ((key === 'title' || key === 'author') && !b._slugEdited) {
        updated.slug = toSlug(
          key === 'title'  ? value : b.title,
          key === 'author' ? value : b.author,
        )
      }
      if (key === 'slug') updated._slugEdited = true
      if (TRACKED_FIELDS.has(key)) {
        const hasVal = Array.isArray(value) ? value.length > 0 : Boolean(value)
        const ds = { ...(b.data_source || {}) }
        if (hasVal) ds[key] = 'admin_manual'; else delete ds[key]
        updated.data_source = ds
      }
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
      applyTo(prev => {
        const ds = { ...(prev.data_source || {}) }
        if (b.description)          ds.description = 'admin_url'
        if (b.genres?.length)       ds.genres      = 'admin_url'
        if (b.tropes?.length)       ds.tropes      = 'admin_url'
        return {
          ...prev,
          title:         b.title         ?? prev.title,
          author:        b.author        ?? prev.author,
          slug:          b.title && b.author ? toSlug(b.title, b.author) : prev.slug,
          cover_url:     b.cover_url     ?? prev.cover_url,
          description:   b.description   ?? prev.description,
          series_name:   b.series_name   ?? prev.series_name,
          series_number: b.series_number ?? prev.series_number,
          genres:        Array.isArray(b.genres) ? b.genres : (b.genres ? [b.genres] : prev.genres),
          release_date:  b.release_date  ?? prev.release_date,
          release_year:  b.release_year  ?? prev.release_year,
          rating:        b.rating        ?? prev.rating,
          rating_count:  b.rating_count  ?? prev.rating_count,
          rating_source: b.rating_source ?? prev.rating_source,
          data_source:   ds,
        }
      })
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
          // Slug mismatch: book exists under different slug → look it up and enrich
          if (res.status === 409) {
            const searchRes  = await fetch(`/api/admin/books?q=${encodeURIComponent(book.title.trim())}`)
            const searchData = await searchRes.json()
            const existing   = (searchData.books ?? []).find(
              b => b.title.toLowerCase() === book.title.trim().toLowerCase() &&
                   b.author.toLowerCase() === book.author.trim().toLowerCase()
            )
            if (existing) {
              const ENRICHABLE = ['cover_url', 'rating', 'rating_count', 'rating_source', 'series_name', 'series_number']
              const patch = { id: existing.id }
              for (const f of ENRICHABLE) {
                if ((existing[f] == null || existing[f] === '') && book[f] != null && book[f] !== '') {
                  patch[f] = book[f]
                }
              }
              if (Object.keys(patch).length > 1) {
                res = await fetch('/api/admin/books', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(patch),
                })
                const d = await res.json()
                if (!res.ok) throw new Error(d.error)
                setBulkBooks(bs => bs.map(b => b.slug === book.slug ? { ...b, status: 'enriched' } : b))
              } else {
                setBulkBooks(bs => bs.map(b => b.slug === book.slug ? { ...b, status: 'exists' } : b))
              }
              continue
            } else {
              throw new Error('Already exists (slug mismatch, could not locate)')
            }
          }
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
                        {book.series_name ? `${book.series_name}${book.series_number != null ? ` #${book.series_number}` : ''} · ` : ''}
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
          { key: 'zero_tropes',             field: 'tropes',            label: 'Tropes' },
          { key: 'zero_genres',             field: 'genres',            label: 'Genres' },
          { key: 'zero_time_period',        field: 'time_period',       label: 'Time Period' },
          { key: 'zero_relationship_type',  field: 'relationship_type', label: 'Relationship' },
          { key: 'zero_story_tags',         field: 'story_tags',        label: 'Story Tags' },
          { key: 'zero_content_warnings',   field: 'content_warnings',  label: 'Content Warnings' },
          { key: 'zero_representation',     field: 'representation',    label: 'Representation' },
          { key: 'zero_setting_tags',       field: 'setting_tags',      label: 'Setting' },
          { key: 'zero_geography_tags',     field: 'geography_tags',    label: 'Geography' },
          { key: 'missing_isbn',            field: 'isbn',              label: 'ISBN' },
          { key: 'missing_isbn13',          field: 'isbn13',            label: 'ISBN13' },
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

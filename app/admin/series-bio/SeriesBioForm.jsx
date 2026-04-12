'use client'
import { useState, useEffect } from 'react'

const EMPTY_ENTRY    = { number: '', title: '', format: '', focus: '' }
const EMPTY_EXPECT   = { label: '', text: '' }
const EMPTY_TABLE    = { title: '', columns: ['', '', ''], rows: [['', '', '']] }
const EMPTY_BIO = {
  intro: '',
  reading_order_note: '',
  format_header: '',
  focus_header: '',
  reading_order: [{ ...EMPTY_ENTRY }],
  what_to_expect: [{ ...EMPTY_EXPECT }],
  comparison_tables: [],
  reading_tip: '',
}

export default function SeriesBioForm({ seriesList }) {
  const [seriesName, setSeriesName] = useState('')
  const [bio, setBio]               = useState(EMPTY_BIO)
  const [status, setStatus]         = useState(null)
  const [errorMsg, setErrorMsg]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [pasteText, setPasteText]   = useState('')
  const [parsing, setParsing]       = useState(false)
  const [parseError, setParseError] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/series-bio?pending=1')
      .then(r => r.json())
      .then(d => setSuggestions(d.suggestions ?? []))
      .finally(() => setSuggestionsLoading(false))
  }, [])

  async function handleParse() {
    if (!pasteText.trim()) return
    setParsing(true)
    setParseError('')
    try {
      const res  = await fetch('/api/admin/parse-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'series', content: pasteText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBio({
        intro:               data.bio.intro               ?? '',
        reading_order_note:  data.bio.reading_order_note  ?? '',
        format_header:       data.bio.format_header        ?? '',
        focus_header:        data.bio.focus_header         ?? '',
        reading_order:       data.bio.reading_order?.length  ? data.bio.reading_order  : [{ ...EMPTY_ENTRY }],
        what_to_expect:      data.bio.what_to_expect?.length ? data.bio.what_to_expect : [{ ...EMPTY_EXPECT }],
        comparison_tables:   data.bio.comparison_tables   ?? [],
        reading_tip:         data.bio.reading_tip          ?? '',
      })
      setPasteText('')
    } catch (err) {
      setParseError(err.message)
    } finally {
      setParsing(false)
    }
  }

  // ── Reading order helpers ────────────────────────────────────────────────
  function setEntry(i, key, value) {
    setBio(b => ({ ...b, reading_order: b.reading_order.map((e, idx) => idx === i ? { ...e, [key]: value } : e) }))
  }
  function addEntry()      { setBio(b => ({ ...b, reading_order: [...b.reading_order, { ...EMPTY_ENTRY }] })) }
  function removeEntry(i)  { setBio(b => ({ ...b, reading_order: b.reading_order.filter((_, idx) => idx !== i) })) }

  // ── What to expect helpers ───────────────────────────────────────────────
  function setExpect(i, key, value) {
    setBio(b => ({ ...b, what_to_expect: b.what_to_expect.map((e, idx) => idx === i ? { ...e, [key]: value } : e) }))
  }
  function addExpect()      { setBio(b => ({ ...b, what_to_expect: [...b.what_to_expect, { ...EMPTY_EXPECT }] })) }
  function removeExpect(i)  { setBio(b => ({ ...b, what_to_expect: b.what_to_expect.filter((_, idx) => idx !== i) })) }
  function moveExpect(i, dir) {
    setBio(b => {
      const arr = [...b.what_to_expect]
      const j = i + dir
      if (j < 0 || j >= arr.length) return b
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...b, what_to_expect: arr }
    })
  }

  // ── Comparison table helpers ─────────────────────────────────────────────
  function addTable() { setBio(b => ({ ...b, comparison_tables: [...(b.comparison_tables ?? []), { ...EMPTY_TABLE, columns: ['', '', ''], rows: [['', '', '']] }] })) }
  function removeTable(ti) { setBio(b => ({ ...b, comparison_tables: b.comparison_tables.filter((_, i) => i !== ti) })) }
  function setTableTitle(ti, val) {
    setBio(b => { const arr = [...b.comparison_tables]; arr[ti] = { ...arr[ti], title: val }; return { ...b, comparison_tables: arr } })
  }
  function setTableCol(ti, ci, val) {
    setBio(b => { const arr = [...b.comparison_tables]; const cols = [...arr[ti].columns]; cols[ci] = val; arr[ti] = { ...arr[ti], columns: cols }; return { ...b, comparison_tables: arr } })
  }
  function addTableCol(ti) {
    setBio(b => { const arr = [...b.comparison_tables]; const t = arr[ti]; arr[ti] = { ...t, columns: [...t.columns, ''], rows: t.rows.map(r => [...r, '']) }; return { ...b, comparison_tables: arr } })
  }
  function removeTableCol(ti, ci) {
    setBio(b => { const arr = [...b.comparison_tables]; const t = arr[ti]; arr[ti] = { ...t, columns: t.columns.filter((_, i) => i !== ci), rows: t.rows.map(r => r.filter((_, i) => i !== ci)) }; return { ...b, comparison_tables: arr } })
  }
  function setTableCell(ti, ri, ci, val) {
    setBio(b => { const arr = [...b.comparison_tables]; const rows = arr[ti].rows.map((r, idx) => idx === ri ? r.map((c, i) => i === ci ? val : c) : r); arr[ti] = { ...arr[ti], rows }; return { ...b, comparison_tables: arr } })
  }
  function addTableRow(ti) {
    setBio(b => { const arr = [...b.comparison_tables]; const t = arr[ti]; arr[ti] = { ...t, rows: [...t.rows, t.columns.map(() => '')] }; return { ...b, comparison_tables: arr } })
  }
  function removeTableRow(ti, ri) {
    setBio(b => { const arr = [...b.comparison_tables]; arr[ti] = { ...arr[ti], rows: arr[ti].rows.filter((_, i) => i !== ri) }; return { ...b, comparison_tables: arr } })
  }

  async function loadExisting() {
    if (!seriesName.trim()) return
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/series-bio?series=${encodeURIComponent(seriesName.trim())}`)
      const { bio: existing } = await res.json()
      if (existing) {
        setBio({
          intro:               existing.intro ?? '',
          reading_order_note:  existing.reading_order_note ?? '',
          format_header:       existing.format_header ?? '',
          focus_header:        existing.focus_header ?? '',
          reading_order:       existing.reading_order?.length ? existing.reading_order : [{ ...EMPTY_ENTRY }],
          what_to_expect:      existing.what_to_expect?.length ? existing.what_to_expect : [{ ...EMPTY_EXPECT }],
          comparison_tables:   existing.comparison_tables ?? [],
          reading_tip:         existing.reading_tip ?? '',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadByName(name) {
    setSeriesName(name)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/series-bio?series=${encodeURIComponent(name.trim())}`)
      const { bio: existing } = await res.json()
      setBio(existing ? {
        intro:               existing.intro ?? '',
        reading_order_note:  existing.reading_order_note ?? '',
        format_header:       existing.format_header ?? '',
        focus_header:        existing.focus_header ?? '',
        reading_order:       existing.reading_order?.length ? existing.reading_order : [{ ...EMPTY_ENTRY }],
        what_to_expect:      existing.what_to_expect?.length ? existing.what_to_expect : [{ ...EMPTY_EXPECT }],
        comparison_tables:   existing.comparison_tables ?? [],
        reading_tip:         existing.reading_tip ?? '',
      } : EMPTY_BIO)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg('')
    const cleanBio = {
      ...bio,
      reading_order:  bio.reading_order.filter(e => e.number || e.focus),
      what_to_expect: bio.what_to_expect.filter(e => e.label && e.text),
    }
    try {
      const res = await fetch('/api/admin/series-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ series_name: seriesName, bio: cleanBio }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus('saved')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40'

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Series name */}
      <div>
        <label className="block text-sm font-semibold mb-1">Series Name</label>
        <div className="flex gap-2">
          <input
            list="series-list"
            value={seriesName}
            onChange={e => setSeriesName(e.target.value)}
            onBlur={loadExisting}
            placeholder="e.g. A Court of Thorns and Roses"
            required
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40"
          />
          <datalist id="series-list">
            {seriesList.map(s => <option key={s} value={s} />)}
          </datalist>
          <button type="button" onClick={loadExisting} disabled={loading}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-petal/10 transition-colors">
            {loading ? '...' : 'Load'}
          </button>
        </div>
      </div>

      {/* Paste & parse */}
      <div className="bg-petal/10 rounded-xl p-4 space-y-3">
        <label className="block text-sm font-semibold">Paste raw content</label>
        <p className="text-xs text-slate">Paste any text about the series — we&apos;ll extract and pre-fill all the fields below.</p>
        <textarea
          rows={5}
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          placeholder="Paste series overview, reading order guide, blog post, etc..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40 resize-y bg-white"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleParse}
            disabled={parsing || !pasteText.trim()}
            className="bg-bloom text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-bloom/90 transition-colors disabled:opacity-50"
          >
            {parsing ? 'Parsing...' : 'Parse & prefill'}
          </button>
          {parseError && <span className="text-xs text-red-500">{parseError}</span>}
        </div>
      </div>

      {/* Intro */}
      <div>
        <label className="block text-sm font-semibold mb-1">Intro</label>
        <textarea rows={4} value={bio.intro} onChange={e => setBio(b => ({ ...b, intro: e.target.value }))}
          placeholder="Overview of the series — plot, tone, why it matters..."
          className={`${inputCls} resize-y`} />
      </div>

      {/* Reading order */}
      <div>
        <label className="block text-sm font-semibold mb-1">Reading Order Note</label>
        <input type="text" value={bio.reading_order_note}
          onChange={e => setBio(b => ({ ...b, reading_order_note: e.target.value }))}
          placeholder="e.g. Most books follow a linear timeline, but..."
          className={inputCls} />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-3">Reading Order (per book)</label>
        <div className="space-y-3">
          {bio.reading_order.map((entry, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate">Book {i + 1}</span>
                {bio.reading_order.length > 1 && (
                  <button type="button" onClick={() => removeEntry(i)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate mb-1">Reading # (position)</label>
                  <input type="number" value={entry.number}
                    onChange={e => setEntry(i, 'number', e.target.value)}
                    placeholder="1"
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate mb-1">Format</label>
                  <input type="text" list="format-options" value={entry.format}
                    onChange={e => setEntry(i, 'format', e.target.value)}
                    placeholder="Novel, Novella..."
                    className={inputCls} />
                  <datalist id="format-options">
                    <option>Novel</option>
                    <option>Novella</option>
                    <option>Short Story</option>
                    <option>Prequel</option>
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate mb-1">Title</label>
                <input type="text" value={entry.title ?? ''}
                  onChange={e => setEntry(i, 'title', e.target.value)}
                  placeholder="Book title"
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-slate mb-1">Focus / Characters</label>
                <input type="text" value={entry.focus}
                  onChange={e => setEntry(i, 'focus', e.target.value)}
                  placeholder="One-line description of what this book focuses on..."
                  className={inputCls} />
              </div>
            </div>
          ))}
          <button type="button" onClick={addEntry} className="text-sm text-bloom hover:underline">+ Add book</button>
        </div>
        {/* Column header overrides */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <label className="block text-xs text-slate mb-1">Format column header (default: &quot;Format&quot;)</label>
            <input type="text" value={bio.format_header ?? ''}
              onChange={e => setBio(b => ({ ...b, format_header: e.target.value }))}
              placeholder="Format"
              className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-slate mb-1">Focus column header (default: &quot;Focus&quot;)</label>
            <input type="text" value={bio.focus_header ?? ''}
              onChange={e => setBio(b => ({ ...b, focus_header: e.target.value }))}
              placeholder="Focus"
              className={inputCls} />
          </div>
        </div>
      </div>

      {/* What to expect */}
      <div>
        <div className="space-y-3">
          {bio.what_to_expect.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate">Section {i + 1}</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => moveExpect(i, -1)} disabled={i === 0}
                    className="text-xs text-slate hover:text-ink disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => moveExpect(i, 1)} disabled={i === bio.what_to_expect.length - 1}
                    className="text-xs text-slate hover:text-ink disabled:opacity-30">↓</button>
                  {bio.what_to_expect.length > 1 && (
                    <button type="button" onClick={() => removeExpect(i)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                  )}
                </div>
              </div>
              <input type="text" value={item.label}
                onChange={e => setExpect(i, 'label', e.target.value)}
                placeholder="e.g. The World Building"
                className={inputCls} />
              <textarea rows={4} value={item.text}
                onChange={e => setExpect(i, 'text', e.target.value)}
                placeholder="Description... (newlines preserved — use them for bullet-style entries)"
                className={`${inputCls} resize-y`} />
            </div>
          ))}
          <button type="button" onClick={addExpect} className="text-sm text-bloom hover:underline">+ Add section</button>
        </div>
      </div>

      {/* Comparison tables */}
      <div className="space-y-4">
        {(bio.comparison_tables ?? []).map((table, ti) => (
          <div key={ti} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate">Comparison Table {ti + 1}</span>
              <button type="button" onClick={() => removeTable(ti)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
            </div>
            {/* Table title */}
            <input type="text" value={table.title}
              onChange={e => setTableTitle(ti, e.target.value)}
              placeholder="Table heading, e.g. The Two Series Explained"
              className={inputCls} />
            {/* Column headers */}
            <div className="space-y-1">
              <span className="text-xs text-slate font-medium">Column headers</span>
              <div className="flex gap-2 flex-wrap">
                {table.columns.map((col, ci) => (
                  <div key={ci} className="flex items-center gap-1">
                    <input type="text" value={col}
                      onChange={e => setTableCol(ti, ci, e.target.value)}
                      placeholder={`Col ${ci + 1}`}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40 w-32" />
                    {table.columns.length > 1 && (
                      <button type="button" onClick={() => removeTableCol(ti, ci)} className="text-xs text-red-400 hover:text-red-600">×</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addTableCol(ti)} className="text-xs text-bloom hover:underline">+ col</button>
              </div>
            </div>
            {/* Rows */}
            <div className="space-y-2">
              <span className="text-xs text-slate font-medium">Rows</span>
              {table.rows.map((row, ri) => (
                <div key={ri} className="flex gap-2 items-center">
                  {row.map((cell, ci) => (
                    <input key={ci} type="text" value={cell}
                      onChange={e => setTableCell(ti, ri, ci, e.target.value)}
                      placeholder={table.columns[ci] || `Col ${ci + 1}`}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40" />
                  ))}
                  {table.rows.length > 1 && (
                    <button type="button" onClick={() => removeTableRow(ti, ri)} className="text-xs text-red-400 hover:text-red-600 shrink-0">×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addTableRow(ti)} className="text-xs text-bloom hover:underline">+ Add row</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addTable} className="text-sm text-bloom hover:underline">+ Add comparison table</button>
      </div>

      {/* Reading tip */}
      <div>
        <label className="block text-sm font-semibold mb-1">Reading Tip</label>
        <textarea rows={3} value={bio.reading_tip}
          onChange={e => setBio(b => ({ ...b, reading_tip: e.target.value }))}
          placeholder="e.g. Do not skip the novella..."
          className={`${inputCls} resize-y`} />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={status === 'saving'}
          className="bg-bloom text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-bloom/90 transition-colors disabled:opacity-60">
          {status === 'saving' ? 'Saving...' : 'Save Bio'}
        </button>
        {status === 'saved' && <span className="text-sm text-green-600 font-medium">Saved!</span>}
        {status === 'error'  && <span className="text-sm text-red-500">{errorMsg}</span>}
      </div>
    </form>

    {/* Needs Bio */}
    <div className="mt-12 space-y-4">
      <h2 className="font-serif text-lg font-semibold">Needs Bio</h2>
      <p className="text-xs text-slate">Popular series without a bio yet — click to load.</p>
      {suggestionsLoading && <p className="text-sm text-slate">Loading...</p>}
      {!suggestionsLoading && suggestions.length === 0 && (
        <p className="text-sm text-green-600">All popular series have bios.</p>
      )}
      {suggestions.length > 0 && (
        <ul className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
          {suggestions.map(s => (
            <li key={s.name}>
              <button type="button" onClick={() => loadByName(s.name)}
                className="w-full text-left px-4 py-3 hover:bg-petal/10 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{s.name}</p>
                  <div className="flex gap-3 text-xs text-slate shrink-0">
                    <span>{s.book_count} {s.book_count === 1 ? 'book' : 'books'}</span>
                    {s.max_rating_count > 0 && <span>{s.max_rating_count.toLocaleString()} ratings</span>}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
    </>
  )
}

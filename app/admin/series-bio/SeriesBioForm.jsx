'use client'
import { useState } from 'react'

const EMPTY_ENTRY    = { number: '', format: '', focus: '' }
const EMPTY_EXPECT   = { label: '', text: '' }
const EMPTY_BIO = {
  intro: '',
  reading_order_note: '',
  reading_order: [{ ...EMPTY_ENTRY }],
  what_to_expect: [{ ...EMPTY_EXPECT }],
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
        reading_order:       data.bio.reading_order?.length  ? data.bio.reading_order  : [{ ...EMPTY_ENTRY }],
        what_to_expect:      data.bio.what_to_expect?.length ? data.bio.what_to_expect : [{ ...EMPTY_EXPECT }],
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
          reading_order:       existing.reading_order?.length ? existing.reading_order : [{ ...EMPTY_ENTRY }],
          what_to_expect:      existing.what_to_expect?.length ? existing.what_to_expect : [{ ...EMPTY_EXPECT }],
          reading_tip:         existing.reading_tip ?? '',
        })
      }
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
                  <label className="block text-xs text-slate mb-1">Book # (series_number)</label>
                  <input type="number" value={entry.number}
                    onChange={e => setEntry(i, 'number', e.target.value)}
                    placeholder="1"
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate mb-1">Format</label>
                  <select value={entry.format} onChange={e => setEntry(i, 'format', e.target.value)} className={inputCls}>
                    <option value="">—</option>
                    <option>Novel</option>
                    <option>Novella</option>
                    <option>Short Story</option>
                    <option>Prequel</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate mb-1">Focus</label>
                <input type="text" value={entry.focus}
                  onChange={e => setEntry(i, 'focus', e.target.value)}
                  placeholder="One-line description of what this book focuses on..."
                  className={inputCls} />
              </div>
            </div>
          ))}
          <button type="button" onClick={addEntry} className="text-sm text-bloom hover:underline">+ Add book</button>
        </div>
      </div>

      {/* What to expect */}
      <div>
        <label className="block text-sm font-semibold mb-3">What to Expect</label>
        <div className="space-y-3">
          {bio.what_to_expect.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate">Section {i + 1}</span>
                {bio.what_to_expect.length > 1 && (
                  <button type="button" onClick={() => removeExpect(i)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                )}
              </div>
              <input type="text" value={item.label}
                onChange={e => setExpect(i, 'label', e.target.value)}
                placeholder="e.g. The World Building"
                className={inputCls} />
              <textarea rows={2} value={item.text}
                onChange={e => setExpect(i, 'text', e.target.value)}
                placeholder="Description..."
                className={`${inputCls} resize-none`} />
            </div>
          ))}
          <button type="button" onClick={addExpect} className="text-sm text-bloom hover:underline">+ Add section</button>
        </div>
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
  )
}

'use client'
import { useState } from 'react'

const EMPTY_SERIES = { name: '', years: '', description: '' }

const EMPTY_BIO = {
  intro: '',
  profile: {
    'Primary Genres': '',
    'Notable Works': '',
    'Defining Tropes': '',
    'Key Achievement': '',
  },
  writing_style: '',
  series: [{ ...EMPTY_SERIES }],
  reader_tip: '',
  extras: '',
}

export default function AuthorBioForm({ authors }) {
  const [authorName, setAuthorName] = useState('')
  const [bio, setBio] = useState(EMPTY_BIO)
  const [status, setStatus] = useState(null) // null | 'saving' | 'saved' | 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')

  async function handleParse() {
    if (!pasteText.trim()) return
    setParsing(true)
    setParseError('')
    try {
      const res  = await fetch('/api/admin/parse-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'author', content: pasteText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBio({
        intro:         data.bio.intro         ?? '',
        profile:       { ...EMPTY_BIO.profile, ...(data.bio.profile ?? {}) },
        writing_style: data.bio.writing_style ?? '',
        series:        data.bio.series?.length ? data.bio.series : [{ ...EMPTY_SERIES }],
        reader_tip:    data.bio.reader_tip     ?? '',
        extras:        data.bio.extras         ?? '',
      })
      setPasteText('')
    } catch (err) {
      setParseError(err.message)
    } finally {
      setParsing(false)
    }
  }

  function setProfile(key, value) {
    setBio(b => ({ ...b, profile: { ...b.profile, [key]: value } }))
  }

  function setSeries(index, key, value) {
    setBio(b => {
      const updated = b.series.map((s, i) => i === index ? { ...s, [key]: value } : s)
      return { ...b, series: updated }
    })
  }

  function addSeries() {
    setBio(b => ({ ...b, series: [...b.series, { ...EMPTY_SERIES }] }))
  }

  function removeSeries(index) {
    setBio(b => ({ ...b, series: b.series.filter((_, i) => i !== index) }))
  }

  async function loadExisting() {
    if (!authorName.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/author-bio?author=${encodeURIComponent(authorName.trim())}`)
      const { bio: existing } = await res.json()
      if (existing) {
        setBio({
          intro: existing.intro ?? '',
          profile: { ...EMPTY_BIO.profile, ...(existing.profile ?? {}) },
          writing_style: existing.writing_style ?? '',
          series: existing.series?.length ? existing.series : [{ ...EMPTY_SERIES }],
          reader_tip: existing.reader_tip ?? '',
          extras: existing.extras ?? '',
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

    // Strip empty series rows
    const cleanBio = {
      ...bio,
      series: bio.series.filter(s => s.name.trim()),
    }

    try {
      const res = await fetch('/api/admin/author-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_name: authorName, bio: cleanBio }),
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
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Author name */}
      <div>
        <label className="block text-sm font-semibold mb-1">Author Name</label>
        <div className="flex gap-2">
          <input
            list="author-list"
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
            onBlur={loadExisting}
            placeholder="e.g. Ana Huang"
            required
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40"
          />
          <datalist id="author-list">
            {authors.map(a => <option key={a} value={a} />)}
          </datalist>
          <button
            type="button"
            onClick={loadExisting}
            disabled={loading}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-petal/10 transition-colors"
          >
            {loading ? '...' : 'Load'}
          </button>
        </div>
        <p className="text-xs text-slate mt-1">If this author already has a bio, it will load on blur.</p>
      </div>

      {/* Paste & parse */}
      <div className="bg-petal/10 rounded-xl p-4 space-y-3">
        <label className="block text-sm font-semibold">Paste raw content</label>
        <p className="text-xs text-slate">Paste any text about the author — we&apos;ll extract and pre-fill all the fields below.</p>
        <textarea
          rows={5}
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          placeholder="Paste author bio, Wikipedia excerpt, blog post, etc..."
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
        <textarea
          rows={4}
          value={bio.intro}
          onChange={e => setBio(b => ({ ...b, intro: e.target.value }))}
          placeholder="A short introductory paragraph about the author..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40 resize-y"
        />
      </div>

      {/* Profile */}
      <div>
        <label className="block text-sm font-semibold mb-3">Profile</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.keys(EMPTY_BIO.profile).map(key => (
            <div key={key}>
              <label className="block text-xs text-slate mb-1">{key}</label>
              <input
                type="text"
                value={bio.profile[key] ?? ''}
                onChange={e => setProfile(key, e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Writing style */}
      <div>
        <label className="block text-sm font-semibold mb-1">Writing Style &amp; Impact</label>
        <textarea
          rows={4}
          value={bio.writing_style}
          onChange={e => setBio(b => ({ ...b, writing_style: e.target.value }))}
          placeholder="Describe the author's writing style, themes, and impact..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40 resize-y"
        />
      </div>

      {/* Series */}
      <div>
        <label className="block text-sm font-semibold mb-3">Series Chronology</label>
        <div className="space-y-4">
          {bio.series.map((s, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate">Series {i + 1}</span>
                {bio.series.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSeries(i)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate mb-1">Series Name</label>
                  <input
                    type="text"
                    value={s.name}
                    onChange={e => setSeries(i, 'name', e.target.value)}
                    placeholder="e.g. The Twisted Series"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate mb-1">Years</label>
                  <input
                    type="text"
                    value={s.years}
                    onChange={e => setSeries(i, 'years', e.target.value)}
                    placeholder="e.g. 2021"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate mb-1">Description</label>
                <textarea
                  rows={2}
                  value={s.description}
                  onChange={e => setSeries(i, 'description', e.target.value)}
                  placeholder="Brief description of this series..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40 resize-none"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addSeries}
            className="text-sm text-bloom hover:underline"
          >
            + Add series
          </button>
        </div>
      </div>

      {/* Reader tip */}
      <div>
        <label className="block text-sm font-semibold mb-1">Reader Tip</label>
        <textarea
          rows={3}
          value={bio.reader_tip}
          onChange={e => setBio(b => ({ ...b, reader_tip: e.target.value }))}
          placeholder="Optional reading order tip or note for readers..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40 resize-y"
        />
      </div>

      {/* Extras */}
      <div>
        <textarea
          rows={6}
          value={bio.extras}
          onChange={e => setBio(b => ({ ...b, extras: e.target.value }))}
          placeholder="Add any extra sections here. Use your own headings. Wrap words in <b>bold</b> for emphasis."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/40 resize-y"
        />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="bg-bloom text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-bloom/90 transition-colors disabled:opacity-60"
        >
          {status === 'saving' ? 'Saving...' : 'Save Bio'}
        </button>
        {status === 'saved' && (
          <span className="text-sm text-green-600 font-medium">Saved!</span>
        )}
        {status === 'error' && (
          <span className="text-sm text-red-500">{errorMsg}</span>
        )}
      </div>
    </form>
  )
}

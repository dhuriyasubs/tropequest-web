'use client'
import { useState } from 'react'

export default function InterestsClient({ interests, tropes, allGenres = [], allAuthors }) {
  const [selTropes,  setSelTropes]  = useState(interests.tropes  ?? [])
  const [selGenres,  setSelGenres]  = useState(interests.genres  ?? [])
  const [selAuthors, setSelAuthors] = useState(interests.authors ?? [])
  const [tropeSearch,  setTropeSearch]  = useState('')
  const [genreSearch,  setGenreSearch]  = useState('')
  const [authorSearch, setAuthorSearch] = useState('')
  const [saving, setSaving] = useState(false)

  function toggleTrope(t) {
    setSelTropes(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t])
  }

  function toggleGenre(g) {
    setSelGenres(s => s.includes(g) ? s.filter(x => x !== g) : [...s, g])
  }

  function toggleAuthor(a) {
    setSelAuthors(s => s.includes(a) ? s.filter(x => x !== a) : [...s, a])
  }

  async function save() {
    setSaving(true)
    await fetch('/api/interests', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ tropes: selTropes, genres: selGenres, subjects: [], authors: selAuthors }),
    })
    setSaving(false)
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Interests saved!' } }))
  }

  const filteredTropes  = tropes.filter(t =>
    !tropeSearch  || t.toLowerCase().includes(tropeSearch.toLowerCase()))
  const filteredGenres  = allGenres.filter(g =>
    !genreSearch  || g.toLowerCase().includes(genreSearch.toLowerCase()))
  const filteredAuthors = allAuthors.filter(a =>
    !authorSearch || a.toLowerCase().includes(authorSearch.toLowerCase()))

  return (
    <div className="space-y-10">

      {/* Genres */}
      {allGenres.length > 0 && (
        <section>
          <h2 className="font-serif text-xl font-semibold mb-1">Favourite Genres</h2>
          <p className="text-xs text-slate mb-3">{selGenres.length} selected</p>
          <input
            type="text"
            placeholder="Search genres…"
            value={genreSearch}
            onChange={e => setGenreSearch(e.target.value)}
            className="w-full border border-petal/30 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-bloom/30"
          />
          <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto py-1">
            {filteredGenres.map(g => (
              <button
                key={g}
                onClick={() => toggleGenre(g)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  selGenres.includes(g)
                    ? 'bg-bloom text-white border-bloom'
                    : 'bg-white text-ink border-petal/40 hover:border-bloom'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Tropes */}
      <section>
        <h2 className="font-serif text-xl font-semibold mb-1">Favourite Tropes</h2>
        <p className="text-xs text-slate mb-3">{selTropes.length} selected</p>
        <input
          type="text"
          placeholder="Search tropes…"
          value={tropeSearch}
          onChange={e => setTropeSearch(e.target.value)}
          className="w-full border border-petal/30 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-bloom/30"
        />
        <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto py-1">
          {filteredTropes.map(t => (
            <button
              key={t}
              onClick={() => toggleTrope(t)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selTropes.includes(t)
                  ? 'bg-bloom text-white border-bloom'
                  : 'bg-white text-ink border-petal/40 hover:border-bloom'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Authors */}
      <section>
        <h2 className="font-serif text-xl font-semibold mb-1">Favourite Authors</h2>
        <p className="text-xs text-slate mb-3">{selAuthors.length} selected</p>
        <input
          type="text"
          placeholder="Search authors…"
          value={authorSearch}
          onChange={e => setAuthorSearch(e.target.value)}
          className="w-full border border-petal/30 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-bloom/30"
        />
        <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto py-1">
          {filteredAuthors.map(a => (
            <button
              key={a}
              onClick={() => toggleAuthor(a)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selAuthors.includes(a)
                  ? 'bg-bloom text-white border-bloom'
                  : 'bg-white text-ink border-petal/40 hover:border-bloom'
              }`}
            >
              {a}
            </button>
          ))}
          {filteredAuthors.length === 0 && authorSearch && (
            <p className="text-xs text-slate py-1">No authors found for &ldquo;{authorSearch}&rdquo;</p>
          )}
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-bloom text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save Interests'}
      </button>
    </div>
  )
}

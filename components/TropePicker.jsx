'use client'
import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/utils'

export default function TropePicker({ tropes, grouped, letters }) {
  const router = useRouter()
  const [selected, setSelected] = useState([])
  const [query, setQuery] = useState('')

  const filteredLetters = useMemo(() => {
    if (!query.trim()) return { letters, grouped }
    const q = query.toLowerCase()
    const filteredGrouped = {}
    for (const letter of letters) {
      const hits = grouped[letter].filter(t => t.toLowerCase().includes(q))
      if (hits.length) filteredGrouped[letter] = hits
    }
    return { letters: Object.keys(filteredGrouped).sort(), grouped: filteredGrouped }
  }, [query, letters, grouped])

  const toggle = useCallback((t) => {
    setSelected(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    )
  }, [])

  function handleSingleClick(t) {
    // If nothing else selected, go directly to trope page
    if (selected.length === 0) {
      router.push(`/tropes/${slugify(t)}`)
    } else {
      toggle(t)
    }
  }

  function viewResults() {
    const sp = new URLSearchParams()
    selected.forEach(t => sp.append('tropes', t))
    router.push(`/search?${sp.toString()}`)
  }

  function clearAll() {
    setSelected([])
  }

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-6">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search tropes…"
          className="w-full sm:max-w-sm border border-petal/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/30 focus:border-bloom"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate/50 hover:text-slate text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Sticky action bar */}
      {selected.length > 0 && (
        <div className="sticky top-14 z-30 bg-white border-b border-petal/20 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <span className="text-sm font-medium text-ink flex-1">
              {selected.length} trope{selected.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={clearAll}
              className="text-xs text-slate hover:text-ink transition-colors"
            >
              Clear
            </button>
            <button
              onClick={viewResults}
              className="bg-bloom text-white text-sm font-semibold px-5 py-2 rounded-xl hover:opacity-90 transition-opacity"
            >
              Find books →
            </button>
          </div>
        </div>
      )}

      {/* Hint text */}
      <p className="text-xs text-slate/60 mb-8">
        Tap one trope to browse it · select multiple to combine
      </p>

      {filteredLetters.letters.length === 0 && (
        <p className="text-slate text-sm">No tropes match &ldquo;{query}&rdquo;</p>
      )}

      {filteredLetters.letters.map(letter => (
        <section key={letter} className="mb-8">
          <h2 className="font-serif text-xl font-semibold mb-3 text-bloom">{letter}</h2>
          <div className="flex flex-wrap gap-2">
            {filteredLetters.grouped[letter].map(t => {
              const isSelected = selected.includes(t)
              return (
                <button
                  key={t}
                  onClick={() => selected.length > 0 ? toggle(t) : handleSingleClick(t)}
                  onContextMenu={e => { e.preventDefault(); toggle(t) }}
                  className={`chip transition-all ${isSelected ? 'chip-active' : ''}`}
                >
                  {isSelected && <span className="mr-1 text-xs">✓</span>}
                  {t}
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}

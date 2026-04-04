'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/utils'

export default function TropePicker({ tropes, grouped, letters }) {
  const router = useRouter()
  const [selected, setSelected] = useState([])

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

      {letters.map(letter => (
        <section key={letter} className="mb-8">
          <h2 className="font-serif text-xl font-semibold mb-3 text-bloom">{letter}</h2>
          <div className="flex flex-wrap gap-2">
            {grouped[letter].map(t => {
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

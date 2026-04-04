'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const PLACEHOLDERS = [
  'Enemies to Lovers',
  'Colleen Hoover',
  'Dark Romance',
  'A Court of Thorns and Roses',
  'Slow Burn',
  'Sarah J. Maas',
  'Psychological Thriller',
  'It Ends with Us',
  'Fake Dating',
  'Ana Huang',
  'Mafia Romance',
  'From Blood and Ash',
  'Forbidden Love',
  'Lisa Jewell',
  'Found Family',
  'Grumpy × Sunshine',
  'The Atlas Six',
  'Age Gap',
  'Freida McFadden',
  'Second Chance',
]

export default function NavSearch() {
  const router = useRouter()
  const [query, setQuery]       = useState('')
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0])
  const [fading, setFading]     = useState(false)
  const idxRef = useRef(0)

  useEffect(() => {
    const id = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        idxRef.current = (idxRef.current + 1) % PLACEHOLDERS.length
        setPlaceholder(PLACEHOLDERS[idxRef.current])
        setFading(false)
      }, 300)
    }, 2800)
    return () => clearInterval(id)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 min-w-0 mx-2 sm:mx-3">
      <div className="relative">
        {/* Search icon */}
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate/40 pointer-events-none flex-shrink-0"
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>

        {/* Animated fake placeholder — hidden when user is typing */}
        {!query && (
          <span
            aria-hidden="true"
            className="absolute left-8 right-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-slate/40 pointer-events-none truncate transition-opacity duration-300"
            style={{ opacity: fading ? 0 : 1 }}
          >
            {placeholder}
          </span>
        )}

        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
          placeholder=""
          aria-label="Search books"
          className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-gray-50 border border-petal/30 rounded-full
            focus:outline-none focus:border-bloom/50 focus:bg-white transition-colors text-ink"
        />
      </div>
    </form>
  )
}

'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function NavSearch() {
  const router  = useRouter()
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen]       = useState(false)
  const [active, setActive]   = useState(-1)
  const inputRef  = useRef(null)
  const wrapRef   = useRef(null)
  const debounce  = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleChange(e) {
    const q = e.target.value
    setQuery(q)
    setActive(-1)
    clearTimeout(debounce.current)
    if (!q.trim()) { setResults([]); setOpen(false); return }
    debounce.current = setTimeout(async () => {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}&page=1`)
      const data = await res.json()
      setResults((data.books ?? []).slice(0, 6))
      setOpen(true)
    }, 250)
  }

  function handleKeyDown(e) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, -1)) }
    if (e.key === 'Escape')    { setOpen(false); inputRef.current?.blur() }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (active >= 0 && results[active]) {
        router.push(`/books/${results[active].slug}`)
        setQuery(''); setOpen(false)
      } else if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
        setQuery(''); setOpen(false)
      }
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setQuery(''); setOpen(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <svg className="absolute left-3 w-3.5 h-3.5 text-slate/40 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search books, tropes…"
            className="w-40 sm:w-52 pl-8 pr-3 py-1.5 text-xs sm:text-sm rounded-full bg-gray-50 border border-gray-300 focus:outline-none focus:border-bloom/60 focus:bg-white transition-colors"
          />
        </div>
      </form>

      {open && results.length > 0 && (
        <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-lg border border-petal/30 overflow-hidden z-50">
          {results.map((b, i) => (
            <Link
              key={b.id}
              href={`/books/${b.slug}`}
              onClick={() => { setQuery(''); setOpen(false) }}
              className={`flex items-center gap-3 px-3 py-2 hover:bg-petal/10 transition-colors ${active === i ? 'bg-petal/10' : ''}`}
            >
              <div className="relative shrink-0 w-8 h-12 rounded overflow-hidden bg-gray-100">
                {b.cover_url
                  ? <Image src={b.cover_url} alt={b.title} fill sizes="32px" className="object-contain" />
                  : <div className="w-full h-full flex items-center justify-center text-sm">📚</div>
                }
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight line-clamp-1">{b.title}</p>
                <p className="text-xs text-slate line-clamp-1">{b.author}</p>
              </div>
            </Link>
          ))}
          {query.trim() && (
            <Link
              href={`/search?q=${encodeURIComponent(query.trim())}`}
              onClick={() => { setQuery(''); setOpen(false) }}
              className="flex items-center gap-2 px-3 py-2.5 text-xs text-bloom font-medium border-t border-gray-100 hover:bg-petal/10 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
              See all results for &ldquo;{query}&rdquo;
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

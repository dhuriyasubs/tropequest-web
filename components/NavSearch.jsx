'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function NavSearch() {
  const router  = useRouter()
  const [query, setQuery]   = useState('')
  const [data, setData]     = useState(null)   // { books, series, authors, tropes }
  const [open, setOpen]     = useState(false)
  const [active, setActive] = useState(-1)
  const inputRef = useRef(null)
  const wrapRef  = useRef(null)
  const debounce = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function flatList(d) {
    if (!d) return []
    return [
      ...(d.books   ?? []),
      ...(d.series  ?? []),
      ...(d.authors ?? []),
      ...(d.tropes  ?? []),
    ]
  }

  function handleChange(e) {
    const q = e.target.value
    setQuery(q)
    setActive(-1)
    clearTimeout(debounce.current)
    if (!q.trim()) { setData(null); setOpen(false); return }
    debounce.current = setTimeout(async () => {
      const res  = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`)
      const json = await res.json()
      setData(json)
      const hasAny = json.books?.length || json.series?.length || json.authors?.length || json.tropes?.length
      setOpen(!!hasAny)
    }, 250)
  }

  function handleKeyDown(e) {
    if (!open) return
    const flat = flatList(data)
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, flat.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, -1)) }
    if (e.key === 'Escape')    { setOpen(false); inputRef.current?.blur() }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (active >= 0 && flat[active]) {
        router.push(flat[active].href)
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

  // Precompute start index of each group for keyboard active highlighting
  const booksStart   = 0
  const seriesStart  = booksStart  + (data?.books?.length  ?? 0)
  const authorsStart = seriesStart + (data?.series?.length ?? 0)
  const tropesStart  = authorsStart + (data?.authors?.length ?? 0)

  function groupItems(items, startIdx, renderItem) {
    return items.map((item, i) => {
      const idx = startIdx + i
      return (
        <Link
          key={idx}
          href={item.href}
          onClick={() => { setQuery(''); setOpen(false) }}
          className={`flex items-center gap-3 px-3 py-2 hover:bg-petal/10 transition-colors ${active === idx ? 'bg-petal/10' : ''}`}
        >
          {renderItem(item)}
        </Link>
      )
    })
  }

  const books   = data?.books   ?? []
  const series  = data?.series  ?? []
  const authors = data?.authors ?? []
  const tropes  = data?.tropes  ?? []

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
            onFocus={() => flatList(data).length > 0 && setOpen(true)}
            placeholder="Search books, tropes…"
            className="w-40 sm:w-52 pl-8 pr-3 py-1.5 text-xs sm:text-sm rounded-full bg-gray-50 border border-gray-300 focus:outline-none focus:border-bloom/60 focus:bg-white transition-colors"
          />
        </div>
      </form>

      {open && data && (
        <div className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-xl shadow-lg border border-petal/30 overflow-hidden z-50">

          {books.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate/40">Books</p>
              {groupItems(books, booksStart, item => (
                <>
                  <div className="relative shrink-0 w-8 h-12 rounded overflow-hidden bg-gray-100">
                    {item.cover
                      ? <Image src={item.cover} alt={item.label} fill sizes="32px" className="object-contain" />
                      : <div className="w-full h-full flex items-center justify-center text-sm">📚</div>
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight line-clamp-1">{item.label}</p>
                    <p className="text-xs text-slate line-clamp-1">{item.sub}</p>
                  </div>
                </>
              ))}
            </div>
          )}

          {series.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate/40">Series</p>
              {groupItems(series, seriesStart, item => (
                <>
                  <div className="shrink-0 w-8 h-8 rounded-full bg-petal/20 flex items-center justify-center text-sm">📖</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight line-clamp-1">{item.label}</p>
                    <p className="text-xs text-slate line-clamp-1">{item.sub}</p>
                  </div>
                </>
              ))}
            </div>
          )}

          {authors.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate/40">Authors</p>
              {groupItems(authors, authorsStart, item => (
                <>
                  <div className="shrink-0 w-8 h-8 rounded-full bg-bloom/10 flex items-center justify-center text-sm">✍️</div>
                  <p className="text-sm font-medium line-clamp-1">{item.label}</p>
                </>
              ))}
            </div>
          )}

          {tropes.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate/40">Tropes</p>
              {groupItems(tropes, tropesStart, item => (
                <>
                  <div className="shrink-0 w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-sm">🏷️</div>
                  <p className="text-sm font-medium line-clamp-1">{item.label}</p>
                </>
              ))}
            </div>
          )}

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

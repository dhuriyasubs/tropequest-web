'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getDominantColor, isLight } from '@/lib/dominantColor'

const STATUS_DOT = {
  unread:  'bg-petal',
  reading: 'bg-bloom',
  read:    'bg-green-500',
}

// Fallback palette — used while the real cover color is being sampled, or if
// sampling fails (no cover, load error).
const SPINE_COLORS = [
  '#5c3a4e', // plum
  '#8a4f63', // mauve
  '#2f4858', // navy
  '#3c5a45', // forest
  '#7a5230', // umber
  '#4a3b5c', // indigo
  '#6b5e2f', // olive gold
  '#5e3a3a', // brick
]

function hashId(id) {
  return String(id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
}

function SpineBook({ status, book }) {
  const n = hashId(book.id)
  const fallbackColor = SPINE_COLORS[n % SPINE_COLORS.length]
  const [color, setColor] = useState(fallbackColor)
  // Width scales with title length (purposeful variety, not random jitter) so
  // longer titles get a touch more room for their vertical text.
  const widthClass = book.title.length > 28 ? 'w-11 sm:w-12' : book.title.length > 14 ? 'w-9 sm:w-10' : 'w-8 sm:w-9'

  useEffect(() => {
    let cancelled = false
    getDominantColor(book.cover_url).then(c => {
      if (!cancelled && c) setColor(c)
    })
    return () => { cancelled = true }
  }, [book.cover_url])

  const textClass = isLight(color) ? 'text-ink/80' : 'text-white/90'
  const dotRing   = isLight(color) ? 'ring-ink/20' : 'ring-white/70'

  return (
    <Link
      href={`/books/${book.slug}`}
      title={`${book.title} — ${book.author}`}
      className={`group relative shrink-0 ${widthClass} h-44 sm:h-52 rounded-sm transition-transform duration-150 hover:-translate-y-2 hover:z-10 flex flex-col items-center`}
      style={{
        backgroundColor: color,
        boxShadow: 'inset -2px 0 3px rgba(0,0,0,0.18), 2px 3px 6px rgba(0,0,0,0.25)',
        transition: 'background-color 0.3s ease, transform 0.15s ease',
      }}
    >
      <span className={`absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ring-1 ${dotRing} ${STATUS_DOT[status] ?? 'bg-slate'}`} />

      <span
        className="flex-1 flex items-center justify-center overflow-hidden px-0.5 py-4"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        <span className={`text-[10px] sm:text-[11px] font-medium line-clamp-1 tracking-tight ${textClass}`}>
          {book.title}
        </span>
      </span>

      {/* Hover identity card — spine text alone is hard to read at a glance */}
      <span className="pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 flex items-start gap-2 whitespace-nowrap rounded-lg bg-ink text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
        <span
          className="shrink-0 w-8 rounded-sm overflow-hidden bg-white/10"
          style={{ aspectRatio: '2/3' }}
        >
          {book.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
          )}
        </span>
        <span className="py-0.5">
          <span className="block font-medium">{book.title}</span>
          <span className="block text-white/60">{book.author}</span>
        </span>
      </span>
    </Link>
  )
}

export default function ShelfSpines({ entries }) {
  return (
    <div className="relative pt-4">
      <div className="flex flex-wrap items-end gap-[2px] px-1 pb-1">
        {entries.map(({ status, books: book }) => (
          <SpineBook key={book.id} status={status} book={book} />
        ))}
      </div>

      {/* Shelf ledge */}
      <div
        className="h-3.5 rounded-b-sm shadow-[0_8px_10px_-6px_rgba(0,0,0,0.35)]"
        style={{ background: 'linear-gradient(to bottom, #c9a876, #a9824f)' }}
      />
    </div>
  )
}

'use client'
import Link from 'next/link'

const STATUS_DOT = {
  unread:  'bg-petal',
  reading: 'bg-bloom',
  read:    'bg-green-500',
}

// Muted, book-spine-like palette — picked deterministically per book so repeat
// visits show the same color, not a literal cover-accurate spine (we don't have spine art).
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

function jitter(n, range) {
  return ((n % 100) / 100 - 0.5) * 2 * range
}

export default function ShelfSpines({ entries }) {
  return (
    <div className="relative pt-4">
      <div className="flex flex-wrap items-end gap-[3px] px-1 pb-1">
        {entries.map(({ status, books: book }) => {
          const n = hashId(book.id)
          const color = SPINE_COLORS[n % SPINE_COLORS.length]
          const heightClass = n % 3 === 0 ? 'h-36 sm:h-44' : n % 3 === 1 ? 'h-40 sm:h-48' : 'h-44 sm:h-52'
          const widthClass = n % 5 === 0 ? 'w-7 sm:w-8' : n % 5 === 3 ? 'w-9 sm:w-11' : 'w-8 sm:w-10'
          const rotate = jitter(n, 1.2)

          return (
            <Link
              key={book.id}
              href={`/books/${book.slug}`}
              title={`${book.title} — ${book.author}`}
              className={`group relative shrink-0 ${widthClass} ${heightClass} rounded-[2px] transition-transform duration-150 hover:-translate-y-2 hover:z-10 flex flex-col items-center`}
              style={{
                background: `linear-gradient(to right, ${color}, ${color} 85%, rgba(255,255,255,0.18) 85%, rgba(255,255,255,0.18) 100%)`,
                boxShadow: '1px 0 0 rgba(0,0,0,0.15), 2px 3px 5px rgba(0,0,0,0.25)',
                transform: `rotate(${rotate}deg)`,
              }}
            >
              <span className={`absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ring-1 ring-white/70 ${STATUS_DOT[status] ?? 'bg-slate'}`} />

              <span
                className="flex-1 flex items-center justify-center overflow-hidden px-0.5 py-4"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                <span className="text-[10px] sm:text-[11px] font-medium text-white/90 line-clamp-1 tracking-tight">
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
        })}
      </div>

      {/* Shelf ledge */}
      <div
        className="h-3.5 rounded-b-sm shadow-[0_8px_10px_-6px_rgba(0,0,0,0.35)]"
        style={{ background: 'linear-gradient(to bottom, #c9a876, #a9824f)' }}
      />
    </div>
  )
}

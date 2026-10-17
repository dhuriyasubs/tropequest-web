'use client'
import Link from 'next/link'

const STATUS_DOT = {
  unread:  'bg-petal',
  reading: 'bg-bloom',
  read:    'bg-green-500',
}

// Deterministic per-book jitter so the row doesn't look perfectly uniform
function jitter(id, range) {
  const n = String(id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return ((n % 100) / 100 - 0.5) * 2 * range
}

export default function ShelfSpines({ entries }) {
  return (
    <div className="relative pt-4">
      <div className="flex flex-wrap items-end gap-3 sm:gap-4 px-1 pb-1">
        {entries.map(({ status, books: book }) => {
          const rotate = jitter(book.id, 2.5)
          return (
            <Link
              key={book.id}
              href={`/books/${book.slug}`}
              title={`${book.title} — ${book.author}`}
              className="group relative shrink-0 w-20 sm:w-24 rounded-sm shadow-md bg-gray-100 overflow-hidden transition-transform duration-150 hover:-translate-y-1.5 hover:shadow-lg hover:z-10"
              style={{ aspectRatio: '2/3', transform: `rotate(${rotate}deg)` }}
            >
              {book.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">📚</div>
              )}

              <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${STATUS_DOT[status] ?? 'bg-slate'}`} />

              <span className="pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink text-white text-xs px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="block font-medium">{book.title}</span>
                <span className="block text-white/60">{book.author}</span>
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

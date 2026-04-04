import Link from 'next/link'

const STATUS_BADGE = {
  read:    { label: '✓ Read',    cls: 'bg-green-600 text-white' },
  reading: { label: 'Reading',   cls: 'bg-bloom text-white' },
  unread:  { label: 'On Shelf',  cls: 'bg-petal/90 text-plum' },
}

function SeriesBook({ book }) {
  const badge = book.shelfStatus ? STATUS_BADGE[book.shelfStatus] : null
  const isRead = book.shelfStatus === 'read'

  return (
    <Link
      href={`/books/${book.slug}`}
      className={`group shrink-0 w-28 flex flex-col ${isRead ? 'opacity-60' : ''}`}
    >
      <div className="relative w-full rounded-xl overflow-hidden bg-gray-100" style={{ aspectRatio: '2/3' }}>
        {book.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">📚</div>
        )}

        {/* Series number badge — top-left */}
        {book.series_number != null && (
          <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none">
            #{book.series_number}
          </span>
        )}

        {/* Shelf status badge — bottom */}
        {badge && (
          <span className={`absolute bottom-0 left-0 right-0 text-center text-[10px] font-semibold py-1 ${badge.cls}`}>
            {badge.label}
          </span>
        )}

        {/* Read overlay checkmark */}
        {isRead && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-green-600/80 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg">✓</span>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-xs font-medium text-ink line-clamp-2 leading-tight">{book.title}</p>
    </Link>
  )
}

export default function SeriesCompletionSection({ series }) {
  if (!series?.length) return null

  return (
    <section className="max-w-6xl mx-auto px-4 py-6 md:py-10">
      <h2 className="font-serif text-2xl font-semibold mb-1">Complete the Series</h2>
      <p className="text-sm text-slate mb-6">Pick up where you left off</p>

      <div className="space-y-8">
        {series.map(({ seriesName, books }) => (
          <div key={seriesName}>
            <h3 className="font-semibold text-sm text-slate uppercase tracking-wide mb-3">{seriesName}</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {books.map(book => (
                <SeriesBook key={book.id} book={book} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

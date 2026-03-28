import Link from 'next/link'

export default function BookCard({ book }) {
  return (
    <Link
      href={`/books/${book.slug}`}
      className="group flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="relative aspect-[2/3] bg-gray-100 overflow-hidden">
        {book.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover_url}
            alt={`${book.title} cover`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-petal/40 text-4xl">
            📚
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <p className="font-serif font-semibold text-sm leading-tight line-clamp-2">
          {book.title}
        </p>
        <p className="text-xs text-slate">{book.author}</p>
        {book.rating && (
          <p className="text-xs text-bloom font-medium">★ {book.rating.toFixed(1)}</p>
        )}
        {book.tropes?.length > 0 && (
          <p className="text-xs text-slate/70 line-clamp-1 mt-1">
            {book.tropes.slice(0, 2).join(' · ')}
          </p>
        )}
      </div>
    </Link>
  )
}

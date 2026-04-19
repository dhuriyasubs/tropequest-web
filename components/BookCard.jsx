'use client'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { trackEvent } from '@/lib/events'

const TbrButton = dynamic(() => import('./TbrButton'), { ssr: false })

export default function BookCard({ book, shelfStatus = null, section = null }) {
  return (
    <Link
      href={`/books/${book.slug}`}
      className="group flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      onClick={section ? () => trackEvent('rec_click', { section, book_id: book.id, book_slug: book.slug }) : undefined}
    >
      <div className="relative aspect-[2/3] bg-gray-100 overflow-hidden">
        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt={`${book.title} cover`}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 15vw"
            className="object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-petal/40 text-4xl">
            📚
          </div>
        )}
        <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <TbrButton bookId={book.id} size="sm" />
        </div>
        {shelfStatus === 'read' && (
          <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-xs font-semibold text-center py-1">
            ✓ Read
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <p className="font-serif font-semibold text-sm leading-tight line-clamp-2">
          {book.title}
        </p>
        <p className="text-xs text-slate">{book.author}</p>
        <div className="flex items-center gap-2">
          {book.rating && (
            <p className="text-xs text-bloom font-medium">★ {book.rating.toFixed(1)}</p>
          )}
          {book.spice_rating && (
            <p className="text-xs">{'🌶️'.repeat(book.spice_rating)}</p>
          )}
        </div>
        {book.tropes?.length > 0 && (
          <p className="text-xs text-slate/70 line-clamp-1 mt-1">
            {book.tropes.slice(0, 2).join(' · ')}
          </p>
        )}
      </div>
    </Link>
  )
}

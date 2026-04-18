import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase'
import TbrButton from '@/components/TbrButton'
import ShelfScan from '@/components/ShelfScan'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'My TBR' }

export default async function TbrPage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/tbr')

  const [{ data }, { data: shelfData }] = await Promise.all([
    supabase
      .from('tbr')
      .select('book_id, source, created_at, books(id, title, author, cover_url, slug, rating, tropes, series_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('shelf')
      .select('book_id')
      .eq('user_id', user.id),
  ])

  const shelfIds = new Set((shelfData ?? []).map(r => r.book_id))
  const books    = (data ?? []).map(r => ({ ...r.books, source: r.source })).filter(Boolean)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h1 className="font-serif text-3xl font-bold">My TBR</h1>
        <div className="flex items-center gap-2">
          <ShelfScan mode="tbr" />
          <Link
            href="/shelf/import"
            className="text-xs text-slate hover:text-bloom transition-colors border border-petal/40 rounded-lg px-3 py-1.5 font-medium shrink-0"
          >
            Import from Goodreads
          </Link>
        </div>
      </div>
      {books.length > 0 && (
        <p className="text-slate text-sm mb-8">{books.length} book{books.length !== 1 ? 's' : ''} saved</p>
      )}

      {books.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate mb-4">No books in your TBR yet.</p>
          <Link href="/search" className="bg-bloom text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm">
            Browse books
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {books.map(book => (
            <div key={book.id} className="flex gap-4 p-4 rounded-xl border border-petal/30 bg-white">
              {/* Cover */}
              <Link
                href={`/books/${book.slug}`}
                className="shrink-0 w-14 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center block"
                style={{ aspectRatio: '2/3' }}
              >
                {book.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">📚</div>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/books/${book.slug}`}
                    className="font-semibold text-ink hover:text-bloom line-clamp-1"
                  >
                    {book.title}
                  </Link>
                  {book.rating && (
                    <span className="text-xs text-slate shrink-0">★ {book.rating.toFixed(1)}</span>
                  )}
                </div>
                <p className="text-sm text-slate mt-0.5">{book.author}</p>
                {book.series_name && (
                  <p className="text-xs text-slate/60 mt-0.5 line-clamp-1">{book.series_name}</p>
                )}
                {book.tropes?.length > 0 && (
                  <p className="text-xs text-slate/70 mt-1.5 line-clamp-1">
                    {book.tropes.slice(0, 3).join(' · ')}
                  </p>
                )}

                {/* Tags row */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {book.source === 'video' && (
                    <span className="text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded-full px-2 py-0.5 font-medium">
                      🎬 From video
                    </span>
                  )}
                  {book.source?.startsWith('blog:') && (
                    <span className="text-xs bg-petal/30 text-bloom border border-bloom/20 rounded-full px-2 py-0.5 font-medium">
                      📖 From: {book.source.slice(5)}
                    </span>
                  )}
                  {shelfIds.has(book.id) && (
                    <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-medium">
                      On shelf
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <TbrButton bookId={book.id} initialSaved={true} size="sm" id={`tbr-${book.id}`} />
                  <label htmlFor={`tbr-${book.id}`} className="text-xs text-slate cursor-pointer hover:text-bloom transition-colors">Remove from TBR</label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

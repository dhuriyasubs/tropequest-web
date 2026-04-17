import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase'
import ShelfButton from '@/components/ShelfButton'
import ShelfScan from '@/components/ShelfScan'
import ShelfSearch from '@/components/ShelfSearch'
import ShelfFilter from '@/components/ShelfFilter'
import ShelfInlineSearch from '@/components/ShelfInlineSearch'
import ShelfStatusSelect from '@/components/ShelfStatusSelect'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'My Shelf' }

const UNCATEGORISED_LABEL = 'Off the Map'

export default async function ShelfPage({ searchParams }) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/shelf')

  const activeStatus = searchParams?.status ?? null
  const shelfQuery   = searchParams?.q?.trim().toLowerCase() ?? ''

  // Fetch all shelf entries (unfiltered) for counts, then filter for display
  const { data: allData } = await supabase
    .from('shelf')
    .select('status, created_at, books(id, title, author, cover_url, slug, rating, tropes, series_name, genres)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const allEntries = (allData ?? []).filter(e => e.books)

  // Status counts for filter
  const statusCounts = { unread: 0, reading: 0, read: 0 }
  for (const e of allEntries) statusCounts[e.status] = (statusCounts[e.status] ?? 0) + 1

  let entries = activeStatus ? allEntries.filter(e => e.status === activeStatus) : allEntries
  if (shelfQuery) {
    entries = entries.filter(e =>
      e.books.title?.toLowerCase().includes(shelfQuery) ||
      e.books.author?.toLowerCase().includes(shelfQuery) ||
      e.books.series_name?.toLowerCase().includes(shelfQuery)
    )
  }

  // Group by first genre tag
  const genreMap = new Map()
  for (const entry of entries) {
    const genre = entry.books.genres?.[0] || UNCATEGORISED_LABEL
    if (!genreMap.has(genre)) genreMap.set(genre, [])
    genreMap.get(genre).push(entry)
  }

  // Alphabetical; "Off the Map" always last
  const sortedGenres = [...genreMap.keys()].sort((a, b) => {
    if (a === UNCATEGORISED_LABEL) return 1
    if (b === UNCATEGORISED_LABEL) return -1
    return a.localeCompare(b)
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="font-serif text-3xl font-bold">My Shelf</h1>
            {allEntries.length > 0 && (
              <p className="text-slate text-sm mt-0.5">
                {allEntries.length} book{allEntries.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex gap-2 items-center shrink-0">
            <ShelfSearch />
            <ShelfScan />
          </div>
        </div>
        {allEntries.length > 0 && (
          <ShelfFilter activeStatus={activeStatus} counts={statusCounts} total={allEntries.length} />
        )}
        {allEntries.length > 0 && (
          <ShelfInlineSearch initialQuery={shelfQuery} activeStatus={activeStatus} className="mt-3" />
        )}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate mb-6">
            {activeStatus
              ? `No ${activeStatus} books yet.`
              : 'Your shelf is empty. Scan your bookshelf or browse to add books.'}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <ShelfScan showLabel />
            <Link
              href="/search"
              className="bg-white border border-petal/40 text-ink font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Browse books
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Books grouped by genre */}
          <div className="space-y-8">
            {sortedGenres.map(genre => (
              <section key={genre}>
                <h2 className="font-serif text-lg font-semibold text-ink mb-3 flex items-center gap-2">
                  {genre}
                  <span className="text-sm font-normal text-slate">({genreMap.get(genre).length})</span>
                </h2>
                <div className="grid gap-3">
                  {genreMap.get(genre).map(({ status, books: book }) => (
                    <div key={book.id} className="flex gap-4 p-4 rounded-xl border border-petal/30 bg-white">
                      {/* Cover — object-contain so nothing is cropped */}
                      <Link
                        href={`/books/${book.slug}`}
                        className="shrink-0 w-14 rounded-lg overflow-hidden bg-gray-50 block flex items-center justify-center"
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
                          <ShelfStatusSelect bookId={book.id} currentStatus={status} />
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
                        <div className="flex items-center gap-3 mt-3">
                          <ShelfButton bookId={book.id} initialStatus={status} />
                          <span className="text-xs text-slate">Remove from shelf</span>
                          {book.rating && (
                            <span className="text-xs text-slate ml-auto">★ {book.rating.toFixed(1)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

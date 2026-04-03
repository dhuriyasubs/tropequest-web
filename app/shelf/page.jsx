import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase'
import ShelfButton from '@/components/ShelfButton'
import ShelfScan from '@/components/ShelfScan'
import ShelfStatusSelect from '@/components/ShelfStatusSelect'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'My Shelf' }

const STATUS_TABS = [
  { label: 'All',     value: null       },
  { label: 'Reading', value: 'reading'  },
  { label: 'Read',    value: 'read'     },
  { label: 'Owned',   value: 'owned'    },
]

const STATUS_LABELS = { owned: 'owned', reading: 'reading', read: 'read' }

export default async function ShelfPage({ searchParams }) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/shelf')

  const activeStatus = searchParams?.status ?? null

  let query = supabase
    .from('shelf')
    .select('status, created_at, books(id, title, author, cover_url, slug, rating, tropes, series_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (activeStatus) query = query.eq('status', activeStatus)

  const { data } = await query
  const entries = data ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">My Shelf</h1>
          {entries.length > 0 && (
            <p className="text-slate text-sm mt-1">
              {entries.length} book{entries.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <ShelfScan />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {STATUS_TABS.map(tab => (
          <Link
            key={tab.label}
            href={tab.value ? `/shelf?status=${tab.value}` : '/shelf'}
            className={`text-sm px-4 py-1.5 rounded-full transition-colors ${
              activeStatus === tab.value
                ? 'bg-bloom text-white font-medium'
                : 'bg-gray-100 text-slate hover:bg-petal/30 hover:text-ink'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate mb-6">
            {activeStatus
              ? `No ${STATUS_LABELS[activeStatus]} books yet.`
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
        <div className="grid gap-3">
          {entries.map(({ status, books: book }) => book && (
            <div key={book.id} className="flex gap-4 p-4 rounded-xl border border-petal/30 bg-white">
              {/* Cover */}
              <Link
                href={`/books/${book.slug}`}
                className="shrink-0 w-14 rounded-lg overflow-hidden bg-gray-100 block"
                style={{ aspectRatio: '2/3' }}
              >
                {book.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
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
      )}
    </div>
  )
}

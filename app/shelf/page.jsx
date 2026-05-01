import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase'
import ShelfScan from '@/components/ShelfScan'
import ShelfSearch from '@/components/ShelfSearch'
import ShelfContent from '@/components/ShelfContent'
import ShareButton from '@/components/ShareButton'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'My Shelf' }

export default async function ShelfPage() {
  const supabase = createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login?next=/shelf')
  const user = session.user

  const { data: allData } = await supabase
    .from('shelf')
    .select('status, created_at, books(id, title, author, cover_url, slug, rating, tropes, series_name, genres)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const entries = (allData ?? []).filter(e => e.books)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="font-serif text-3xl font-bold">My Shelf</h1>
            {entries.length > 0 && (
              <p className="text-slate text-sm mt-0.5">
                {entries.length} book{entries.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex gap-2 items-center shrink-0">
            <ShareButton />
            <ShelfSearch />
            <ShelfScan />
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate mb-6">Your shelf is empty. Scan your bookshelf or browse to add books.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <ShelfScan showLabel />
            <a href="/search" className="bg-white border border-petal/40 text-ink font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
              Browse books
            </a>
          </div>
        </div>
      ) : (
        <ShelfContent entries={entries} />
      )}
    </div>
  )
}

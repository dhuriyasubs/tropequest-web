import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase'
import { withTimeout } from '@/lib/withTimeout'
import ShelfScan from '@/components/ShelfScan'
import ShelfSearch from '@/components/ShelfSearch'
import ShelfContent from '@/components/ShelfContent'
import ShareButton from '@/components/ShareButton'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'My Shelf' }

export default async function ShelfPage() {
  const supabase = createSupabaseServer()
  const { data: { session } } = await withTimeout(supabase.auth.getSession(), 6000, 'session lookup')
  if (!session) redirect('/login?next=/shelf')
  const user = session.user

  const { data: allData } = await withTimeout(supabase
    .from('shelf')
    .select('status, format, member_label, created_at, books(id, title, author, cover_url, slug, rating, tropes, series_name, series_number, genres)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }), 6000, 'shelf entries')

  const entries = (allData ?? []).filter(e => e.books)
  const knownMembers = [...new Set(entries.map(e => e.member_label).filter(Boolean))].sort()

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold">My Shelf</h1>
            {entries.length > 0 && (
              <p className="text-slate text-sm mt-0.5">
                {entries.length} book{entries.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex gap-1.5 sm:gap-2 items-center shrink-0">
            <ShareButton className="[&_span]:hidden sm:[&_span]:inline" />
            <ShelfSearch existingBookIds={entries.map(e => e.books.id)} knownMembers={knownMembers} />
            <ShelfScan knownMembers={knownMembers} existingBookIds={entries.map(e => e.books.id)} />
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

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase'
import BookCard from '@/components/BookCard'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'My TBR' }

export default async function TbrPage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/tbr')

  const { data } = await supabase
    .from('tbr')
    .select('book_id, created_at, books(id, title, author, cover_url, slug, rating, tropes, series_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const books = (data ?? []).map(r => r.books).filter(Boolean)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-8">My TBR</h1>

      {books.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate mb-4">No books in your TBR yet.</p>
          <Link href="/search" className="btn-primary">Browse books</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {books.map(book => <BookCard key={book.id} book={book} />)}
        </div>
      )}
    </div>
  )
}

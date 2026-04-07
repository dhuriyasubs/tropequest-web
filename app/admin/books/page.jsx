import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase'
import BookEditForm from './BookEditForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin — Edit Book' }

export default async function AdminBooksPage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/books')

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-2">Edit Book</h1>
      <p className="text-slate text-sm mb-10">Search for a book and update its fields.</p>
      <BookEditForm />
    </div>
  )
}

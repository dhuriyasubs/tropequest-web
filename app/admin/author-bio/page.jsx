import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'
import { getAllAuthors } from '@/lib/search'
import AuthorBioForm from './AuthorBioForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin: Author Bio' }

export default async function AdminAuthorBioPage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/author-bio')
  if (!isAdmin(user)) return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-serif text-2xl font-bold mb-2">Not Authorized</h1>
      <p className="text-slate text-sm">You do not have permission to access this page.</p>
    </div>
  )

  const authors = await getAllAuthors()

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-2">Author Bio</h1>
      <p className="text-slate text-sm mb-10">Add or update an author&apos;s bio. Loads existing data if the author already has one.</p>
      <AuthorBioForm authors={authors.sort()} />
    </div>
  )
}

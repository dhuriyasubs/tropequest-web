import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin' }

const modules = [
  { href: '/admin/books',      label: 'Add / Edit Books',   description: 'Search and update book fields, tropes, genres, buy links' },
  { href: '/admin/author-bio', label: 'Author Bio',  description: 'Add or edit structured author bios with paste-to-parse' },
  { href: '/admin/series-bio', label: 'Series Bio',  description: 'Add or edit series reading order, intro, and tips' },
]

export default async function AdminPage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')
  if (!isAdmin(user)) return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-serif text-2xl font-bold mb-2">Not Authorized</h1>
      <p className="text-slate text-sm">You do not have permission to access this page.</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-2">Admin</h1>
      <p className="text-slate text-sm mb-10">TropeQuest content management.</p>
      <div className="space-y-3">
        {modules.map(m => (
          <Link key={m.href} href={m.href}
            className="flex items-center justify-between border border-gray-200 rounded-xl px-5 py-4 hover:bg-petal/10 transition-colors group">
            <div>
              <p className="font-semibold text-sm group-hover:text-bloom transition-colors">{m.label}</p>
              <p className="text-xs text-slate mt-0.5">{m.description}</p>
            </div>
            <span className="text-slate text-lg">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

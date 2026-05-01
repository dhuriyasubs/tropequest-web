import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase'
import GoodreadsImport from '@/components/GoodreadsImport'

export const metadata = { title: 'Import from Goodreads' }

export default async function ImportPage() {
  const supabase = createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login?next=/shelf/import')

  return <GoodreadsImport />
}

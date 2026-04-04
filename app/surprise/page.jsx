import { createSupabaseServer } from '@/lib/supabase'
import { getRandomBooks } from '@/lib/search'
import SwipeStack from '@/components/SwipeStack'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Surprise Me · TropeQuest' }

export default async function SurprisePage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let excludeIds = []
  if (user) {
    const [tbrRes, shelfRes] = await Promise.all([
      supabase.from('tbr').select('book_id').eq('user_id', user.id),
      supabase.from('shelf').select('book_id').eq('user_id', user.id),
    ])
    excludeIds = [
      ...(tbrRes.data ?? []).map(r => r.book_id),
      ...(shelfRes.data ?? []).map(r => r.book_id),
    ]
  }

  const books = await getRandomBooks(20, excludeIds)

  return (
    <SwipeStack
      initialBooks={books}
      userId={user?.id ?? null}
      initialExcludeIds={excludeIds}
    />
  )
}

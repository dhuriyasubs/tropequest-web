import { createSupabaseServer } from '@/lib/supabase'
import SwipeStack from '@/components/SwipeStack'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Surprise Me · TropeQuest' }

export default async function SurprisePage() {
  // Only auth — no heavy book queries; SwipeStack fetches client-side
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <SwipeStack
      initialBooks={[]}
      userId={user?.id ?? null}
      initialExcludeIds={[]}
    />
  )
}

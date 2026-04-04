import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase'
import { getPopularTropes, getPopularGenres, getAllAuthors } from '@/lib/search'
import WelcomeFlow from '@/components/WelcomeFlow'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Welcome to TropeQuest' }

export default async function WelcomePage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // If they've already set interests, skip onboarding
  const { data: existing } = await supabase
    .from('user_interests')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (existing) redirect('/')

  const [popularTropes, allGenres, allAuthors] = await Promise.all([
    getPopularTropes(60),
    getPopularGenres(50),
    getAllAuthors(),
  ])

  const firstName = user.user_metadata?.full_name?.split(' ')[0] ?? null

  return (
    <WelcomeFlow
      firstName={firstName}
      popularTropes={popularTropes}
      allGenres={allGenres}
      allAuthors={allAuthors}
    />
  )
}

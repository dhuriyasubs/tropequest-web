import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase'
import { getFilterOptions, getAllAuthors, getPopularGenres, getPopularTropes } from '@/lib/search'
import InterestsClient from '@/components/InterestsClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Manage Interests' }

export default async function InterestsPage() {
  const supabase = createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login?next=/interests')

  const [{ tropes }, allAuthors, allGenres, popularTropes, { data: interestsData }] = await Promise.all([
    getFilterOptions(),
    getAllAuthors(),
    getPopularGenres(50),
    getPopularTropes(50),
    supabase.from('user_interests').select('*').eq('user_id', user.id).single(),
  ])

  const interests = interestsData ?? { tropes: [], genres: [], authors: [] }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-2">Manage Interests</h1>
      <p className="text-slate text-sm mb-8">We&apos;ll use these to personalise your homepage.</p>
      <InterestsClient
        interests={interests}
        tropes={tropes}
        popularTropes={popularTropes}
        allGenres={allGenres}
        allAuthors={allAuthors}
      />
    </div>
  )
}

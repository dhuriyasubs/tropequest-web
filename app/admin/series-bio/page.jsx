import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase'
import { getAllSeries } from '@/lib/search'
import SeriesBioForm from './SeriesBioForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin — Series Bio' }

export default async function AdminSeriesBioPage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/series-bio')

  const allSeries = await getAllSeries()
  const seriesList = allSeries.map(s => s.series_name).sort()

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-2">Series Bio</h1>
      <p className="text-slate text-sm mb-10">Add or update a series description, reading order, and reader tips.</p>
      <SeriesBioForm seriesList={seriesList} />
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'
import AnalyticsDashboard from '@/app/components/AnalyticsDashboard'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Analytics · Admin' }

export default async function AnalyticsPage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/analytics')
  if (!isAdmin(user)) return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-serif text-2xl font-bold mb-2">Not Authorized</h1>
      <p className="text-slate text-sm">You do not have permission to access this page.</p>
    </div>
  )

  return <AnalyticsDashboard />
}

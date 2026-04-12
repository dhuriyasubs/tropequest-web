import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase'
import ProfileForm from '@/components/ProfileForm'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'My Profile' }

export default async function ProfilePage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/profile')

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-2">My Profile</h1>
      <p className="text-slate text-sm mb-8">Manage your account details.</p>
      <ProfileForm
        email={user.email}
        name={user.user_metadata?.full_name ?? ''}
      />
    </div>
  )
}

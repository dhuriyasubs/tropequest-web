import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

// All-time signup/activation/engagement per user — a different lens than the
// event-stream charts above (which are date-range scoped), so this ignores
// the range picker and always reflects the full account lifetime.
export async function GET() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [profilesRes, interestsRes, shelfRes, tbrRes] = await Promise.all([
    supabaseAdmin.from('profiles').select('id, email, created_at, updated_at, email_opt_out').order('created_at', { ascending: true }),
    supabaseAdmin.from('user_interests').select('user_id, tropes, subjects, authors'),
    supabaseAdmin.from('shelf').select('user_id'),
    supabaseAdmin.from('tbr').select('user_id'),
  ])

  const count = rows => rows.reduce((m, r) => m.set(r.user_id, (m.get(r.user_id) ?? 0) + 1), new Map())
  const shelfCounts = count(shelfRes.data ?? [])
  const tbrCounts   = count(tbrRes.data ?? [])
  const interestsByUser = new Map((interestsRes.data ?? []).map(r => [r.user_id, r]))

  const users = (profilesRes.data ?? []).map(p => {
    const interests = interestsByUser.get(p.id)
    const picksCount = (interests?.tropes?.length ?? 0) + (interests?.subjects?.length ?? 0) + (interests?.authors?.length ?? 0)
    const shelfCount = shelfCounts.get(p.id) ?? 0
    const tbrCount   = tbrCounts.get(p.id) ?? 0
    return {
      email:               p.email,
      createdAt:           p.created_at,
      lastSeen:            p.updated_at,
      returned:            p.updated_at !== p.created_at,
      isInternal:          p.email_opt_out,
      onboardingFinished:  !!interests,
      picksCount,
      shelfCount,
      tbrCount,
      engaged:             shelfCount > 0 || tbrCount > 0,
    }
  })

  const external = users.filter(u => !u.isInternal)
  const summary = {
    totalSignups:    users.length,
    externalSignups: external.length,
    onboarded:       external.filter(u => u.onboardingFinished).length,
    engaged:         external.filter(u => u.engaged).length,
    returned:        external.filter(u => u.returned).length,
  }

  return NextResponse.json({ users, summary })
}

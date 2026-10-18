import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase'
import { withTimeout } from '@/lib/withTimeout'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    try {
      const supabase = createSupabaseServer()
      await withTimeout(supabase.auth.exchangeCodeForSession(code), 6000, 'exchangeCodeForSession')

      // Upsert profile so DB stays in sync with Google account data
      const { data: { user } } = await withTimeout(supabase.auth.getUser(), 6000, 'getUser')
      if (user) {
        const { error: upsertError } = await withTimeout(
          supabaseAdmin.from('profiles').upsert({
            id:         user.id,
            email:      user.email,
            full_name:  user.user_metadata?.full_name  ?? null,
            avatar_url: user.user_metadata?.avatar_url ?? null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' }),
          6000, 'profile upsert'
        )
        if (upsertError) console.error('[auth/callback] profile upsert error:', upsertError)

        // New user check — no interests row means first login, send to onboarding
        const { data: interests } = await withTimeout(
          supabase.from('user_interests').select('user_id').eq('user_id', user.id).single(),
          6000, 'interests lookup'
        )

        if (!interests) {
          return NextResponse.redirect(`${origin}/welcome`)
        }
      }
    } catch (err) {
      console.error('[auth/callback] failed:', err.message)
      return NextResponse.redirect(`${origin}/login?error=unavailable`)
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}

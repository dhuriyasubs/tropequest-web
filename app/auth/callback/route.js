import { NextResponse } from 'next/server'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createSupabaseServer()
    await supabase.auth.exchangeCodeForSession(code)

    // Upsert profile so DB stays in sync with Google account data
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error: upsertError } = await supabaseAdmin.from('profiles').upsert({
        id:         user.id,
        email:      user.email,
        full_name:  user.user_metadata?.full_name  ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      if (upsertError) console.error('[auth/callback] profile upsert error:', upsertError)

      // New user check — no interests row means first login, send to onboarding
      const { data: interests } = await supabase
        .from('user_interests')
        .select('user_id')
        .eq('user_id', user.id)
        .single()

      if (!interests) {
        return NextResponse.redirect(`${origin}/welcome`)
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}

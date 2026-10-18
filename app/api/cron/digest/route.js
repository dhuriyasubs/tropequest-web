import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'
import { getDigestBooks, buildDigestEmail } from '@/lib/digest'

export const maxDuration = 60

// Vercel Cron automatically sends `Authorization: Bearer $CRON_SECRET` on
// requests it triggers, as long as a CRON_SECRET env var is set on the
// project — this just rejects anyone else who finds the URL.
function isAuthorized(request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .eq('email_opt_out', false)

  let sent = 0
  let skipped = 0
  const failed = []

  for (const profile of profiles ?? []) {
    try {
      const { books, topTrope } = await getDigestBooks(profile.id)
      if (!books.length) { skipped++; continue }

      const { subject, html } = buildDigestEmail({ userId: profile.id, books, topTrope })
      await resend.emails.send({
        from:    'TropeQuest <onboarding@resend.dev>',
        to:      profile.email,
        subject,
        html,
      })
      sent++
    } catch (err) {
      failed.push({ email: profile.email, error: err.message })
    }
  }

  return NextResponse.json({ sent, skipped, failed })
}

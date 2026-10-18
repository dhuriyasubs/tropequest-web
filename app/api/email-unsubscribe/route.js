import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  const userId = new URL(request.url).searchParams.get('u')
  if (!userId) return NextResponse.json({ error: 'Missing user id' }, { status: 400 })

  await supabaseAdmin.from('profiles').update({ email_opt_out: true }).eq('id', userId)

  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>Unsubscribed</title></head>
    <body style="font-family:-apple-system,sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#1a1a2e">
      <p style="font-family:Georgia,serif;font-weight:700;font-size:20px;color:#c084a0">TropeQuest</p>
      <h1 style="font-size:18px">You've been unsubscribed</h1>
      <p style="color:#6b7280;font-size:14px">You won't get any more book recommendation emails from us.</p>
      <a href="https://tropequest.com" style="color:#c084a0;font-size:14px">Back to TropeQuest →</a>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}

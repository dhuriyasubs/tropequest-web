import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { name, phone, email, message } = await request.json()

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Name, email and message are required.' }, { status: 400 })
  }

  try {
    await resend.emails.send({
      from:    'TropeQuest Contact <onboarding@resend.dev>',
      to:      process.env.CONTACT_TO_EMAIL,
      subject: `TropeQuest enquiry from ${name.trim()}`,
      text: [
        `Name: ${name.trim()}`,
        `Email: ${email.trim()}`,
        phone?.trim() ? `Phone: ${phone.trim()}` : null,
        ``,
        `Message:`,
        message.trim(),
      ].filter(l => l !== null).join('\n'),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }
}

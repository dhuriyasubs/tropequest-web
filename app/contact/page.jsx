export const metadata = {
  title: 'Contact',
  description: 'Get in touch with the TropeQuest team.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="font-serif text-4xl font-bold mb-6">Contact</h1>
      <div className="space-y-4 text-slate leading-relaxed">
        <p>
          Have a question, a book suggestion, or found a bug? We&apos;d love to hear from you.
        </p>
        <p>
          Email us at{' '}
          <a href="mailto:hello@tropequest.com" className="text-bloom hover:underline underline-offset-2">
            hello@tropequest.com
          </a>
        </p>
        <p className="text-sm text-slate/60">
          We try to respond within 1–2 business days.
        </p>
      </div>
    </div>
  )
}

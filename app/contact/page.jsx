import ContactForm from '@/components/ContactForm'

export const metadata = {
  title: 'Contact',
  description: 'Get in touch with the TropeQuest team.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <h1 className="font-serif text-4xl font-bold mb-2">Contact Us</h1>
      <p className="text-slate mb-8">Have a question, a book suggestion, or found a bug? Send us a message.</p>
      <ContactForm />
    </div>
  )
}

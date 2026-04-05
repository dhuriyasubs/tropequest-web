import Breadcrumb from '@/components/Breadcrumb'

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for TropeQuest.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]} />
      <h1 className="font-serif text-4xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate/60 mb-8">Last updated: April 2025</p>

      <div className="space-y-8 text-slate leading-relaxed">
        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-2">What we collect</h2>
          <p>
            When you create an account, we store your email address and the data you add to TropeQuest — your TBR list, shelf, and reading interests. This data is stored securely in Supabase.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-2">Analytics</h2>
          <p>
            We use Google Analytics to understand how people use the site (page views, search terms, feature usage). No personally identifiable information is shared with Google Analytics.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-2">Cookies</h2>
          <p>
            We use cookies to keep you logged in and to power analytics. We do not use cookies for advertising or sell your data to third parties.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-2">Your data</h2>
          <p>
            You can delete your account and all associated data at any time by reaching out via our{' '}
            <a href="/contact" className="text-bloom hover:underline underline-offset-2">contact page</a>.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-2">Contact</h2>
          <p>
            Questions about this policy? Reach us via our{' '}
            <a href="/contact" className="text-bloom hover:underline underline-offset-2">contact page</a>.
          </p>
        </section>
      </div>
    </div>
  )
}

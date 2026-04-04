import './globals.css'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import Nav from '@/components/Nav'
import Toaster from '@/components/Toaster'
import AuthRedirectHandler from '@/components/AuthRedirectHandler'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata = {
  metadataBase: new URL('https://tropequest.com'),
  title: {
    default: 'TropeQuest — Find Books by Trope',
    template: '%s | TropeQuest',
  },
  description:
    'Discover romance and thriller books by trope, author, mood, and character. ' +
    'Find your next read with TropeQuest.',
  openGraph: {
    type: 'website',
    siteName: 'TropeQuest',
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Toaster />
        <AuthRedirectHandler />
        <footer className="bg-ink text-white/60 text-sm py-8 px-4 mt-16">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between gap-4">
            <p>© {new Date().getFullYear()} TropeQuest</p>
            <p className="text-white/40 text-xs max-w-md">
              TropeQuest participates in affiliate programmes. Purchases via our
              links may earn us a small commission at no extra cost to you.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}

import './globals.css'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import Script from 'next/script'
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
    default: 'TropeQuest: Find Books by Trope',
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
      <head>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-BT9KM61B0S" strategy="afterInteractive" />
        <Script id="ga-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-BT9KM61B0S');
        `}</Script>
      </head>
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Toaster />
        <AuthRedirectHandler />
        <Script id="cuelinks" strategy="afterInteractive">{`
          var cId = '279686';
          (function(d, t) {
            var s = document.createElement('script');
            s.type = 'text/javascript';
            s.async = true;
            s.src = (document.location.protocol == 'https:' ? 'https://cdn0.cuelinks.com/js/' : 'http://cdn0.cuelinks.com/js/') + 'cuelinksv2.js';
            document.getElementsByTagName('body')[0].appendChild(s);
          }());
        `}</Script>
        <footer className="bg-ink text-white/60 text-sm py-10 px-4 mt-16">
          <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-5 gap-8">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <p className="text-white font-semibold">TropeQuest</p>
              <div className="flex flex-col gap-1">
                <a href="/about"   className="hover:text-white transition-colors">About</a>
                <a href="/contact" className="hover:text-white transition-colors">Contact</a>
                <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              </div>
              <p className="pt-2">© {new Date().getFullYear()} TropeQuest</p>
            </div>
            <div className="space-y-2">
              <p className="text-white font-semibold">Discover</p>
              <div className="flex flex-col gap-1">
                <a href="/search"   className="hover:text-white transition-colors">Search books</a>
                <a href="/tropes"   className="hover:text-white transition-colors">Browse tropes</a>
                <a href="/series"   className="hover:text-white transition-colors">Browse series</a>
                <a href="/surprise" className="hover:text-white transition-colors">Surprise me</a>
                <a href="/because"  className="hover:text-white transition-colors">Because you like</a>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-white font-semibold">If you love...</p>
              <div className="flex flex-col gap-1">
                <a href="/books-like/fourth-wing"                className="hover:text-white transition-colors">If you love Fourth Wing</a>
                <a href="/books-like/a-court-of-thorns-and-roses" className="hover:text-white transition-colors">If you love ACOTAR</a>
                <a href="/books-like/colleen-hoover"             className="hover:text-white transition-colors">If you love Colleen Hoover</a>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-white font-semibold">Tools</p>
              <div className="flex flex-col gap-1">
                <a href="/shelf/scan" className="hover:text-white transition-colors">Scan your Shelf</a>
                <a href="/reels"      className="hover:text-white transition-colors">Books from Videos</a>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-white font-semibold">Blog</p>
              <div className="flex flex-col gap-1">
                <a href="/blog"                              className="hover:text-white transition-colors">All posts</a>
                <a href="/blog?category=trope-pages"        className="hover:text-white transition-colors">Trope pages</a>
                <a href="/blog?category=books-like"         className="hover:text-white transition-colors">Books like X</a>
                <a href="/blog?category=tool-platform"      className="hover:text-white transition-colors">Tool/platform</a>
                <a href="/blog?category=blog-informational" className="hover:text-white transition-colors">Blog/informational</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}

import './globals.css'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import Script from 'next/script'
import Nav from '@/components/Nav'
import Toaster from '@/components/Toaster'
import AuthRedirectHandler from '@/components/AuthRedirectHandler'
import GAScripts from '@/components/GAScripts'

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
        <GAScripts />
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
          <nav aria-label="Footer navigation">
          <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">

            {/* Brand */}
            <div className="space-y-2 col-span-2 sm:col-span-3 lg:col-span-1">
              <p className="text-white font-semibold">TropeQuest</p>
              <p className="text-white/50 text-xs leading-relaxed">Find romance and fantasy books by trope, mood, and character. A better way to discover your next read.</p>
              <ul className="flex flex-col gap-1 pt-1">
                <li><a href="/about"   className="hover:text-white transition-colors">About</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
              <p className="pt-2">© {new Date().getFullYear()} TropeQuest</p>
            </div>

            {/* Discover */}
            <div className="space-y-2">
              <p className="text-white font-semibold">Discover</p>
              <ul className="flex flex-col gap-1">
                <li><a href="/search"   className="hover:text-white transition-colors">Search books by trope</a></li>
                <li><a href="/tropes"   className="hover:text-white transition-colors">Browse all tropes</a></li>
                <li><a href="/series"   className="hover:text-white transition-colors">Browse book series</a></li>
                <li><a href="/authors"  className="hover:text-white transition-colors">Browse authors</a></li>
                <li><a href="/because"  className="hover:text-white transition-colors">Books like ones you love</a></li>
                <li><a href="/surprise" className="hover:text-white transition-colors">Surprise me</a></li>
              </ul>
            </div>

            {/* Popular Tropes */}
            <div className="space-y-2">
              <p className="text-white font-semibold">Popular Tropes</p>
              <ul className="flex flex-col gap-1">
                <li><a href="/tropes/enemies-to-lovers"  className="hover:text-white transition-colors">Enemies to Lovers Books</a></li>
                <li><a href="/tropes/slow-burn"          className="hover:text-white transition-colors">Slow Burn Romance Books</a></li>
                <li><a href="/tropes/dark-romance"       className="hover:text-white transition-colors">Dark Romance Books</a></li>
                <li><a href="/tropes/forced-proximity"   className="hover:text-white transition-colors">Forced Proximity Romance</a></li>
                <li><a href="/tropes/morally-grey-hero"  className="hover:text-white transition-colors">Morally Grey Hero Books</a></li>
                <li><a href="/tropes/romantasy"          className="hover:text-white transition-colors">Romantasy Books</a></li>
              </ul>
            </div>

            {/* If you love */}
            <div className="space-y-2">
              <p className="text-white font-semibold">If you love...</p>
              <ul className="flex flex-col gap-1">
                <li><a href="/books-like/fourth-wing"                 className="hover:text-white transition-colors">If you love Fourth Wing</a></li>
                <li><a href="/books-like/a-court-of-thorns-and-roses" className="hover:text-white transition-colors">If you love ACOTAR</a></li>
                <li><a href="/books-like/colleen-hoover"              className="hover:text-white transition-colors">If you love Colleen Hoover</a></li>
              </ul>
            </div>

            {/* Tools */}
            <div className="space-y-2">
              <p className="text-white font-semibold">Tools</p>
              <ul className="flex flex-col gap-1">
                <li><a href="/shelf"      className="hover:text-white transition-colors">My Shelf</a></li>
                <li><a href="/shelf/scan" className="hover:text-white transition-colors">Scan your bookshelf</a></li>
                <li><a href="/reels"      className="hover:text-white transition-colors">Books from videos</a></li>
                <li><a href="/tbr"        className="hover:text-white transition-colors">My TBR list</a></li>
              </ul>
            </div>

            {/* Blog */}
            <div className="space-y-2">
              <p className="text-white font-semibold">Blog</p>
              <ul className="flex flex-col gap-1">
                <li><a href="/blog"                                                 className="hover:text-white transition-colors">All posts</a></li>
                <li><a href="/blog/what-are-book-tropes"                            className="hover:text-white transition-colors">What are book tropes?</a></li>
                <li><a href="/blog/what-is-romantasy-best-books-to-start-with"      className="hover:text-white transition-colors">Best romantasy books</a></li>
                <li><a href="/blog/best-enemies-to-lovers-books"                    className="hover:text-white transition-colors">Best enemies to lovers books</a></li>
                <li><a href="/blog/best-dark-romance-books-for-beginners"           className="hover:text-white transition-colors">Best dark romance books</a></li>
                <li><a href="/blog/goodreads-cant-do-this"                          className="hover:text-white transition-colors">Why readers are leaving Goodreads</a></li>
              </ul>
            </div>

          </div>
          </nav>
        </footer>
      </body>
    </html>
  )
}

import { Suspense } from 'react'
import Link from 'next/link'
import BookCard from '@/components/BookCard'
import HeroGrid from '@/components/HeroGrid'
import DiscoverStrip from '@/components/DiscoverStrip'
import ScrollReveal from '@/components/ScrollReveal'
import SeriesCompletionSection from '@/components/SeriesCompletionSection'
import { getFeaturedBooks, getPopularTropes, getPersonalizedBooks, getSeriesCompletionBooks, getBecauseYouReadBooks } from '@/lib/search'
import { createSupabaseServer } from '@/lib/supabase'
import { getAllPosts } from '@/lib/blog'
import PageViewTracker from '@/components/PageViewTracker'

export const dynamic = 'force-dynamic'

export const metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
}

// ── Personalized sections — streamed in after shell ───────────────────────
async function PersonalisedSections({ userId }) {
  const supabase = createSupabaseServer()

  const [interestsRes, shelfRes] = await Promise.all([
    supabase.from('user_interests').select('tropes, subjects, authors').eq('user_id', userId).single(),
    supabase.from('shelf').select('book_id').eq('user_id', userId).eq('status', 'read'),
  ])

  const interests = (interestsRes.data?.tropes?.length || interestsRes.data?.subjects?.length || interestsRes.data?.authors?.length)
    ? interestsRes.data : null
  const readBookIds = (shelfRes.data ?? []).map(r => r.book_id)

  const [personalizedBooks, seriesBooks, becauseYouRead] = await Promise.all([
    interests ? getPersonalizedBooks({ ...interests, excludeIds: readBookIds }) : Promise.resolve([]),
    getSeriesCompletionBooks(userId),
    getBecauseYouReadBooks(userId),
  ])

  return (
    <>
      {personalizedBooks.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-6 md:py-10">
          <h2 className="font-serif text-2xl font-semibold mb-1">Picked for You</h2>
          <p className="text-sm text-slate mb-5">Based on your interests</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {personalizedBooks.map(book => (
              <BookCard key={book.id} book={book} section="picked_for_you" />
            ))}
          </div>
        </section>
      )}

      <SeriesCompletionSection series={seriesBooks} />

      {becauseYouRead?.books?.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-6 md:py-10">
          <h2 className="font-serif text-2xl font-semibold mb-1">
            Because you read <span className="text-bloom italic">{becauseYouRead.seedTitle}</span>
          </h2>
          <p className="text-sm text-slate mb-5">Books with similar tropes you might love</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {becauseYouRead.books.slice(0, 12).map(book => (
              <BookCard key={book.id} book={book} section="because_you_read" />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function PersonalisedSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-10">
      {[1, 2].map(i => (
        <div key={i}>
          <div className="h-6 w-48 bg-gray-100 rounded animate-pulse mb-2" />
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-5" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="aspect-[2/3] bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default async function HomePage() {
  // Kick off cached public fetches immediately — don't wait for auth
  const publicPromise = Promise.all([
    getFeaturedBooks(12),
    getPopularTropes(50),
  ])

  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const [books, popularTropes] = await publicPromise
  const latestPosts = getAllPosts().slice(0, 3)

  return (
    <>
      <PageViewTracker pageType="home" />
      <HeroGrid tropes={popularTropes} />
      <DiscoverStrip />

      {user && (
        <Suspense fallback={<PersonalisedSkeleton />}>
          <PersonalisedSections userId={user.id} />
        </Suspense>
      )}

      {latestPosts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-6 md:py-10">
          <ScrollReveal>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-serif text-2xl font-semibold">From the Blog</h2>
              <Link href="/blog" className="text-sm text-bloom hover:underline">View all →</Link>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {latestPosts.map((post, i) => (
              <ScrollReveal key={post.slug} delay={i * 110} className="h-full">
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col h-full p-5 rounded-xl border border-petal/40 hover:border-bloom/40 hover:bg-petal/10 no-underline"
                  style={{ transition: 'background-color 0.25s cubic-bezier(0.4,0,0.2,1), border-color 0.25s cubic-bezier(0.4,0,0.2,1)' }}
                >
                  <p className="text-xs text-slate/50 mb-2">
                    {new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {post.readingTime && ` · ${post.readingTime} min read`}
                  </p>
                  <p className="font-serif font-semibold text-ink group-hover:text-bloom leading-snug mb-2"
                    style={{ transition: 'color 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
                    {post.title}
                  </p>
                  <p className="text-sm text-slate/70 line-clamp-2 leading-relaxed">
                    {post.description}
                  </p>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 py-6 pb-12 md:py-10 md:pb-16">
        <ScrollReveal>
          <h2 className="font-serif text-2xl font-semibold mb-5">Top Rated</h2>
        </ScrollReveal>
        <ScrollReveal delay={120}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {books.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </ScrollReveal>
        <div className="mt-8 text-center">
          <Link href="/search" className="btn-primary">
            Browse all books
          </Link>
        </div>
      </section>
    </>
  )
}

export const metadata = {
  title: 'About TropeQuest',
  description: 'TropeQuest helps readers discover romance, fantasy, and thriller books by the tropes they actually love.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="font-serif text-4xl font-bold mb-6">About TropeQuest</h1>
      <div className="prose prose-slate max-w-none space-y-4 text-slate leading-relaxed">
        <p>
          TropeQuest exists for readers who know exactly what they want — enemies to lovers, slow burn, dark romance, morally grey anti-heroes — but spend more time searching than reading.
        </p>
        <p>
          We curate 1,000+ titles across romance, fantasy, and thriller so you can filter by the tropes, moods, and vibes that matter to you, not just genre categories that are too broad to be useful.
        </p>
        <p>
          Features include trope-based search, a personal TBR list, shelf tracking, Surprise Me for when you&apos;re indecisive, and a video extractor that pulls book recommendations straight from BookTok and Bookstagram reels.
        </p>
        <p>
          Built by a reader, for readers.
        </p>
      </div>
    </div>
  )
}

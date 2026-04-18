import Link from 'next/link'

const FEATURES = [
  {
    href: '/reels',
    icon: '🎬',
    title: 'Books from Videos',
    body: 'Paste a YouTube URL. We transcribe it and pull out every book mentioned.',
  },
  {
    href: '/shelf/import',
    icon: '📚',
    title: 'Import from Goodreads',
    body: 'Upload your Goodreads CSV and bring your entire reading history into TropeQuest.',
  },
  {
    href: '/shelf',
    icon: '📷',
    title: 'Scan Your Shelf',
    body: 'Photograph your bookshelf and we\'ll identify and add every book to your virtual shelf.',
  },
]

export default function FeaturePromo() {
  return (
    <section className="mt-14 pt-10 border-t border-gray-100">
      <p className="text-xs font-semibold text-slate uppercase tracking-wide mb-4">More from TropeQuest</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FEATURES.map(f => (
          <Link
            key={f.href}
            href={f.href}
            className="group flex flex-col gap-2 rounded-xl border border-gray-200 px-4 py-4 hover:border-bloom/40 hover:bg-petal/10 transition-colors no-underline"
          >
            <span className="text-2xl">{f.icon}</span>
            <p className="text-sm font-semibold text-ink group-hover:text-bloom transition-colors leading-snug">{f.title}</p>
            <p className="text-xs text-slate leading-relaxed">{f.body}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

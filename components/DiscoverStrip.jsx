import Link from 'next/link'

const MODES = [
  {
    href: '/surprise',
    icon: '✦',
    label: 'Surprise Me',
    hook: 'Swipe picks tailored to your taste',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-500',
  },
  {
    href: '/because',
    icon: '📖',
    label: 'Because You Like…',
    hook: 'Start from a book you loved',
    bg: 'bg-bloom/5',
    border: 'border-bloom/20',
    iconColor: 'text-bloom',
  },
  {
    href: '/shelf',
    icon: '📷',
    label: 'Scan Your Shelf',
    hook: 'Photo your bookshelf to import reads',
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconColor: 'text-green-500',
  },
  {
    href: '/tropes',
    icon: '🏷',
    label: 'Browse Tropes',
    hook: 'Pick the tropes that define you',
    bg: 'bg-petal/10',
    border: 'border-petal/30',
    iconColor: 'text-petal',
  },
  {
    href: '/series',
    icon: '📚',
    label: 'Browse Series',
    hook: 'Find your next binge-worthy series',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    iconColor: 'text-indigo-400',
  },
  {
    href: '/reels',
    icon: '🎬',
    label: 'Books from Videos',
    hook: 'Paste a video link, get every book mentioned',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    iconColor: 'text-rose-500',
  },
]

export default function DiscoverStrip() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-5 md:py-8">
      <h2 className="font-serif text-xl font-semibold mb-4 text-ink">How do you want to discover?</h2>
      {/* Horizontal scroll on mobile, grid on md+ */}
      <div
        className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-6 md:overflow-visible md:pb-0"
        style={{ scrollbarWidth: 'none' }}
      >
        {MODES.map(m => (
          <Link
            key={m.href}
            href={m.href}
            className={`flex-shrink-0 w-44 md:w-auto flex flex-col gap-2 p-4 rounded-2xl border ${m.bg} ${m.border} hover:shadow-md transition-shadow`}
          >
            <span className={`text-2xl ${m.iconColor}`}>{m.icon}</span>
            <p className="font-semibold text-sm text-ink leading-tight">{m.label}</p>
            <p className="text-xs text-slate leading-snug">{m.hook}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

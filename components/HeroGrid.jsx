'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Visual properties for each spine — names get overridden by real DB tropes when available
const SHELF_A_BASE = [
  { c: '#7a1f1f', h: 152, w: 34 },
  { c: '#3e1a5c', h: 168, w: 30 },
  { c: '#5c1a3e', h: 138, w: 36 },
  { c: '#1a4e3e', h: 158, w: 28 },
  { c: '#1e1e5c', h: 132, w: 34 },
  { c: '#4e3a1a', h: 162, w: 30 },
  { c: '#4e1e1a', h: 144, w: 38 },
  { c: '#1a3e5c', h: 156, w: 30 },
  { c: '#3e4a1a', h: 128, w: 34 },
  { c: '#4a1a3e', h: 148, w: 28 },
]
const SHELF_A_NAMES = [
  'Enemies to Lovers', 'Dark Romance', 'Forbidden Love', 'Slow Burn',
  'Mafia Romance', 'Age Gap', 'Grumpy × Sunshine', 'Fake Dating',
  'Forced Proximity', 'Second Chance',
]

const SHELF_B_BASE = [
  { c: '#101e2a', h: 146, w: 32 },
  { c: '#2a1e10', h: 130, w: 36 },
  { c: '#2a1026', h: 160, w: 28 },
  { c: '#10261e', h: 140, w: 34 },
  { c: '#10262a', h: 122, w: 38 },
  { c: '#1e102a', h: 154, w: 30 },
  { c: '#1e2a10', h: 136, w: 34 },
  { c: '#2a2610', h: 126, w: 28 },
  { c: '#102a26', h: 148, w: 32 },
  { c: '#26102a', h: 142, w: 36 },
]
const SHELF_B_NAMES = [
  'Psychological Thriller', 'Whodunnit', 'Anti-hero', 'Unreliable Narrator',
  'Heist', 'Secret Identity', 'Redemption Arc', 'Bodyguard Romance',
  'Found Family', 'Morally Grey',
]

function BookShelf({ books, hoveredTrope, onHover }) {
  return (
    <div>
      <div className="flex items-end gap-[3px]">
        {books.map((book) => {
          const isHot = hoveredTrope === book.t
          return (
            <a
              key={book.t}
              href={`/search?tropes=${encodeURIComponent(book.t)}`}
              className="relative flex-shrink-0"
              style={{ width: book.w, height: book.h }}
              onMouseEnter={() => onHover(book.t)}
              onMouseLeave={() => onHover(null)}
            >
              <div
                className="w-full h-full rounded-t-[2px] transition-all duration-300 flex items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: book.c,
                  filter: isHot ? 'brightness(2.2)' : 'brightness(0.6)',
                  boxShadow: isHot
                    ? '0 0 22px 6px rgba(251,191,36,0.38), -2px 0 8px rgba(0,0,0,0.6)'
                    : '-1px 0 6px rgba(0,0,0,0.5)',
                }}
              >
                <span
                  className="text-white/70 whitespace-nowrap overflow-hidden text-ellipsis select-none"
                  style={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    fontSize: '8px',
                    letterSpacing: '0.06em',
                    maxHeight: '92%',
                  }}
                >
                  {book.t}
                </span>
              </div>
            </a>
          )
        })}
      </div>
      {/* Shelf plank */}
      <div
        className="h-3 rounded-[2px] mt-0.5"
        style={{
          background: 'linear-gradient(180deg, #8b5e34 0%, #3d2010 100%)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.75)',
        }}
      />
    </div>
  )
}

export default function HeroGrid({ tropes }) {
  const router = useRouter()
  const [hoveredTrope, setHoveredTrope] = useState(null)

  // Populate shelf names from real DB tropes when available
  const shelfA = SHELF_A_BASE.map((b, i) => ({
    ...b,
    t: tropes?.[i] ?? SHELF_A_NAMES[i],
  }))
  const shelfB = SHELF_B_BASE.map((b, i) => ({
    ...b,
    t: tropes?.[SHELF_A_BASE.length + i] ?? SHELF_B_NAMES[i],
  }))
  const allTropes = tropes?.length > 0
    ? tropes
    : [...SHELF_A_NAMES, ...SHELF_B_NAMES]

  function handleSurprise() {
    const pick = allTropes[Math.floor(Math.random() * allTropes.length)]
    router.push(`/search?tropes=${encodeURIComponent(pick)}`)
  }

  return (
    <section className="bg-[#1a1a2e] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row min-h-[580px]">

        {/* ── Left: Hero Copy ── */}
        <div className="flex-1 flex flex-col justify-center px-8 py-16 md:py-20 lg:px-16">
          <p className="text-amber-400/65 text-xs font-semibold tracking-widest uppercase mb-5">
            Romance · Thriller · Dark Fiction
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-tight mb-6 max-w-lg">
            The ultimate map to your specific{' '}
            <span className="text-petal italic">'type'.</span>
          </h1>
          <p className="text-white/50 text-base sm:text-lg mb-10 max-w-sm leading-relaxed">
            Why settle? Choose the tropes that define your perfect escape
            from 1000+ curated titles.
          </p>

          <a
            href="/search"
            className="self-start inline-block bg-amber-500 hover:bg-amber-400
                       text-[#1a1a2e] font-bold px-8 py-3.5 rounded-xl text-sm
                       transition-colors duration-200 shadow-lg shadow-amber-500/25 mb-10"
          >
            Discover Your Tropes
          </a>

          {/* Three entry points */}
          <div className="flex flex-wrap gap-3">
            <a
              href="/search?q=romance"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-petal/30
                         bg-petal/5 hover:bg-petal/15 text-petal text-xs font-semibold
                         transition-colors duration-200"
            >
              ♥ The Romance Quest
            </a>
            <a
              href="/search?q=thriller"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-blue-400/30
                         bg-blue-400/5 hover:bg-blue-400/15 text-blue-300 text-xs font-semibold
                         transition-colors duration-200"
            >
              ◈ The Thriller Quest
            </a>
            <button
              onClick={handleSurprise}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-400/30
                         bg-amber-400/5 hover:bg-amber-400/15 text-amber-300 text-xs font-semibold
                         transition-colors duration-200"
            >
              ✦ Surprise Me
            </button>
          </div>
        </div>

        {/* ── Right: Library Visualization ── */}
        <div className="flex-1 relative flex flex-col justify-center px-6 py-12 md:py-20 md:pr-12 overflow-hidden">

          {/* Warm candlelight glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 50% 48%, rgba(251,191,36,0.12) 0%, rgba(251,191,36,0.05) 55%, transparent 100%)',
            }}
          />
          {/* Top fade into page */}
          <div
            className="absolute inset-x-0 top-0 h-24 pointer-events-none z-10"
            style={{ background: 'linear-gradient(to bottom, #1a1a2e, transparent)' }}
          />
          {/* Bottom fade */}
          <div
            className="absolute inset-x-0 bottom-0 h-16 pointer-events-none z-10"
            style={{ background: 'linear-gradient(to top, #1a1a2e, transparent)' }}
          />

          {/* Shelves */}
          <div className="relative z-20 space-y-7">
            <BookShelf books={shelfA} hoveredTrope={hoveredTrope} onHover={setHoveredTrope} />
            <BookShelf books={shelfB} hoveredTrope={hoveredTrope} onHover={setHoveredTrope} />
          </div>

          {/* Floating trope label */}
          <div className="relative z-20 mt-7 h-7 flex items-center justify-center">
            {hoveredTrope && (
              <p className="text-amber-300 text-sm font-semibold tracking-wide">
                ✦ {hoveredTrope}
              </p>
            )}
          </div>
        </div>

      </div>
    </section>
  )
}

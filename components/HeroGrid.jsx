'use client'
import { useState, useRef, useCallback } from 'react'

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
  const containerRef = useRef(null)
  const [offsets, setOffsets] = useState({})

  const handleMouseMove = useCallback((e) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    const next = {}
    let xCursor = 0
    for (const book of books) {
      const cx = xCursor + book.w / 2
      const cy = rect.height - book.h / 2
      const dx = mx - cx
      const dy = my - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const threshold = 85
      if (dist < threshold && dist > 0) {
        const force = (1 - dist / threshold) * 9
        next[book.t] = { x: (dx / dist) * force, y: (dy / dist) * force * 0.45 }
      }
      xCursor += book.w + 3
    }
    setOffsets(next)
  }, [books])

  const handleMouseLeave = useCallback(() => setOffsets({}), [])

  return (
    <div ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <div className="flex items-end gap-[3px]">
        {books.map((book) => {
          const isHot = hoveredTrope === book.t
          const off = offsets[book.t] ?? { x: 0, y: 0 }
          return (
            <a
              key={book.t}
              href={`/search?tropes=${encodeURIComponent(book.t)}`}
              className="relative flex-shrink-0"
              style={{
                width: book.w,
                height: book.h,
                transform: `translate(${off.x}px, ${off.y}px)`,
                transition: 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
                willChange: 'transform',
              }}
              onMouseEnter={() => onHover(book.t)}
              onMouseLeave={() => onHover(null)}
            >
              <div
                className="w-full h-full rounded-t-[2px] flex items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: book.c,
                  filter: isHot ? 'brightness(2.2)' : 'brightness(0.6)',
                  boxShadow: isHot
                    ? '0 0 22px 6px rgba(251,191,36,0.38), -2px 0 8px rgba(0,0,0,0.6)'
                    : '-1px 0 6px rgba(0,0,0,0.5)',
                  transform: isHot ? 'scaleY(1.03)' : 'scaleY(1)',
                  transition: 'filter 0.28s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.28s cubic-bezier(0.4, 0, 0.2, 1), transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
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
  const [hoveredTrope, setHoveredTrope] = useState(null)

  const shelfA = SHELF_A_BASE.map((b, i) => ({
    ...b,
    t: tropes?.[i] ?? SHELF_A_NAMES[i],
  }))
  const shelfB = SHELF_B_BASE.map((b, i) => ({
    ...b,
    t: tropes?.[SHELF_A_BASE.length + i] ?? SHELF_B_NAMES[i],
  }))

  return (
    <section className="bg-[#1a1a2e] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:min-h-[380px]">

        {/* ── Left: Hero Copy ── */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8 md:py-10 md:px-8 lg:px-16">
          <p className="hero-l1 text-amber-400/65 text-xs font-semibold tracking-widest uppercase mb-3">
            Romance · Thriller · Dark Fiction
          </p>
          <h1 className="hero-l2 font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-tight mb-3 md:mb-4 max-w-lg">
            The ultimate map to your specific{' '}
            <span className="text-petal italic">&lsquo;type&rsquo;.</span>
          </h1>
          <p className="hero-l3 text-white/50 text-sm sm:text-base mb-6 md:mb-7 max-w-sm leading-relaxed">
            Why settle? Choose the tropes that define your perfect escape
            from 1000+ curated titles.
          </p>

          <a
            href="/search"
            className="hero-l4 self-start inline-block bg-amber-500 hover:bg-amber-400
                       text-[#1a1a2e] font-bold px-7 py-3 md:px-8 md:py-3.5 rounded-xl text-sm
                       shadow-lg shadow-amber-500/25"
            style={{ transition: 'background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(245,158,11,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
          >
            Find your next read
          </a>
        </div>

        {/* ── Right: Library Visualization (desktop only) ── */}
        <div className="hero-shelf hidden md:flex flex-1 relative flex-col justify-center px-6 py-8 md:py-10 md:pr-12 overflow-hidden">

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 50% 48%, rgba(251,191,36,0.12) 0%, rgba(251,191,36,0.05) 55%, transparent 100%)',
            }}
          />
          <div
            className="absolute inset-x-0 top-0 h-24 pointer-events-none z-10"
            style={{ background: 'linear-gradient(to bottom, #1a1a2e, transparent)' }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-16 pointer-events-none z-10"
            style={{ background: 'linear-gradient(to top, #1a1a2e, transparent)' }}
          />

          <div className="relative z-20 space-y-7">
            <BookShelf books={shelfA} hoveredTrope={hoveredTrope} onHover={setHoveredTrope} />
            <BookShelf books={shelfB} hoveredTrope={hoveredTrope} onHover={setHoveredTrope} />
          </div>

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

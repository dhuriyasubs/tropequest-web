'use client'
import Link from 'next/link'
import { useRef } from 'react'

const MODES = [
  {
    href: '/surprise',
    icon: '✦',
    label: 'Surprise Me',
    hook: 'Swipe picks tailored to your taste',
    bg: 'bg-amber-50/80',
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
    bg: 'bg-green-50/80',
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
    bg: 'bg-indigo-50/80',
    border: 'border-indigo-200',
    iconColor: 'text-indigo-400',
  },
  {
    href: '/reels',
    icon: '🎬',
    label: 'Books from Videos',
    hook: 'Paste a video link, get every book mentioned',
    bg: 'bg-rose-50/80',
    border: 'border-rose-200',
    iconColor: 'text-rose-500',
  },
]

function TiltCard({ m }) {
  const ref = useRef(null)

  function onMove(e) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width  - 0.5
    const y = (e.clientY - r.top)  / r.height - 0.5
    el.style.transform = `perspective(700px) rotateX(${-y * 11}deg) rotateY(${x * 11}deg) translateZ(8px)`
    el.style.boxShadow = '0 14px 36px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)'
  }

  function onLeave() {
    const el = ref.current
    if (!el) return
    el.style.transform = ''
    el.style.boxShadow = ''
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        transition: 'transform 0.42s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.42s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform',
        transformStyle: 'preserve-3d',
      }}
      className="flex-shrink-0 w-44 md:w-auto"
    >
      <Link
        href={m.href}
        className={`flex flex-col gap-2 p-4 rounded-2xl border backdrop-blur-sm h-full
          ${m.bg} ${m.border}
          transition-colors duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]`}
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)' }}
      >
        <span className={`text-2xl ${m.iconColor}`}>{m.icon}</span>
        <p className="font-semibold text-sm text-ink leading-tight">{m.label}</p>
        <p className="text-xs text-slate leading-snug">{m.hook}</p>
      </Link>
    </div>
  )
}

export default function DiscoverStrip() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-5 md:py-8">
      <h2 className="font-serif text-xl font-semibold mb-4 text-ink">How do you want to discover?</h2>
      <div
        className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-6 md:overflow-visible md:pb-0"
        style={{ scrollbarWidth: 'none' }}
      >
        {MODES.map(m => <TiltCard key={m.href} m={m} />)}
      </div>
    </section>
  )
}

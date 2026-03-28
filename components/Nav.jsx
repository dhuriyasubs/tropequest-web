'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/search',  label: 'Browse' },
  { href: '/tropes',  label: 'Tropes' },
]

export default function Nav() {
  const path = usePathname()
  return (
    <header className="bg-white border-b border-petal/30 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-bold text-bloom">
          TropeQuest
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={path.startsWith(l.href) ? 'text-bloom' : 'text-ink/70 hover:text-ink'}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}

'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

const links = [
  { href: '/search', label: 'Browse' },
  { href: '/tropes', label: 'Tropes' },
]

export default function Nav() {
  const path    = usePathname()
  const router  = useRouter()
  const [user, setUser]       = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const supabase = createSupabaseBrowser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function signOut() {
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    setMenuOpen(false)
    router.refresh()
  }

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

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center focus:outline-none"
                aria-label="User menu"
              >
                {user.user_metadata?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="avatar"
                    className="w-7 h-7 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-bloom text-white text-xs flex items-center justify-center font-semibold">
                    {(user.email?.[0] ?? '?').toUpperCase()}
                  </div>
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-9 w-48 bg-white border border-petal/30 rounded-xl shadow-lg py-1.5 z-50">
                  <Link
                    href="/tbr"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-gray-50"
                  >
                    My TBR
                  </Link>
                  <Link
                    href="/interests"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-gray-50"
                  >
                    Manage Interests
                  </Link>
                  <hr className="my-1 border-petal/20" />
                  <button
                    onClick={signOut}
                    className="w-full text-left px-4 py-2 text-sm text-slate hover:bg-gray-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium bg-bloom text-white px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

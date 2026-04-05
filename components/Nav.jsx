'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import NavSearch from '@/components/NavSearch'

const browseItems = [
  { href: '/tropes',   label: 'Browse Tropes'   },
  { href: '/series',   label: 'Browse Series'   },
  { href: '/author',   label: 'Browse Authors'  },
]

const menuItems = [
  { href: '/shelf',     label: 'My Shelf'         },
  { href: '/tbr',       label: 'My TBR'           },
  { href: '/interests', label: 'Manage Interests'  },
]

export default function Nav() {
  const path    = usePathname()
  const router  = useRouter()
  const [user, setUser]         = useState(null)
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

  function handleProtectedLink(href) {
    setMenuOpen(false)
    if (!user) {
      sessionStorage.setItem('authRedirect', href)
      router.push('/login')
    } else {
      router.push(href)
    }
  }

  return (
    <header className="bg-white border-b border-petal/30 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-bold text-bloom flex-shrink-0">
          TropeQuest
        </Link>

        <div className="flex items-center gap-2 flex-shrink-0" ref={menuRef}>
          {path !== '/search' && <NavSearch />}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center justify-center focus:outline-none"
            aria-label="Menu"
          >
            {user ? (
              user.user_metadata?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.user_metadata.avatar_url}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent hover:ring-bloom/40 transition-all"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-bloom text-white text-xs flex items-center justify-center font-semibold">
                  {(user.email?.[0] ?? '?').toUpperCase()}
                </div>
              )
            ) : menuOpen ? (
              <svg className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 w-52 bg-white border border-petal/30 rounded-xl shadow-lg py-1.5 z-50">
              {browseItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center px-4 py-2.5 text-sm hover:bg-gray-50 ${
                    path === item.href ? 'text-bloom font-medium' : 'text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              <hr className="my-1 border-petal/20" />

              {menuItems.map(item => (
                <button
                  key={item.href}
                  onClick={() => handleProtectedLink(item.href)}
                  className={`w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 ${
                    path === item.href ? 'text-bloom font-medium' : 'text-ink'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <hr className="my-1 border-petal/20" />

              {user ? (
                <button
                  onClick={signOut}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate hover:bg-gray-50"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center px-4 py-2.5 text-sm text-bloom font-medium hover:bg-gray-50"
                >
                  Sign in
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

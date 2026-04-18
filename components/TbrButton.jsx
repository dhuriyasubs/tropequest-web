'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

export default function TbrButton({ bookId, initialSaved = false, size = 'md', id }) {
  const [saved,   setSaved]   = useState(initialSaved)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle(e) {
    e.preventDefault()
    e.stopPropagation()

    const supabase = createSupabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      sessionStorage.setItem('authRedirect', window.location.pathname)
      router.push('/login')
      return
    }

    setLoading(true)
    const res = await fetch('/api/tbr', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ bookId }),
    })
    if (res.ok) {
      const { saved: newSaved } = await res.json()
      setSaved(newSaved)
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: newSaved ? 'Added to TBR' : 'Removed from TBR' },
      }))
    }
    setLoading(false)
  }

  const sz = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <button
      id={id}
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? 'Remove from TBR' : 'Add to TBR'}
      title={saved ? 'Remove from TBR' : 'Add to TBR'}
      className={`transition-colors ${loading ? 'opacity-50' : ''} ${
        saved ? 'text-bloom' : 'text-slate/50 hover:text-bloom'
      }`}
    >
      {saved ? (
        <svg className={sz} viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5z" />
        </svg>
      ) : (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5z" />
        </svg>
      )}
    </button>
  )
}

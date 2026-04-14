'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

export default function BlogTbrButton({ bookId, blogTitle }) {
  const [saved,   setSaved]   = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function addToTbr(e) {
    e.preventDefault()
    e.stopPropagation()
    if (saved) return

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
      body:    JSON.stringify({
        bookIds: [bookId],
        source:  `blog:${blogTitle}`,
      }),
    })
    if (res.ok) {
      setSaved(true)
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Added to TBR' },
      }))
    }
    setLoading(false)
  }

  return (
    <button
      onClick={addToTbr}
      disabled={loading || saved}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
        saved
          ? 'bg-bloom/10 text-bloom border-bloom/30 cursor-default'
          : 'bg-white text-slate border-petal/40 hover:border-bloom hover:text-bloom'
      } ${loading ? 'opacity-50' : ''}`}
    >
      {saved ? (
        <>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5z" />
          </svg>
          Saved to TBR
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5z" />
          </svg>
          {loading ? 'Saving…' : 'Add to TBR'}
        </>
      )}
    </button>
  )
}

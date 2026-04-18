'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import ShelfStatusSelect from '@/components/ShelfStatusSelect'
import { trackEvent } from '@/lib/events'

function ShelfIcon({ filled, className }) {
  return filled ? (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="4" height="18" rx="1"/>
      <rect x="10" y="6" width="4" height="15" rx="1"/>
      <rect x="17" y="4" width="4" height="17" rx="1"/>
      <rect x="2" y="20" width="20" height="2" rx="1"/>
    </svg>
  ) : (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="4" height="18" rx="1"/>
      <rect x="10" y="6" width="4" height="15" rx="1"/>
      <rect x="17" y="4" width="4" height="17" rx="1"/>
      <rect x="2" y="20" width="20" height="2" rx="1"/>
    </svg>
  )
}

export default function ShelfControls({ bookId, initialStatus = null }) {
  const [status, setStatus] = useState(initialStatus)
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
    const res = await fetch('/api/shelf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, status: status ? null : 'owned' }),
    })
    if (res.ok) {
      const { status: newStatus } = await res.json()
      setStatus(newStatus)
      trackEvent('shelf_action', { book_id: bookId, action: newStatus ? 'add' : 'remove', status: newStatus })
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: newStatus ? 'Added to shelf' : 'Removed from shelf' },
      }))
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={loading}
        aria-label={status ? 'Remove from shelf' : 'Add to shelf'}
        title={status ? 'Remove from shelf' : 'Add to shelf'}
        className={`transition-colors ${loading ? 'opacity-50' : ''} ${
          status ? 'text-bloom' : 'text-slate/50 hover:text-bloom'
        }`}
      >
        <ShelfIcon filled={!!status} className="w-5 h-5" />
      </button>
      {status && (
        <ShelfStatusSelect bookId={bookId} currentStatus={status} onStatusChange={setStatus} />
      )}
    </div>
  )
}

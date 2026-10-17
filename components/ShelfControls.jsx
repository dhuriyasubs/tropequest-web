'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import ShelfStatusSelect from '@/components/ShelfStatusSelect'
import ShelfFormatToggle from '@/components/ShelfFormatToggle'
import ShelfMemberTag from '@/components/ShelfMemberTag'
import ShelfAddDefaults from '@/components/ShelfAddDefaults'
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

export default function ShelfControls({
  bookId,
  initialStatus = null,
  initialFormat = 'physical',
  initialMember = null,
  knownMembers = [],
}) {
  const [status, setStatus] = useState(initialStatus)
  const [format, setFormat] = useState(initialFormat)
  const [member, setMember] = useState(initialMember)
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [defaults, setDefaults] = useState({ status: 'unread', format: 'physical', member: null })
  const boxRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  async function onIconClick(e) {
    e.preventDefault()
    e.stopPropagation()

    const supabase = createSupabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      sessionStorage.setItem('authRedirect', window.location.pathname)
      router.push('/login')
      return
    }

    if (status) {
      setLoading(true)
      const res = await fetch('/api/shelf', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bookId, status: null }),
      })
      if (res.ok) {
        setStatus(null)
        trackEvent('shelf_action', { book_id: bookId, action: 'remove' })
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Removed from shelf' } }))
      }
      setLoading(false)
      return
    }

    setOpen(o => !o)
  }

  async function confirmAdd() {
    setLoading(true)
    const res = await fetch('/api/shelf', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ bookId, status: defaults.status, format: defaults.format, member: defaults.member }),
    })
    if (res.ok) {
      const data = await res.json()
      setStatus(data.status)
      setFormat(data.format)
      setMember(data.member_label)
      setOpen(false)
      trackEvent('shelf_action', { book_id: bookId, action: 'add', status: data.status })
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Added to shelf' } }))
    }
    setLoading(false)
  }

  return (
    <div className="relative" ref={boxRef}>
      <div className="flex items-center gap-2">
        <button
          onClick={onIconClick}
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
          <>
            <ShelfStatusSelect bookId={bookId} currentStatus={status} onStatusChange={setStatus} />
            <ShelfFormatToggle bookId={bookId} currentFormat={format} />
            <ShelfMemberTag bookId={bookId} currentMember={member} knownMembers={knownMembers} />
          </>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-8 z-30 w-64 bg-white border border-petal/30 rounded-2xl shadow-xl overflow-hidden">
          <ShelfAddDefaults
            status={defaults.status}
            format={defaults.format}
            member={defaults.member}
            knownMembers={knownMembers}
            onChange={patch => setDefaults(d => ({ ...d, ...patch }))}
          />
          <div className="p-2">
            <button
              type="button"
              onClick={confirmAdd}
              disabled={loading}
              className="w-full text-xs font-semibold bg-bloom text-white py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Adding…' : 'Add to shelf'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trackEvent } from '@/lib/events'

const OPTIONS = [
  { value: 'unread',  label: 'Unread'  },
  { value: 'reading', label: 'Reading' },
  { value: 'read',    label: 'Read'    },
]

const COLORS = {
  unread:  'bg-petal/30 text-plum',
  reading: 'bg-bloom/20 text-bloom',
  read:    'bg-green-100 text-green-700',
}

export default function ShelfStatusSelect({ bookId, currentStatus, onStatusChange }) {
  const [status,  setStatus]  = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onChange(e) {
    const newStatus = e.target.value
    setStatus(newStatus)
    onStatusChange?.(newStatus)
    setLoading(true)
    await fetch('/api/shelf', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ bookId, status: newStatus }),
    })
    trackEvent('shelf_action', { book_id: bookId, action: 'status_change', status: newStatus })
    setLoading(false)
    router.refresh()
  }

  return (
    <select
      value={status}
      onChange={onChange}
      disabled={loading}
      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-bloom/30 shrink-0 ${COLORS[status] ?? 'bg-gray-100 text-slate'}`}
    >
      {OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

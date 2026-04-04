'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ShelfInlineSearch({ initialQuery = '', activeStatus, className = '' }) {
  const [value, setValue] = useState(initialQuery)
  const router = useRouter()

  function onSubmit(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (activeStatus) params.set('status', activeStatus)
    if (value.trim()) params.set('q', value.trim())
    const qs = params.toString()
    router.push(qs ? `/shelf?${qs}` : '/shelf')
  }

  function onClear() {
    setValue('')
    const params = new URLSearchParams()
    if (activeStatus) params.set('status', activeStatus)
    router.push(activeStatus ? `/shelf?status=${activeStatus}` : '/shelf')
  }

  return (
    <form onSubmit={onSubmit} className={`relative ${className}`}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate/50 pointer-events-none"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Search your shelf by title or author…"
        className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-petal/30 bg-white focus:outline-none focus:ring-2 focus:ring-bloom/30 text-ink placeholder:text-slate/50"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate/50 hover:text-ink"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </form>
  )
}

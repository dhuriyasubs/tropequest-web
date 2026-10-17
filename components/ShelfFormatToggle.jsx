'use client'
import { useState } from 'react'

export default function ShelfFormatToggle({ bookId, currentFormat = 'physical' }) {
  const [format,  setFormat]  = useState(currentFormat)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    const next = format === 'virtual' ? 'physical' : 'virtual'
    const prev = format
    setFormat(next) // optimistic
    setLoading(true)
    const res = await fetch('/api/shelf', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ bookId, format: next }),
    })
    if (!res.ok) setFormat(prev)
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      title={format === 'virtual' ? 'Virtual copy (Kindle/ebook) — click to mark physical' : 'Physical copy — click to mark virtual (Kindle/ebook)'}
      className={`text-xs font-medium px-2 py-1 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
        format === 'virtual' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-slate'
      }`}
    >
      {format === 'virtual' ? 'Virtual' : 'Physical'}
    </button>
  )
}

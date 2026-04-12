'use client'
import { useState } from 'react'

export default function ProfileForm({ email, name: initialName }) {
  const [name,    setName]    = useState(initialName)
  const [saving,  setSaving]  = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setError(null)

    const res = await fetch('/api/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name }),
    })
    const data = await res.json()

    setSaving(false)
    if (data.ok) setSuccess(true)
    else setError(data.error ?? 'Something went wrong')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email — read only */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
        <p className="w-full px-4 py-2.5 rounded-xl border border-petal/30 bg-gray-50 text-slate text-sm">
          {email}
        </p>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink mb-1.5">Display name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setSuccess(false) }}
          placeholder="Your name"
          className="w-full px-4 py-2.5 rounded-xl border border-petal/30 focus:outline-none focus:ring-2 focus:ring-bloom/30 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">Profile updated!</p>}

      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="bg-bloom text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}

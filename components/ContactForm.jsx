'use client'
import { useState } from 'react'

export default function ContactForm() {
  const [form, setForm]     = useState({ name: '', phone: '', email: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]   = useState(null)

  function set(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })
    const data = await res.json()

    if (res.ok) {
      setSuccess(true)
    } else {
      setError(data.error || 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-8 text-center">
        <p className="text-green-700 font-semibold text-lg mb-1">Message sent!</p>
        <p className="text-green-600 text-sm">We&apos;ll get back to you soon.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink mb-1">Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={form.name}
          onChange={set('name')}
          required
          className="w-full border border-petal/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/30"
          placeholder="Your name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Email <span className="text-red-500">*</span></label>
        <input
          type="email"
          value={form.email}
          onChange={set('email')}
          required
          className="w-full border border-petal/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/30"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Phone <span className="text-slate/40 font-normal">(optional)</span></label>
        <input
          type="tel"
          value={form.phone}
          onChange={set('phone')}
          className="w-full border border-petal/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/30"
          placeholder="+91 XXXXX XXXXX"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Message <span className="text-red-500">*</span></label>
        <textarea
          value={form.message}
          onChange={set('message')}
          required
          rows={5}
          className="w-full border border-petal/40 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-bloom/30 resize-none"
          placeholder="How can we help?"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-bloom text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
      >
        {loading ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}

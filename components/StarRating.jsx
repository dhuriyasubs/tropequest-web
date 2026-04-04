'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

export default function StarRating({ bookId, initialRating = null }) {
  const [rating,  setRating]  = useState(initialRating)
  const [hovered, setHovered] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClick(star) {
    const supabase = createSupabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      sessionStorage.setItem('authRedirect', window.location.pathname)
      router.push('/login')
      return
    }

    // Tap same star = remove rating
    const newRating = rating === star ? 0 : star

    setLoading(true)
    const res = await fetch('/api/rating', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ bookId, rating: newRating }),
    })
    if (res.ok) {
      const data = await res.json()
      setRating(data.rating)
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: data.rating ? `Rated ${data.rating} star${data.rating > 1 ? 's' : ''}` : 'Rating removed' },
      }))
    }
    setLoading(false)
  }

  const active = hovered ?? rating
  const labels = ['', 'Terrible', 'It was ok', 'Liked it', 'Really liked it', 'Amazing!']

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex gap-0.5 ${loading ? 'opacity-50 pointer-events-none' : ''}`}
        onMouseLeave={() => setHovered(null)}
      >
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => handleClick(star)}
            onMouseEnter={() => setHovered(star)}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill={star <= active ? '#c084a0' : 'none'}
              stroke={star <= active ? '#c084a0' : '#9ca3af'}
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
              />
            </svg>
          </button>
        ))}
      </div>
      <span className="text-xs text-slate min-w-[80px]">
        {hovered ? labels[hovered] : rating ? labels[rating] : 'Rate this book'}
      </span>
    </div>
  )
}

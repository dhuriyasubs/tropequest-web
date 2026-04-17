'use client'

import { useState, useEffect } from 'react'

export default function BlogFeedback({ slug }) {
  const storageKey = `blog_feedback_${slug}`
  const [voted, setVoted] = useState(null) // 'helpful' | 'not_helpful' | null

  useEffect(() => {
    setVoted(localStorage.getItem(storageKey) || null)
  }, [storageKey])

  async function vote(helpful) {
    if (voted) return
    const value = helpful ? 'helpful' : 'not_helpful'
    setVoted(value)
    localStorage.setItem(storageKey, value)
    await fetch('/api/blog/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, helpful }),
    })
  }

  if (voted) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate/70">
        <span>Thanks for your feedback!</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate/70">Was this helpful?</span>
      <button
        onClick={() => vote(true)}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-gray-200 hover:border-bloom hover:text-bloom transition-colors"
      >
        👍 Helpful
      </button>
      <button
        onClick={() => vote(false)}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-gray-200 hover:border-slate/40 hover:text-slate transition-colors"
      >
        👎 Not helpful
      </button>
    </div>
  )
}

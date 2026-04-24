'use client'
import { useState } from 'react'

export default function ShareButton({ url, title, className = '' }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const shareUrl = url || window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: title || document.title, url: shareUrl }) } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {}
    }
  }

  return (
    <button
      onClick={handleShare}
      title="Share"
      className={`flex items-center gap-1.5 text-sm text-slate hover:text-bloom transition-colors ${className}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
      <span>{copied ? 'Copied!' : 'Share'}</span>
    </button>
  )
}

'use client'
import { useEffect, useState } from 'react'

export default function Toaster() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    function handler(e) {
      const id = Date.now()
      setToasts(prev => [...prev, { id, message: e.detail.message }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
    }
    window.addEventListener('toast', handler)
    return () => window.removeEventListener('toast', handler)
  }, [])

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="bg-ink text-white text-sm px-5 py-2.5 rounded-full shadow-lg"
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const SWIPE_THRESHOLD = 80

export default function SwipeStack({ initialBooks, userId, initialExcludeIds = [] }) {
  const router = useRouter()
  const [books, setBooks]               = useState(initialBooks)
  const [current, setCurrent]           = useState(0)
  const [flyDir, setFlyDir]             = useState(null)
  const [savedCount, setSavedCount]     = useState(0)
  const [fetchingMore, setFetchingMore] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const cardRef      = useRef(null)
  const passLabelRef = useRef(null)
  const tbrLabelRef  = useRef(null)
  const dragRef      = useRef({ active: false, startX: 0, dx: 0 })
  const seenIdsRef   = useRef(new Set(initialExcludeIds.map(String)))
  const flyDirRef    = useRef(null)
  const toastShownRef       = useRef(false)
  const rightSwipeCountRef  = useRef(0)
  const loginModalShownRef  = useRef(false)

  // Flush buffered TBR saves from localStorage when user logs in
  useEffect(() => {
    if (!userId) return
    try {
      const raw = localStorage.getItem('tq_pending_tbr')
      if (!raw) return
      const pending = JSON.parse(raw)
      if (!pending.length) return
      localStorage.removeItem('tq_pending_tbr')
      Promise.all(
        pending.map(bookId =>
          fetch('/api/tbr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId }),
          })
        )
      ).then(() => {
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: `${pending.length} book${pending.length !== 1 ? 's' : ''} saved to TBR ♥` },
        }))
      })
    } catch (_) {}
  }, [userId])

  useEffect(() => { flyDirRef.current = flyDir }, [flyDir])

  useEffect(() => {
    const book = books[current]
    if (book) seenIdsRef.current.add(String(book.id))
  }, [current, books])

  useEffect(() => {
    if (current >= books.length - 5 && !fetchingMore && books.length > 0) {
      setFetchingMore(true)
      const exclude = [...seenIdsRef.current].join(',')
      fetch(`/api/surprise?exclude=${exclude}`)
        .then(r => r.json())
        .then(({ books: more }) => setBooks(prev => [...prev, ...more]))
        .finally(() => setFetchingMore(false))
    }
  }, [current]) // eslint-disable-line react-hooks/exhaustive-deps

  function decide(dir) {
    if (flyDirRef.current) return
    const book = books[current]
    if (!book) return

    setFlyDir(dir)
    flyDirRef.current = dir

    if (dir === 'right') {
      if (userId) {
        fetch('/api/tbr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookId: book.id }),
        })
      } else {
        // Buffer for sync after login
        try {
          const raw = localStorage.getItem('tq_pending_tbr') ?? '[]'
          const pending = JSON.parse(raw)
          pending.push(String(book.id))
          localStorage.setItem('tq_pending_tbr', JSON.stringify(pending))
        } catch (_) {}
      }
      setSavedCount(c => c + 1)

      if (!toastShownRef.current) {
        toastShownRef.current = true
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Added to TBR ♥' } }))
      }

      // Show login nudge after 2nd right swipe for non-auth users (once only)
      if (!userId && !loginModalShownRef.current) {
        rightSwipeCountRef.current += 1
        if (rightSwipeCountRef.current >= 2) {
          loginModalShownRef.current = true
          setTimeout(() => setShowLoginModal(true), 420)
        }
      }
    }

    setTimeout(() => {
      setCurrent(c => c + 1)
      setFlyDir(null)
      flyDirRef.current = null
    }, 380)
  }

  function onPointerDown(e) {
    if (flyDirRef.current) return
    dragRef.current = { active: true, startX: e.clientX, dx: 0 }
    cardRef.current?.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e) {
    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.startX
    dragRef.current.dx = dx

    const card = cardRef.current
    if (card) {
      card.style.transform  = `translateX(${dx}px) rotate(${dx * 0.04}deg)`
      card.style.transition = 'none'
    }
    if (passLabelRef.current) passLabelRef.current.style.opacity = Math.min(1, Math.max(0, -dx / 60))
    if (tbrLabelRef.current)  tbrLabelRef.current.style.opacity  = Math.min(1, Math.max(0,  dx / 60))
  }

  function onPointerUp() {
    if (!dragRef.current.active) return
    const dx = dragRef.current.dx
    dragRef.current = { active: false, startX: 0, dx: 0 }

    const card = cardRef.current
    if (card) {
      card.style.transform  = ''
      card.style.transition = ''
    }
    if (passLabelRef.current) passLabelRef.current.style.opacity = 0
    if (tbrLabelRef.current)  tbrLabelRef.current.style.opacity  = 0

    if      (dx >  SWIPE_THRESHOLD) decide('right')
    else if (dx < -SWIPE_THRESHOLD) decide('left')
  }

  const book     = books[current]
  const nextBook = books[current + 1]

  if (!book) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="font-serif text-2xl font-bold mb-2">You&apos;re all caught up!</h2>
        <p className="text-slate mb-6">
          {savedCount > 0
            ? `Added ${savedCount} book${savedCount !== 1 ? 's' : ''} to your TBR.`
            : 'Come back for more discoveries.'}
        </p>
        {savedCount > 0 && (
          <Link href="/tbr" className="px-6 py-2.5 bg-bloom text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
            View TBR →
          </Link>
        )}
      </div>
    )
  }

  const flyStyle = flyDir === 'right'
    ? { transform: 'translateX(160%) rotate(20deg)', transition: 'transform 0.38s ease-out' }
    : flyDir === 'left'
    ? { transform: 'translateX(-160%) rotate(-20deg)', transition: 'transform 0.38s ease-out' }
    : {}

  return (
    <div
      className="max-w-sm mx-auto px-4 pt-4 pb-4 flex flex-col"
      style={{ height: 'calc(100dvh - 56px)' }}
    >
      {/* Header */}
      <div className="text-center mb-3 flex-shrink-0">
        <h1 className="font-serif text-xl font-bold">Surprise Me ✨</h1>
        {savedCount > 0 && (
          <p className="text-sm text-bloom mt-0.5">{savedCount} added to TBR</p>
        )}
      </div>

      {/* Card stack — fills all available space */}
      <div className="relative flex-1 min-h-0">

        {/* Background card */}
        {nextBook && (
          <div
            className="absolute inset-0 rounded-2xl bg-white shadow-md overflow-hidden pointer-events-none"
            style={{ transform: 'scale(0.95) translateY(10px)', zIndex: 1 }}
          >
            {nextBook.cover_url
              ? <img src={nextBook.cover_url} alt="" className="w-full h-44 object-cover object-top opacity-50" />
              : <div className="w-full h-44 bg-gray-100" />
            }
          </div>
        )}

        {/* Front card — flex column so cover never gets clipped */}
        <div
          ref={cardRef}
          className="absolute inset-0 rounded-2xl bg-white shadow-xl overflow-hidden select-none cursor-grab active:cursor-grabbing flex flex-col"
          style={{ zIndex: 2, touchAction: 'none', ...flyStyle }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Drag hint labels */}
          <div ref={passLabelRef} className="absolute top-6 left-5 z-10 pointer-events-none" style={{ opacity: 0, transform: 'rotate(12deg)' }}>
            <span className="border-2 border-red-500 text-red-500 font-bold text-base px-3 py-1 rounded-lg bg-white/90">PASS</span>
          </div>
          <div ref={tbrLabelRef} className="absolute top-6 right-5 z-10 pointer-events-none" style={{ opacity: 0, transform: 'rotate(-12deg)' }}>
            <span className="border-2 border-green-500 text-green-500 font-bold text-base px-3 py-1 rounded-lg bg-white/90">TBR ♥</span>
          </div>

          {/* Cover — flex-shrink-0 so it always renders at full height */}
          <div className="w-full h-44 flex-shrink-0 bg-gray-100 pointer-events-none">
            {book.cover_url
              ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover object-top" />
              : <div className="w-full h-full flex items-center justify-center text-5xl">📚</div>
            }
          </div>

          {/* Info — takes remaining space, no scroll (pointer-events-none keeps swipe working) */}
          <div className="flex-1 p-4 overflow-hidden pointer-events-none">
            <h2 className="font-serif text-xl font-bold leading-tight line-clamp-2">{book.title}</h2>
            <p className="text-bloom text-sm font-medium mt-0.5">{book.author}</p>
            {book.series_name && (
              <p className="text-slate text-xs mt-0.5">
                {book.series_name}{book.series_number ? ` · Book ${book.series_number}` : ''}
              </p>
            )}
            {book.rating && (
              <p className="text-slate text-xs mt-1">
                ★ {book.rating.toFixed(1)}
                {book.rating_count ? ` · ${book.rating_count.toLocaleString()} ratings` : ''}
              </p>
            )}
            {book.tropes?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {book.tropes.slice(0, 5).map(t => (
                  <span key={t} className="chip text-xs">{t}</span>
                ))}
                {book.tropes.length > 5 && (
                  <span className="text-xs text-slate self-center">+{book.tropes.length - 5}</span>
                )}
              </div>
            )}
            {book.description && (
              <p className="text-ink/70 text-xs mt-3 leading-relaxed line-clamp-3">
                {book.description
                  .replace(/\*\*\*(.*?)\*\*\*/gs, '$1')
                  .replace(/\*\*(.*?)\*\*/gs, '$1')
                  .replace(/\*(.*?)\*/gs, '$1')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-10 mt-4 flex-shrink-0">
        <button
          onClick={() => decide('left')}
          disabled={!!flyDir}
          aria-label="Pass"
          className="w-14 h-14 rounded-full border-2 border-red-300 text-red-400 text-2xl flex items-center justify-center hover:bg-red-50 hover:border-red-400 transition-colors disabled:opacity-40"
        >
          ✕
        </button>
        <Link
          href={`/books/${book.slug}`}
          aria-label="View details"
          className="w-10 h-10 rounded-full border border-petal/40 text-slate flex items-center justify-center hover:bg-petal/10 transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        </Link>
        <button
          onClick={() => decide('right')}
          disabled={!!flyDir}
          aria-label="Add to TBR"
          className="w-14 h-14 rounded-full border-2 border-green-300 text-green-500 text-2xl flex items-center justify-center hover:bg-green-50 hover:border-green-400 transition-colors disabled:opacity-40"
        >
          ♥
        </button>
      </div>

      <p className="text-xs text-slate/40 text-center mt-2 flex-shrink-0">swipe or tap buttons</p>

      {/* Login nudge — bottom sheet, shown after 2nd right swipe */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setShowLoginModal(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-sm bg-white rounded-t-2xl px-6 pt-6 pb-10 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-3xl text-center mb-3">♥</div>
            <h3 className="font-serif text-xl font-bold text-center mb-2">Save your picks</h3>
            <p className="text-slate text-sm text-center mb-6 leading-relaxed">
              Sign in to keep your TBR — your {savedCount} saved book{savedCount !== 1 ? 's' : ''} will sync automatically.
            </p>
            <button
              onClick={() => {
                sessionStorage.setItem('authRedirect', '/surprise')
                router.push('/login')
              }}
              className="w-full bg-bloom text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity mb-3"
            >
              Sign in
            </button>
            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full text-slate text-sm py-2 hover:text-ink transition-colors"
            >
              Continue without saving
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

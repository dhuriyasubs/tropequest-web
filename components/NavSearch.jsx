'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const PLACEHOLDERS = [
  'Enemies to Lovers',
  'Colleen Hoover',
  'Dark Romance',
  'A Court of Thorns and Roses',
  'Slow Burn',
  'Sarah J. Maas',
  'Psychological Thriller',
  'It Ends with Us',
  'Fake Dating',
  'Ana Huang',
  'Mafia Romance',
  'From Blood and Ash',
  'Forbidden Love',
  'Lisa Jewell',
  'Found Family',
  'Grumpy × Sunshine',
  'The Atlas Six',
  'Age Gap',
  'Freida McFadden',
  'Second Chance',
]

export default function NavSearch() {
  const router = useRouter()
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0])
  const [fading, setFading]           = useState(false)
  const [leaving, setLeaving]         = useState(false)
  const idxRef = useRef(0)

  useEffect(() => {
    const id = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        idxRef.current = (idxRef.current + 1) % PLACEHOLDERS.length
        setPlaceholder(PLACEHOLDERS[idxRef.current])
        setFading(false)
      }, 300)
    }, 2800)
    return () => clearInterval(id)
  }, [])

  function handleClick() {
    setLeaving(true)
    setTimeout(() => router.push('/search'), 180)
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Search books"
      className="flex-1 min-w-0 max-w-xs mx-2 sm:mx-4 text-left"
    >
      <div
        className={`relative flex items-center w-full px-3 py-1.5 rounded-full transition-all duration-200 ${
          leaving
            ? 'bg-white border border-bloom/60 shadow-md scale-[1.02]'
            : 'bg-gray-50 border border-gray-300 hover:border-bloom/50 hover:bg-white'
        }`}
      >
        <svg
          className="w-3.5 h-3.5 text-slate/40 flex-shrink-0 mr-2"
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
        <span
          className="text-xs sm:text-sm text-slate/40 truncate transition-opacity duration-300"
          style={{ opacity: fading ? 0 : 1 }}
        >
          {placeholder}
        </span>
      </div>
    </button>
  )
}

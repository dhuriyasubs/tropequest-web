'use client'

import { useState, useRef, useEffect } from 'react'
import { trackEvent } from '@/lib/events'

const STORES = [
  { key: 'amazon_in', label: 'Amazon IN', urlKey: 'buy_url_amazon_in', priceKey: 'price_amazon_in', flag: '🇮🇳' },
  { key: 'amazon_us', label: 'Amazon US', urlKey: 'buy_url_amazon_us', priceKey: 'price_amazon_us', flag: '🇺🇸' },
  { key: 'flipkart',  label: 'Flipkart',  urlKey: 'buy_url_flipkart',  priceKey: null,              flag: '🛒' },
  { key: 'abebooks',  label: 'AbeBooks',  urlKey: 'buy_url_abebooks',  priceKey: null,              flag: '📦' },
  { key: 'wattpad',    label: 'Wattpad',    urlKey: 'buy_url_wattpad',    priceKey: null, flag: '📖', readOnly: true },
  { key: 'stck',       label: 'Stck.me',   urlKey: 'buy_url_stck',       priceKey: null, flag: '📚', readOnly: true },
  { key: 'royal_road', label: 'Royal Road', urlKey: 'buy_url_royal_road', priceKey: null, flag: '👑', readOnly: true },
]

const PRIMARY_KEYS = ['amazon_in', 'amazon_us']

export default function BuyButtons({ book }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onOut(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [])

  const available = STORES.filter(s => book[s.urlKey])
  if (available.length === 0) return null

  const primary = available.find(s => PRIMARY_KEYS.includes(s.key)) ?? available[0]
  const rest = available.filter(s => s.key !== primary.key)

  const handleClick = (store) => {
    trackEvent('buy_click', { book_id: book.id, store })
    setOpen(false)
  }

  const verb = (s) => s.readOnly ? 'Read on' : 'Buy on'

  return (
    <div className="relative flex" ref={ref}>
      {/* Primary button */}
      <a
        href={book[primary.urlKey]}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => handleClick(primary.key)}
        className={`flex items-center gap-2 btn-primary text-sm ${rest.length > 0 ? 'rounded-r-none pr-3' : ''}`}
      >
        <span>{primary.flag}</span>
        <span>{verb(primary)} {primary.label}</span>
        {primary.priceKey && book[primary.priceKey] && (
          <span className="opacity-80 font-normal">₹{book[primary.priceKey]}</span>
        )}
      </a>

      {/* Dropdown toggle */}
      {rest.length > 0 && (
        <>
          <button
            onClick={() => setOpen(v => !v)}
            aria-label="More stores"
            className="flex items-center px-2 btn-primary text-sm rounded-l-none border-l border-white/20"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute left-0 top-full mt-1 z-50 min-w-full w-max bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {rest.map(s => (
                <a
                  key={s.key}
                  href={book[s.urlKey]}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  onClick={() => handleClick(s.key)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                >
                  <span>{s.flag}</span>
                  <span>{verb(s)} {s.label}</span>
                  {s.priceKey && book[s.priceKey] && (
                    <span className="text-gray-400 font-normal">₹{book[s.priceKey]}</span>
                  )}
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

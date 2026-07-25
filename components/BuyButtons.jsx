'use client'

import { useState, useRef, useEffect } from 'react'
import { trackEvent } from '@/lib/events'

const STORES = [
  { key: 'amazon_in', label: 'Amazon IN', urlKey: 'buy_url_amazon_in', priceKey: 'price_amazon_in', flag: '🇮🇳', currency: '₹' },
  { key: 'amazon_us', label: 'Amazon US', urlKey: 'buy_url_amazon_us', priceKey: 'price_amazon_us', flag: '🇺🇸', currency: '$' },
  { key: 'flipkart',  label: 'Flipkart',  urlKey: 'buy_url_flipkart',  priceKey: null,              flag: '🛒' },
  { key: 'abebooks',   label: 'AbeBooks',   urlKey: 'buy_url_abebooks',   priceKey: 'price_abebooks', flag: '📦', currency: '$' },
  { key: 'bookscape',  label: 'Bookscape',  urlKey: 'buy_url_bookscape',  priceKey: null, flag: '🏪' },
  { key: 'audible',    label: 'Audible',    urlKey: 'buy_url_audible',    priceKey: null, flag: '🎧' },
  { key: 'wattpad',    label: 'Wattpad',    urlKey: 'buy_url_wattpad',    priceKey: null, flag: '📖', readOnly: true },
  { key: 'stck',       label: 'Stck.me',   urlKey: 'buy_url_stck',       priceKey: null, flag: '📚', readOnly: true },
  { key: 'royal_road', label: 'Royal Road', urlKey: 'buy_url_royal_road', priceKey: null, flag: '👑', readOnly: true },
]

const PRIMARY_KEYS = ['amazon_in', 'amazon_us']

// Books sourced from a web-fiction site (Royal Road, Wattpad, Stck) aren't sold through
// retail stores — hide those links even if the DB still has stale auto-generated search
// URLs from before the pipeline stopped creating them.
const WEB_FICTION_KEYS = ['wattpad', 'stck', 'royal_road']
const RETAIL_KEYS = ['amazon_in', 'amazon_us', 'flipkart', 'abebooks', 'bookscape']

export default function BuyButtons({ book }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onOut(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [])

  const isWebFiction = WEB_FICTION_KEYS.some(k => book[STORES.find(s => s.key === k).urlKey])

  const kuUrl = book.buy_url_amazon_in || book.buy_url_amazon_us
  const kuEntry = book.is_kindle_unlimited && kuUrl && !isWebFiction
    ? { key: 'kindle_unlimited', label: 'Kindle Unlimited', url: kuUrl, flag: '📱', readOnly: true }
    : null

  const available = STORES
    .filter(s => book[s.urlKey])
    .filter(s => !isWebFiction || !RETAIL_KEYS.includes(s.key))
  if (available.length === 0 && !kuEntry) return null

  // Normalise all entries to { key, label, href, flag, priceLabel, readOnly }
  const normalised = [
    ...available.map(s => ({
      key: s.key,
      label: s.label,
      href: book[s.urlKey],
      flag: s.flag,
      priceLabel: s.priceKey && book[s.priceKey] ? `${s.currency}${Number(book[s.priceKey]).toLocaleString('en-US')}` : null,
      readOnly: !!s.readOnly,
    })),
    ...(kuEntry ? [{ key: kuEntry.key, label: kuEntry.label, href: kuEntry.url, flag: kuEntry.flag, priceLabel: null, readOnly: true }] : []),
  ]

  const primary = normalised.find(s => PRIMARY_KEYS.includes(s.key)) ?? normalised[0]
  const rest = normalised.filter(s => s.key !== primary.key)

  const handleClick = (store) => {
    trackEvent('buy_click', { book_id: book.id, store })
    setOpen(false)
  }

  const verb = (s) => s.readOnly ? 'Read on' : 'Buy on'

  return (
    <div className="relative flex" ref={ref}>
      {/* Primary button */}
      <a
        href={primary.href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => handleClick(primary.key)}
        className={`flex items-center gap-2 btn-primary text-sm ${rest.length > 0 ? 'rounded-r-none pr-3' : ''}`}
      >
        <span>{primary.flag}</span>
        <span>{verb(primary)} {primary.label}</span>
        {primary.priceLabel && <span className="opacity-80 font-normal">{primary.priceLabel}</span>}
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
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  onClick={() => handleClick(s.key)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                >
                  <span>{s.flag}</span>
                  <span>{verb(s)} {s.label}</span>
                  {s.priceLabel && <span className="text-gray-400 font-normal">{s.priceLabel}</span>}
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

'use client'

import { trackEvent } from '@/lib/events'

const STORES = [
  { key: 'amazon_in', label: 'Amazon IN', urlKey: 'buy_url_amazon_in', priceKey: 'price_amazon_in', flag: '🇮🇳' },
  { key: 'flipkart',  label: 'Flipkart',  urlKey: 'buy_url_flipkart',  priceKey: 'price_flipkart',  flag: '🛒' },
  { key: 'abebooks',  label: 'AbeBooks',  urlKey: 'buy_url_abebooks',  priceKey: null,              flag: '📦' },
  { key: 'wattpad',   label: 'Wattpad',   urlKey: 'buy_url_wattpad',   priceKey: null,              flag: '📖', readOnly: true },
  { key: 'stck',      label: 'Stck.me',   urlKey: 'buy_url_stck',      priceKey: null,              flag: '📚', readOnly: true },
]

export default function BuyButtons({ book }) {
  const available = STORES.filter(s => book[s.urlKey])
  if (available.length === 0) return null

  const handleClick = (store) => {
    trackEvent('buy_click', { book_id: book.id, store })
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {available.map(s => (
        <a
          key={s.key}
          href={book[s.urlKey]}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => handleClick(s.key)}
          className="flex items-center gap-2 btn-primary text-sm"
        >
          <span>{s.flag}</span>
          <span>{s.readOnly ? 'Read on' : 'Buy on'} {s.label}</span>
          {book[s.priceKey] && (
            <span className="opacity-80 font-normal">₹{book[s.priceKey]}</span>
          )}
        </a>
      ))}
    </div>
  )
}

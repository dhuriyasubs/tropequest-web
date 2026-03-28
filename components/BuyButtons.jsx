'use client'

const STORES = [
  { key: 'amazon_in', label: 'Amazon IN', urlKey: 'buy_url_amazon_in', priceKey: 'price_amazon_in', flag: '🇮🇳' },
  { key: 'amazon_us', label: 'Amazon US', urlKey: 'buy_url_amazon_us', priceKey: 'price_amazon_us', flag: '🇺🇸' },
  { key: 'flipkart',  label: 'Flipkart',  urlKey: 'buy_url_flipkart',  priceKey: 'price_flipkart',  flag: '🛒' },
]

export default function BuyButtons({ book }) {
  const available = STORES.filter(s => book[s.urlKey])
  if (available.length === 0) return null

  const handleClick = async (store) => {
    await fetch('/api/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_id: book.id, store }),
    })
  }

  return (
    <div className="flex flex-wrap gap-3 mt-5">
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
          <span>Buy on {s.label}</span>
          {book[s.priceKey] && (
            <span className="opacity-80 font-normal">
              {s.key === 'amazon_us'
                ? `$${book[s.priceKey]}`
                : `₹${book[s.priceKey]}`}
            </span>
          )}
        </a>
      ))}
    </div>
  )
}

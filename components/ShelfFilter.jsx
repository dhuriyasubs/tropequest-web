'use client'
import { useRouter } from 'next/navigation'

const STATUSES = [
  { value: '', label: 'All' },
  { value: 'reading', label: 'Reading' },
  { value: 'read', label: 'Read' },
  { value: 'owned', label: 'Owned' },
]

export default function ShelfFilter({ activeStatus, counts = {}, total = 0 }) {
  const router = useRouter()

  function getCount(value) {
    if (!value) return total
    return counts[value] ?? 0
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {STATUSES.map(({ value, label }) => {
        const active = (activeStatus ?? '') === value
        const count = getCount(value)
        return (
          <button
            key={value}
            onClick={() => router.push(value ? `/shelf?status=${value}` : '/shelf')}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              active
                ? 'bg-bloom text-white'
                : 'bg-petal/15 text-plum hover:bg-petal/30'
            }`}
          >
            {label} · {count}
          </button>
        )
      })}
    </div>
  )
}

'use client'
import { useRouter } from 'next/navigation'

export default function ShelfFilter({ activeStatus }) {
  const router = useRouter()

  function onChange(e) {
    const val = e.target.value
    router.push(val ? `/shelf?status=${val}` : '/shelf')
  }

  return (
    <select
      value={activeStatus ?? ''}
      onChange={onChange}
      className="text-sm border border-petal/30 rounded-lg px-3 py-2 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-bloom/30 cursor-pointer"
    >
      <option value="">All books</option>
      <option value="reading">Reading</option>
      <option value="read">Read</option>
      <option value="owned">Owned</option>
    </select>
  )
}

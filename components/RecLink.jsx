'use client'
import Link from 'next/link'
import { trackEvent } from '@/lib/events'

export default function RecLink({ href, section, bookId, children, className }) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackEvent('rec_click', { section, book_id: bookId })}
    >
      {children}
    </Link>
  )
}

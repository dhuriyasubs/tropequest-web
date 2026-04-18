'use client'
import { useEffect } from 'react'
import { trackEvent } from '@/lib/events'

export default function BookViewTracker({ bookId, slug }) {
  useEffect(() => {
    trackEvent('book_view', { book_id: bookId, slug })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

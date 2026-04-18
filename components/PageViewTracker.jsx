'use client'
import { useEffect } from 'react'
import { trackEvent } from '@/lib/events'

export default function PageViewTracker({ pageType, slug = null }) {
  useEffect(() => {
    trackEvent('page_view', { page_type: pageType, slug })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

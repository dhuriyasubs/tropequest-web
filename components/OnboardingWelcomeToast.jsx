'use client'
import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Fires once after WelcomeFlow hands off to the homepage with picks saved —
// without this, finishing onboarding just drops you on the same homepage
// everyone sees, with no acknowledgement that anything happened.
function OnboardingToastInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const onboarded = searchParams.get('onboarded') === '1'

  useEffect(() => {
    if (!onboarded) return
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { message: "Nice picks! We've personalised your homepage below 👇" },
    }))
    document.getElementById('personalised-for-you')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    router.replace('/', { scroll: false })
  }, [onboarded, router])

  return null
}

export default function OnboardingWelcomeToast() {
  return (
    <Suspense fallback={null}>
      <OnboardingToastInner />
    </Suspense>
  )
}

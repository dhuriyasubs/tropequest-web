'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

// After OAuth, redirects the user back to where they were before sign-in.
// Reads a path stored in sessionStorage by any component that triggers login.
export default function AuthRedirectHandler() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createSupabaseBrowser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        const redirect = sessionStorage.getItem('authRedirect')
        if (redirect) {
          sessionStorage.removeItem('authRedirect')
          router.push(redirect)
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return null
}

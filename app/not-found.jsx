import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <h1 className="font-serif text-5xl font-bold mb-4">404</h1>
      <p className="text-slate mb-8">This page doesn&apos;t exist — but your next great read does.</p>
      <Link href="/search" className="btn-primary">Browse books</Link>
    </div>
  )
}

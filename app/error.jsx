'use client'

export default function Error({ reset }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <h1 className="font-serif text-2xl font-bold mb-2">We&apos;re having trouble connecting</h1>
        <p className="text-sm text-slate mb-6">
          Something went wrong loading this page. This is usually temporary — try again in a minute.
        </p>
        <button onClick={() => reset()} className="btn-primary">
          Try again
        </button>
      </div>
    </div>
  )
}

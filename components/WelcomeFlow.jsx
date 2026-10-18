'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = ['Genres', 'Tropes', 'Authors']

export default function WelcomeFlow({ firstName, popularTropes, allGenres, allAuthors }) {
  const router = useRouter()
  const [step, setStep] = useState(0) // 0 = intro, 1-3 = steps, 4 = done

  const [selGenres,  setSelGenres]  = useState([])
  const [selTropes,  setSelTropes]  = useState([])
  const [selAuthors, setSelAuthors] = useState([])

  const [tropeSearch,  setTropeSearch]  = useState('')
  const [authorSearch, setAuthorSearch] = useState('')
  const [saving, setSaving] = useState(false)

  function toggle(val, list, setList) {
    setList(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])
  }

  async function finish() {
    setSaving(true)
    await fetch('/api/interests', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ genres: selGenres, tropes: selTropes, subjects: [], authors: selAuthors }),
    })
    const hasPicks = selGenres.length > 0 || selTropes.length > 0 || selAuthors.length > 0
    router.push(hasPicks ? '/?onboarded=1' : '/')
  }

  const filteredTropes  = tropeSearch
    ? popularTropes.filter(t => t.toLowerCase().includes(tropeSearch.toLowerCase()))
    : popularTropes

  const filteredAuthors = authorSearch
    ? allAuthors.filter(a => a.toLowerCase().includes(authorSearch.toLowerCase()))
    : allAuthors.slice(0, 80)

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-petal/20">
        <span className="font-serif text-lg font-bold text-bloom">TropeQuest</span>
        {step < 4 && (
          <button
            onClick={finish}
            disabled={saving}
            className="text-sm text-slate hover:text-ink transition-colors disabled:opacity-50"
          >
            {step === 0 ? "I'll just browse" : 'Skip for now'}
          </button>
        )}
      </div>

      {/* Progress bar */}
      {step > 0 && step < 4 && (
        <div className="flex gap-1.5 px-6 pt-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < step ? 'bg-bloom' : 'bg-petal/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">

          {/* Intro */}
          {step === 0 && (
            <div className="flex flex-col items-center text-center pt-12">
              <div className="text-5xl mb-6">📚</div>
              <h1 className="font-serif text-3xl font-bold mb-3">
                {firstName ? `Welcome, ${firstName}!` : 'Welcome to TropeQuest!'}
              </h1>
              <p className="text-slate text-lg mb-2 max-w-md">
                Find books by the tropes and vibes you actually love, not just bestseller lists.
              </p>
              <p className="text-slate/70 text-sm mb-10 max-w-sm">
                Takes about 30 seconds. Tell us what you love and we&apos;ll personalise everything.
              </p>
              <button
                onClick={() => setStep(1)}
                className="px-10 py-3 bg-bloom text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-base"
              >
                Let&apos;s go
              </button>
            </div>
          )}

          {/* Step 1 — Genres */}
          {step === 1 && (
            <>
              <p className="text-xs font-medium text-bloom uppercase tracking-wider mb-2">Step 1 of 3</p>
              <h2 className="font-serif text-2xl font-bold mb-1">What do you love reading?</h2>
              <p className="text-slate text-sm mb-6">Pick as many as you like.</p>
              <div className="flex flex-wrap gap-2">
                {allGenres.map(g => (
                  <button
                    key={g}
                    onClick={() => toggle(g, selGenres, setSelGenres)}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                      selGenres.includes(g)
                        ? 'bg-bloom text-white border-bloom'
                        : 'bg-white text-ink border-petal/40 hover:border-bloom'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 2 — Tropes */}
          {step === 2 && (
            <>
              <p className="text-xs font-medium text-bloom uppercase tracking-wider mb-2">Step 2 of 3</p>
              <h2 className="font-serif text-2xl font-bold mb-1">Pick your favourite tropes</h2>
              <p className="text-slate text-sm mb-4">
                These drive everything: recommendations, filters, your whole feed.
              </p>
              <input
                type="text"
                placeholder="Search tropes…"
                value={tropeSearch}
                onChange={e => setTropeSearch(e.target.value)}
                className="w-full border border-petal/30 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-bloom/30"
                autoFocus
              />
              {selTropes.length > 0 && (
                <p className="text-xs text-bloom font-medium mb-3">{selTropes.length} selected</p>
              )}
              <div className="flex flex-wrap gap-2">
                {filteredTropes.map(t => (
                  <button
                    key={t}
                    onClick={() => toggle(t, selTropes, setSelTropes)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                      selTropes.includes(t)
                        ? 'bg-bloom text-white border-bloom'
                        : 'bg-white text-ink border-petal/40 hover:border-bloom'
                    }`}
                  >
                    {t}
                  </button>
                ))}
                {filteredTropes.length === 0 && (
                  <p className="text-sm text-slate py-2">No tropes matching &ldquo;{tropeSearch}&rdquo;</p>
                )}
              </div>
            </>
          )}

          {/* Step 3 — Authors */}
          {step === 3 && (
            <>
              <p className="text-xs font-medium text-bloom uppercase tracking-wider mb-2">Step 3 of 3</p>
              <h2 className="font-serif text-2xl font-bold mb-1">Any favourite authors?</h2>
              <p className="text-slate text-sm mb-4">
                We&apos;ll surface new books by authors you already love. Optional.
              </p>
              <input
                type="text"
                placeholder="Search authors…"
                value={authorSearch}
                onChange={e => setAuthorSearch(e.target.value)}
                className="w-full border border-petal/30 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-bloom/30"
                autoFocus
              />
              {selAuthors.length > 0 && (
                <p className="text-xs text-bloom font-medium mb-3">{selAuthors.length} selected</p>
              )}
              <div className="flex flex-wrap gap-2">
                {filteredAuthors.map(a => (
                  <button
                    key={a}
                    onClick={() => toggle(a, selAuthors, setSelAuthors)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                      selAuthors.includes(a)
                        ? 'bg-bloom text-white border-bloom'
                        : 'bg-white text-ink border-petal/40 hover:border-bloom'
                    }`}
                  >
                    {a}
                  </button>
                ))}
                {filteredAuthors.length === 0 && authorSearch && (
                  <p className="text-sm text-slate py-2">No authors found for &ldquo;{authorSearch}&rdquo;</p>
                )}
              </div>
            </>
          )}

        </div>
      </div>

      {/* Footer nav */}
      {step > 0 && step < 4 && (
        <div className="px-6 py-4 border-t border-petal/20 flex items-center justify-between bg-white">
          <button
            onClick={() => setStep(s => s - 1)}
            className="text-sm text-slate hover:text-ink transition-colors px-4 py-2"
          >
            ← Back
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="px-8 py-2.5 bg-bloom text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={saving}
              className="px-8 py-2.5 bg-bloom text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving…' : "Let's read →"}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

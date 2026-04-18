'use client'
import { useState } from 'react'

const FIELD_LABELS = {
  genres:            'Genres',
  tropes:            'Tropes',
  time_period:       'Time Period',
  relationship_type: 'Relationship',
  kink_tags:         'Kink Tags',
  story_tags:        'Story Tags',
  content_warnings:  'Content Warnings',
  representation:    'Representation',
  setting_tags:      'Setting',
  geography_tags:    'Geography',
}

export default function TagAudit() {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [fixing,  setFixing]  = useState(false)
  const [result,  setResult]  = useState(null)
  const [fixed,   setFixed]   = useState(new Set())
  const [error,   setError]   = useState(null)

  async function runAudit() {
    setLoading(true); setError(null); setResult(null); setFixed(new Set())
    try {
      const r = await fetch('/api/admin/tag-audit')
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function fixOne(id) {
    setFixed(prev => new Set([...prev, `fixing-${id}`]))
    try {
      await fetch('/api/admin/tag-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setFixed(prev => new Set([...prev, id]))
    } catch {}
  }

  async function fixAll() {
    setFixing(true)
    try {
      const r = await fetch('/api/admin/tag-audit', { method: 'PUT' })
      const data = await r.json()
      if (data.ok) {
        setFixed(new Set(result.issues.map(i => i.id)))
      }
    } catch {}
    setFixing(false)
  }

  const pending = result?.issues.filter(i => !fixed.has(i.id)) ?? []

  return (
    <div className="mb-10">
      <button
        onClick={() => { setOpen(o => !o); if (!open && !result) runAudit() }}
        className="flex items-center gap-2 text-xs font-semibold text-slate uppercase tracking-wide hover:text-bloom transition-colors"
      >
        <span>{open ? '▾' : '▸'} Tag Audit</span>
        {result && (
          <span className={`ml-1 px-1.5 py-0.5 rounded font-bold ${pending.length ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {pending.length ? `${pending.length} issues` : 'all clean'}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
          {loading && (
            <p className="px-4 py-6 text-sm text-slate text-center">Scanning {result ? '' : 'all '}books…</p>
          )}

          {error && (
            <p className="px-4 py-4 text-sm text-red-600">{error}</p>
          )}

          {result && !loading && (
            <>
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-xs text-slate">
                  {pending.length
                    ? <><span className="font-semibold text-red-600">{pending.length}</span> books with misrouted tags (out of {result.total})</>
                    : <span className="font-semibold text-green-600">All {result.total} books look correct.</span>}
                </p>
                <div className="flex gap-2">
                  <button onClick={runAudit} className="text-xs text-slate hover:text-bloom underline">Re-scan</button>
                  {pending.length > 0 && (
                    <button
                      onClick={fixAll}
                      disabled={fixing}
                      className="text-xs bg-bloom text-white px-3 py-1 rounded-lg hover:bg-bloom/90 disabled:opacity-50"
                    >
                      {fixing ? 'Fixing…' : `Fix all ${pending.length}`}
                    </button>
                  )}
                </div>
              </div>

              {pending.length > 0 && (
                <ul className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                  {pending.map(issue => (
                    <li key={issue.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{issue.title}</p>
                          <p className="text-xs text-slate">{issue.author}</p>
                          <div className="mt-1.5 space-y-0.5">
                            {Object.entries(issue.changed).map(([field, { before, after }]) => {
                              const removed = before.filter(t => !after.includes(t))
                              const added   = after.filter(t => !before.includes(t))
                              return (
                                <div key={field} className="text-xs">
                                  <span className="font-medium text-gray-600">{FIELD_LABELS[field] ?? field}:</span>
                                  {removed.map(t => (
                                    <span key={t} className="ml-1 text-red-600">−{t}</span>
                                  ))}
                                  {added.map(t => (
                                    <span key={t} className="ml-1 text-green-600">+{t}</span>
                                  ))}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        <button
                          onClick={() => fixOne(issue.id)}
                          disabled={fixed.has(`fixing-${issue.id}`)}
                          className="shrink-0 text-xs border border-gray-300 px-2.5 py-1 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                        >
                          Fix
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

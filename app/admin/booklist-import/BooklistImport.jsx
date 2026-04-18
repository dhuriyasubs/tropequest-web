'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  GENRES, TROPES, STORY_TAGS, CONTENT_WARNINGS, REPRESENTATION,
  SETTING_TAGS, GEOGRAPHY_TAGS, RELATIONSHIP_TYPES, TIME_PERIODS,
} from '@/lib/taxonomy'

const FIELD_SETS = {
  relationship_type: new Set(RELATIONSHIP_TYPES),
  tropes:            new Set(TROPES),
  story_tags:        new Set(STORY_TAGS),
  genres:            new Set(GENRES),
  time_period:       new Set(TIME_PERIODS),
  setting_tags:      new Set(SETTING_TAGS),
  content_warnings:  new Set(CONTENT_WARNINGS),
  representation:    new Set(REPRESENTATION),
  geography_tags:    new Set(GEOGRAPHY_TAGS),
}

function parseText(text) {
  return text.trim().split(/\n\s*\n/).flatMap(block => {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) return []
    const byIdx = lines[0].lastIndexOf(' by ')
    if (byIdx === -1) return []
    const title = lines[0].slice(0, byIdx).trim()
    const author = lines[0].slice(byIdx + 4).trim()
    let rating = null, spice_rating = null, topics = []
    for (const line of lines.slice(1)) {
      const rm = line.match(/^Rating:\s*(\d+\.?\d*)/)
      if (rm) { rating = parseFloat(rm[1]); continue }
      const sm = line.match(/^Steam:\s*(\d) out of 5/)
      if (sm) { spice_rating = parseInt(sm[1]); continue }
      if (line.startsWith('Topics:')) {
        topics = line.slice(7).split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
      }
    }
    return [{ title, author, rating, spice_rating, topics }]
  })
}

function mapTopics(topics) {
  const mapped = {}
  const unknown = []
  for (const topic of topics) {
    let found = false
    for (const [field, set] of Object.entries(FIELD_SETS)) {
      if (set.has(topic)) {
        ;(mapped[field] ??= []).push(topic)
        found = true
        break
      }
    }
    if (!found) unknown.push(topic)
  }
  return { mapped, unknown }
}

export default function BooklistImport() {
  const [text, setText] = useState('')
  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  async function handleParse() {
    setLoading(true)
    setDone(false)
    const parsed = parseText(text)
    const res = await fetch('/api/admin/booklist-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titles: parsed.map(b => b.title) }),
    })
    const { matches } = await res.json()
    setRows(parsed.map(b => {
      const db = matches[b.title.toLowerCase()] ?? null
      const { mapped, unknown } = mapTopics(b.topics)
      return { ...b, db, mapped, unknown }
    }))
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const updates = rows.map(r => ({
      id: r.db?.id ?? null,
      title: r.title,
      author: r.author,
      rating: r.rating,
      spice_rating: r.spice_rating,
      ...r.mapped,
    }))
    await fetch('/api/admin/booklist-import', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    })
    setSaving(false)
    setDone(true)
  }

  const totalCount = rows?.length ?? 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold mb-1">Book List Import</h1>
        <p className="text-sm text-slate">Paste a book list to enrich matched books with spice rating and taxonomy tags. Array fields are merged — existing tags are preserved.</p>
      </div>

      <div className="space-y-3">
        <textarea
          className="w-full h-64 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-bloom resize-none"
          placeholder={'Bad Billionaire by Julie Kriss\nRating: 3.9 out of 5\nSteam: 4 out of 5 - Steamy\nTopics: contemporary, new adult, m-f romance, billionaire'}
          value={text}
          onChange={e => { setText(e.target.value); setRows(null); setDone(false) }}
        />
        <button
          onClick={handleParse}
          disabled={!text.trim() || loading}
          className="bg-bloom text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-bloom/90 disabled:opacity-40 transition-colors"
        >
          {loading ? 'Looking up...' : 'Parse & Preview'}
        </button>
      </div>

      {rows && (
        <div className="space-y-4">
          <p className="text-sm text-slate">{rows.filter(r => r.db).length} matched · {rows.filter(r => !r.db).length} new · {rows.length} total</p>

          <div className="space-y-3">
            {rows.map((row, i) => (
              <div key={i} className={`border rounded-xl px-5 py-4 ${row.db ? 'border-gray-200' : 'border-amber-200 bg-amber-50/30'}`}>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <p className="font-semibold text-sm">
                    {row.db
                      ? <Link href={`/books/${row.db.slug}`} target="_blank" className="hover:text-bloom">{row.title}</Link>
                      : <span className="text-amber-700">{row.title}</span>
                    }
                    <span className="text-slate font-normal"> by {row.author}</span>
                  </p>
                  <div className="flex gap-3 text-xs text-slate shrink-0">
                    {row.rating && <span>Rating {row.rating}</span>}
                    {row.spice_rating && <span>Spice {row.spice_rating}/5</span>}
                  </div>
                </div>

                {!row.db && <p className="text-xs text-amber-600 mb-2">Not in DB — will be created</p>}

                {row.db && (
                  <div className="space-y-1.5 mt-3">
                    {Object.entries(row.mapped).map(([field, tags]) => (
                      <div key={field} className="flex gap-2 items-start">
                        <span className="text-xs text-slate w-32 shrink-0 pt-0.5">{field.replace(/_/g, ' ')}</span>
                        <div className="flex flex-wrap gap-1">
                          {tags.map(t => (
                            <span key={t} className="text-xs bg-petal/30 text-bloom px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {row.unknown.length > 0 && (
                      <div className="flex gap-2 items-start">
                        <span className="text-xs text-slate w-32 shrink-0 pt-0.5">skipped</span>
                        <div className="flex flex-wrap gap-1">
                          {row.unknown.map(t => (
                            <span key={t} className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {Object.keys(row.mapped).length === 0 && row.unknown.length === 0 && (
                      <p className="text-xs text-slate">No topics to import.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalCount > 0 && !done && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-ink text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-ink/90 disabled:opacity-40 transition-colors"
            >
              {saving ? 'Saving...' : `Save ${totalCount} book${totalCount !== 1 ? 's' : ''}`}
            </button>
          )}
          {done && <p className="text-sm text-green-600 font-semibold">Saved successfully.</p>}
        </div>
      )}
    </div>
  )
}

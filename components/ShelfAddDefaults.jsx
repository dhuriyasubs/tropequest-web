'use client'
import { useState, useRef, useEffect } from 'react'

const STATUS_OPTIONS = [
  { value: 'unread',  label: 'Unread'  },
  { value: 'reading', label: 'Reading' },
  { value: 'read',    label: 'Read'    },
  { value: 'dnf',     label: 'DNF'     },
]

export const MINE = 'Mine'

// Compact status/format/member picker shown at the point of adding books
// (scan results, catalogue search, manual add) so you don't have to add
// everything as Unread/Physical/Mine and then go edit each one afterward.
export default function ShelfAddDefaults({ status, format, member, onChange, knownMembers = [] }) {
  const [addingNew, setAddingNew] = useState(false)
  const [newName,   setNewName]   = useState('')
  const inputRef = useRef(null)

  useEffect(() => { if (addingNew) inputRef.current?.focus() }, [addingNew])

  function submitNew(e) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (trimmed) {
      onChange({ member: trimmed })
      setAddingNew(false)
      setNewName('')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-petal/5 border-b border-petal/20">
      <select
        value={status}
        onChange={e => onChange({ status: e.target.value })}
        className="text-xs font-medium pl-2 pr-1 py-1 rounded-full border-0 bg-petal/15 text-plum focus:outline-none focus:ring-1 focus:ring-bloom/40 cursor-pointer"
      >
        {STATUS_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => onChange({ format: format === 'virtual' ? 'physical' : 'virtual' })}
        className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${
          format === 'virtual' ? 'bg-blue-50 text-blue-600' : 'bg-petal/15 text-plum'
        }`}
      >
        {format === 'virtual' ? 'Virtual' : 'Physical'}
      </button>

      {addingNew ? (
        <form onSubmit={submitNew} className="inline-flex">
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onBlur={() => { if (!newName.trim()) setAddingNew(false) }}
            placeholder="Name…"
            maxLength={40}
            className="text-xs px-2 py-1 rounded-full border border-petal/40 focus:outline-none focus:ring-1 focus:ring-bloom/40 w-24"
          />
        </form>
      ) : (
        <select
          value={member ?? MINE}
          onChange={e => {
            if (e.target.value === '__new__') setAddingNew(true)
            else onChange({ member: e.target.value === MINE ? null : e.target.value })
          }}
          className="text-xs font-medium pl-2 pr-1 py-1 rounded-full border-0 bg-plum/10 text-plum focus:outline-none focus:ring-1 focus:ring-bloom/40 cursor-pointer"
        >
          <option value={MINE}>{MINE}</option>
          {knownMembers.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
          <option value="__new__">+ New…</option>
        </select>
      )}
    </div>
  )
}

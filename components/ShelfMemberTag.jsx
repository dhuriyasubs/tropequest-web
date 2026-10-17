'use client'
import { useState, useRef, useEffect } from 'react'

export default function ShelfMemberTag({ bookId, currentMember, knownMembers = [] }) {
  const [member,   setMember]   = useState(currentMember ?? null)
  const [editing,  setEditing]  = useState(false)
  const [value,    setValue]    = useState(currentMember ?? '')
  const [saving,   setSaving]   = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function save(next) {
    const prev = member
    setMember(next) // optimistic
    setEditing(false)
    setSaving(true)
    const res = await fetch('/api/shelf', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ bookId, member: next }),
    })
    if (!res.ok) setMember(prev)
    setSaving(false)
  }

  function onSubmit(e) {
    e.preventDefault()
    save(value.trim() || null)
  }

  if (editing) {
    return (
      <form onSubmit={onSubmit} className="inline-flex">
        <input
          ref={inputRef}
          type="text"
          list={`shelf-members-${bookId}`}
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={onSubmit}
          onKeyDown={e => { if (e.key === 'Escape') { setValue(member ?? ''); setEditing(false) } }}
          placeholder="Whose copy?"
          maxLength={40}
          className="text-xs px-2 py-1 rounded-full border border-petal/40 focus:outline-none focus:ring-1 focus:ring-bloom/40 w-28"
        />
        <datalist id={`shelf-members-${bookId}`}>
          {knownMembers.map(m => <option key={m} value={m} />)}
        </datalist>
      </form>
    )
  }

  return (
    <button
      type="button"
      onClick={() => { setValue(member ?? ''); setEditing(true) }}
      disabled={saving}
      title={member ? `${member}'s copy — click to change` : 'Whose copy is this?'}
      className={`text-xs font-medium px-2 py-1 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
        member ? 'bg-purple-50 text-purple-700' : 'text-slate/40 hover:text-slate hover:bg-gray-100'
      }`}
    >
      {member ?? '+ Member'}
    </button>
  )
}

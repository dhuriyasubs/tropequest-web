'use client'
import { useState, useRef, useEffect } from 'react'

const MINE = 'Mine' // sentinel UI value for member_label === null

export default function ShelfMemberTag({ bookId, currentMember, knownMembers = [] }) {
  const [member,    setMember]    = useState(currentMember ?? null)
  const [open,      setOpen]      = useState(false)
  const [addingNew, setAddingNew] = useState(false)
  const [newName,   setNewName]   = useState('')
  const [saving,    setSaving]    = useState(false)
  const boxRef   = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false)
        setAddingNew(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  useEffect(() => {
    if (addingNew) inputRef.current?.focus()
  }, [addingNew])

  async function choose(value) {
    const prev = member
    setMember(value)
    setOpen(false)
    setAddingNew(false)
    setNewName('')
    setSaving(true)
    const res = await fetch('/api/shelf', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ bookId, member: value }),
    })
    if (!res.ok) setMember(prev)
    setSaving(false)
  }

  function submitNew(e) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (trimmed) choose(trimmed)
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        title="Whose copy is this?"
        className={`text-xs font-medium px-2 py-1 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
          member ? 'bg-plum/10 text-plum' : 'bg-petal/15 text-plum/70 hover:bg-petal/30'
        }`}
      >
        {member ?? MINE}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-petal/30 rounded-xl shadow-lg py-1 min-w-[140px]">
          <button
            type="button"
            onClick={() => choose(null)}
            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-petal/10 ${!member ? 'font-semibold text-bloom' : 'text-ink'}`}
          >
            {MINE}
          </button>
          {knownMembers.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => choose(m)}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-petal/10 ${member === m ? 'font-semibold text-bloom' : 'text-ink'}`}
            >
              {m}
            </button>
          ))}
          {addingNew ? (
            <form onSubmit={submitNew} className="px-2 pt-1.5 pb-1 border-t border-petal/15 mt-1">
              <input
                ref={inputRef}
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onBlur={() => { if (!newName.trim()) setAddingNew(false) }}
                placeholder="Name…"
                maxLength={40}
                className="w-full text-xs px-2 py-1 rounded-lg border border-petal/30 focus:outline-none focus:ring-1 focus:ring-bloom/40"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingNew(true)}
              className="w-full text-left px-3 py-1.5 text-xs text-bloom hover:bg-petal/10 border-t border-petal/15 mt-1"
            >
              + Add member
            </button>
          )}
        </div>
      )}
    </div>
  )
}

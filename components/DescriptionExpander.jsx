'use client'
import { useState } from 'react'

// Rough threshold: descriptions under ~400 chars typically fit in 5 lines
const CLAMP_THRESHOLD = 400

export default function DescriptionExpander({ paragraphs }) {
  const [expanded, setExpanded] = useState(false)
  const fullText = paragraphs.join(' ')
  const shouldClamp = fullText.length > CLAMP_THRESHOLD

  return (
    <div className="mt-6 text-sm text-ink/80 leading-relaxed">
      <div className={`relative ${shouldClamp && !expanded ? 'max-h-[7.5rem] overflow-hidden' : ''}`}>
        <div className="space-y-3">
          {paragraphs.map((para, i) => <p key={i}>{para}</p>)}
        </div>
        {shouldClamp && !expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>
      {shouldClamp && (
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="mt-2 text-xs font-medium text-bloom hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

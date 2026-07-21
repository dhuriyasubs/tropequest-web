/**
 * Fix author display name stored in DB with constraint-safe lowercase initials.
 * e.g. "K.a. Knight" → "K.A. Knight", "J.r. Ward" → "J.R. Ward"
 * Tokens that are only letters+periods (initials) get fully uppercased.
 */
export function formatAuthorName(name) {
  if (!name) return name
  return name.split(' ').map(token =>
    /^[a-zA-Z](\.[a-zA-Z])*\.?$/.test(token) ? token.toUpperCase() : token
  ).join(' ')
}

export function toTitleCase(str) {
  if (!str) return str
  const SMALL = new Set(['a','an','the','and','but','or','for','nor','on','at','to','by','in','of','up','as','is'])
  return str.replace(/\w+/g, (word, offset) =>
    (offset === 0 || !SMALL.has(word.toLowerCase()))
      ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      : word.toLowerCase()
  )
}

/** Convert a trope name to a URL-safe slug. e.g. "Enemies to Lovers" → "enemies-to-lovers" */
export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Author bio series names carry extra text ("Off-Campus Series",
 * "Him (co-authored with Sarina Bowen)") that a raw DB series_name won't match —
 * strip it before comparing.
 */
export function normalizeSeriesName(name) {
  return name.replace(/\s+series$/i, '').replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase()
}

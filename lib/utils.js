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

/** Convert a trope name to a URL-safe slug. e.g. "Enemies to Lovers" → "enemies-to-lovers" */
export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

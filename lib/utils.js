/** Convert a trope name to a URL-safe slug. e.g. "Enemies to Lovers" → "enemies-to-lovers" */
export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

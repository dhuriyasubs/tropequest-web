import { getAllSlugs, getAllAuthors, getFilterOptions } from '@/lib/search'

const BASE = 'https://tropequest.netlify.app'

export default async function sitemap() {
  const [slugs, authors, { tropes }] = await Promise.all([
    getAllSlugs(),
    getAllAuthors(),
    getFilterOptions(),
  ])

  const bookUrls = slugs.map(slug => ({
    url: `${BASE}/books/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const authorUrls = authors.map(a => ({
    url: `${BASE}/author/${encodeURIComponent(a)}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const tropeUrls = tropes.map(t => ({
    url: `${BASE}/search?tropes=${encodeURIComponent(t)}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    { url: BASE, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/search`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/tropes`, changeFrequency: 'weekly', priority: 0.8 },
    ...bookUrls,
    ...authorUrls,
    ...tropeUrls,
  ]
}

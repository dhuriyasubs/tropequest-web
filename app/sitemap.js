import { getAllSlugs, getAllAuthors, getFilterOptions } from '@/lib/search'
import { slugify } from '@/lib/utils'

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
    url: `${BASE}/tropes/${slugify(t)}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    { url: BASE, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/search`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/tropes`, changeFrequency: 'weekly', priority: 0.8 },
    ...tropeUrls,
    ...bookUrls,
    ...authorUrls,
  ]
}

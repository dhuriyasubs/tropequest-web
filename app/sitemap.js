import { getAllSlugs, getAllAuthors, getFilterOptions } from '@/lib/search'
import { getAllPosts } from '@/lib/blog'
import { slugify } from '@/lib/utils'

const BASE = 'https://tropequest.com'

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

  const posts = getAllPosts()
  const blogUrls = posts.map(p => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [
    { url: BASE, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/search`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/tropes`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contact`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/privacy`, changeFrequency: 'monthly', priority: 0.3 },
    ...tropeUrls,
    ...blogUrls,
    ...bookUrls,
    ...authorUrls,
  ]
}

import { getAllSlugs, getAllAuthors, getAllSeries, getTropesForSitemap } from '@/lib/search'
import { getAllPosts } from '@/lib/blog'
import { slugify } from '@/lib/utils'

const BASE = 'https://tropequest.com'

export default async function sitemap() {
  const [slugs, authors, seriesAll, tropes] = await Promise.all([
    getAllSlugs(),
    getAllAuthors(),
    getAllSeries(),
    getTropesForSitemap(8),
  ])

  const bookUrls = slugs.map(slug => ({
    url: `${BASE}/books/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const authorUrls = authors.map(a => ({
    url: `${BASE}/author/${encodeURIComponent(a)}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const tropeUrls = tropes.map(t => ({
    url: `${BASE}/tropes/${slugify(t)}`,
    changeFrequency: 'weekly',
    priority: 0.85,
  }))

  const seriesUrls = seriesAll.map(s => ({
    url: `${BASE}/series/${slugify(s.series_name)}`,
    changeFrequency: 'monthly',
    priority: 0.65,
  }))

  const posts = getAllPosts()
  const blogUrls = posts.map(p => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: 'monthly',
    priority: 0.75,
  }))

  const booksLikeUrls = [
    'fourth-wing',
    'a-court-of-thorns-and-roses',
    'colleen-hoover',
  ].map(slug => ({
    url: `${BASE}/books-like/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.85,
  }))

  return [
    { url: BASE,             changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/search`, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/tropes`, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/series`, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/blog`,   changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/because`,changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/about`,  changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contact`,changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/privacy`,changeFrequency: 'yearly',  priority: 0.3 },
    ...booksLikeUrls,
    ...tropeUrls,
    ...blogUrls,
    ...seriesUrls,
    ...bookUrls,
    ...authorUrls,
  ]
}

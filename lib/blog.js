import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export function getAllPosts() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'))

  return files
    .map(file => {
      const slug = file.replace(/\.mdx$/, '')
      const raw  = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8')
      const { data } = matter(raw)
      return { slug, ...data }
    })
    .filter(p => !p.draft)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function getPost(slug) {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)
  return { slug, frontmatter: data, content }
}

export function getRelatedPosts(currentSlug, tags = [], limit = 3) {
  const all = getAllPosts().filter(p => p.slug !== currentSlug)
  const scored = all.map(p => {
    const shared = (p.tags || []).filter(t => tags.includes(t) && t !== 'Reading List').length
    return { ...p, shared }
  })
  scored.sort((a, b) => b.shared - a.shared || new Date(b.date) - new Date(a.date))
  return scored.slice(0, limit)
}

import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import Breadcrumb from '@/components/Breadcrumb'

export const metadata = {
  title: 'Blog',
  description: 'Trope guides, reading lists, and book recommendations from the TropeQuest team.',
  alternates: { canonical: '/blog' },
}

const CATEGORIES = [
  { slug: 'all',               label: 'All' },
  { slug: 'trope-pages',       label: 'Trope pages' },
  { slug: 'books-like',        label: 'Books like X' },
  { slug: 'tool-platform',     label: 'Tool/platform' },
  { slug: 'blog-informational',label: 'Blog/informational' },
]

export default function BlogPage({ searchParams }) {
  const active = searchParams?.category ?? 'all'
  const allPosts = getAllPosts()
  const posts = active === 'all'
    ? allPosts
    : allPosts.filter(p => p.category === active)

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Blog' }]} />
      <h1 className="font-serif text-4xl font-bold mb-2">Blog</h1>
      <p className="text-slate mb-6">Trope guides, reading lists, and book recommendations.</p>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(cat => (
          <Link
            key={cat.slug}
            href={cat.slug === 'all' ? '/blog' : `/blog?category=${cat.slug}`}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              active === cat.slug
                ? 'bg-bloom text-white border-bloom'
                : 'border-petal/50 text-slate hover:border-bloom hover:text-bloom'
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <p className="text-slate">No posts in this category yet.</p>
      ) : (
        <div className="divide-y divide-petal/30">
          {posts.map(post => (
            <article key={post.slug} className="py-8">
              <Link href={`/blog/${post.slug}`} className="group">
                <h2 className="font-serif text-2xl font-bold text-ink group-hover:text-bloom transition-colors mb-1">
                  {post.title}
                </h2>
              </Link>
              <div className="flex items-center gap-3 text-xs text-slate/60 mb-3">
                {post.date && (
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </time>
                )}
                {post.readingTime && <span>{post.readingTime} min read</span>}
              </div>
              {post.description && (
                <p className="text-slate leading-relaxed mb-3">{post.description}</p>
              )}
              {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-xs bg-petal/30 text-bloom rounded-full px-2.5 py-0.5">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

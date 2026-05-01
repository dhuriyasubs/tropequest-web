'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const CATEGORIES = [
  { slug: 'all',                label: 'All' },
  { slug: 'trope-pages',        label: 'Trope pages' },
  { slug: 'books-like',         label: 'Books like X' },
  { slug: 'tool-platform',      label: 'Tool/platform' },
  { slug: 'blog-informational', label: 'Blog/informational' },
]

export default function BlogFilter({ posts }) {
  const searchParams = useSearchParams()
  const active = searchParams.get('category') ?? 'all'
  const filtered = active === 'all' ? posts : posts.filter(p => p.category === active)

  return (
    <>
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

      {filtered.length === 0 ? (
        <p className="text-slate">No posts in this category yet.</p>
      ) : (
        <div className="divide-y divide-petal/30">
          {filtered.map(post => (
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
    </>
  )
}

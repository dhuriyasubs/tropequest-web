import Link from 'next/link'

export default function RelatedPosts({ posts }) {
  if (!posts?.length) return null

  return (
    <div className="mt-12 pt-8 border-t border-petal/30">
      <h2 className="font-serif text-xl font-bold text-ink mb-6">You might also like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {posts.map(post => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block p-4 rounded-lg border border-petal/40 hover:border-bloom/40 hover:bg-petal/10 transition-colors no-underline"
          >
            <p className="text-sm font-medium text-ink group-hover:text-bloom leading-snug mb-1">
              {post.title}
            </p>
            {post.readingTime && (
              <p className="text-xs text-slate/50">{post.readingTime} min read</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

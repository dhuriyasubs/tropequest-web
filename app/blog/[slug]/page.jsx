import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPosts, getPost, getRelatedPosts } from '@/lib/blog'
import Breadcrumb from '@/components/Breadcrumb'
import BookCover from '@/components/BlogBookCover'
import RelatedPosts from '@/components/RelatedPosts'
import BlogFeedback from '@/components/BlogFeedback'

export const revalidate = 3600

export async function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }) {
  const post = getPost(params.slug)
  if (!post) return {}
  const { frontmatter, slug } = post
  return {
    title: frontmatter.title,
    description: frontmatter.description || '',
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description || '',
      url: `/blog/${slug}`,
      images: frontmatter.cover ? [{ url: frontmatter.cover }] : [],
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default function BlogPostPage({ params }) {
  const post = getPost(params.slug)
  if (!post) notFound()

  const { frontmatter, content } = post
  const related = getRelatedPosts(params.slug, frontmatter.tags || [])

  const BoundBookCover = (props) => <BookCover {...props} blogTitle={frontmatter.title} />

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <Breadcrumb crumbs={[
        { label: 'Home', href: '/' },
        { label: 'Blog', href: '/blog' },
        { label: frontmatter.title },
      ]} />

      <header className="mb-10">
        <h1 className="font-serif text-4xl font-bold text-ink mb-3 leading-tight">
          {frontmatter.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-slate/60">
          {frontmatter.date && (
            <time dateTime={frontmatter.date}>
              {new Date(frontmatter.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </time>
          )}
          {frontmatter.readingTime && <span>· {frontmatter.readingTime} min read</span>}
        </div>
        {frontmatter.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {frontmatter.tags.map(tag => (
              <span key={tag} className="text-xs bg-petal/30 text-bloom rounded-full px-2.5 py-0.5">
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <article className="prose prose-slate max-w-none
        prose-headings:font-serif prose-headings:text-ink
        prose-a:text-bloom prose-a:no-underline hover:prose-a:underline
        prose-strong:text-ink
        prose-li:text-slate prose-p:text-slate prose-p:leading-relaxed">
        <MDXRemote source={content} components={{ BookCover: BoundBookCover }} />
      </article>

      <div className="mt-10 pt-8 border-t border-gray-100">
        <BlogFeedback slug={params.slug} />
      </div>

      <RelatedPosts posts={related} />

      <div className="mt-8">
        <Link href="/blog" className="text-sm text-bloom hover:underline">
          ← Back to Blog
        </Link>
      </div>
    </div>
  )
}

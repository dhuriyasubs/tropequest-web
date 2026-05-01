import { Suspense } from 'react'
import { getAllPosts } from '@/lib/blog'
import Breadcrumb from '@/components/Breadcrumb'
import PageViewTracker from '@/components/PageViewTracker'
import BlogFilter from '@/components/BlogFilter'

export const metadata = {
  title: 'Blog',
  description: 'Trope guides, reading lists, and book recommendations from the TropeQuest team.',
  alternates: { canonical: '/blog' },
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <PageViewTracker pageType="blog_listing" />
      <Breadcrumb crumbs={[{ label: 'Home', href: '/' }, { label: 'Blog' }]} />
      <h1 className="font-serif text-4xl font-bold mb-2">Blog</h1>
      <p className="text-slate mb-6">Trope guides, reading lists, and book recommendations.</p>
      <Suspense>
        <BlogFilter posts={posts} />
      </Suspense>
    </div>
  )
}

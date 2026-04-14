import Image from 'next/image'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import BlogTbrButton from '@/components/BlogTbrButton'

export default async function BookCover({ slug, blogTitle }) {
  const { data: book } = await supabaseAdmin
    .from('books')
    .select('id, title, cover_url')
    .eq('slug', slug)
    .single()

  if (!book?.cover_url) return null

  return (
    <div className="float-right ml-6 mb-4 shrink-0 not-prose">
      <Link href={`/books/${slug}`} className="block no-underline">
        <div className="w-28 aspect-[2/3] rounded overflow-hidden shadow-md relative">
          <Image
            src={book.cover_url}
            alt={book.title}
            fill
            sizes="112px"
            className="object-cover"
          />
        </div>
      </Link>
      {blogTitle && book.id && (
        <div className="mt-2">
          <BlogTbrButton bookId={book.id} blogTitle={blogTitle} />
        </div>
      )}
    </div>
  )
}

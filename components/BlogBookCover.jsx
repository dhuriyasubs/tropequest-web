import Image from 'next/image'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'

export default async function BookCover({ slug }) {
  const { data: book } = await supabaseAdmin
    .from('books')
    .select('title, cover_url')
    .eq('slug', slug)
    .single()

  if (!book?.cover_url) return null

  return (
    <Link href={`/books/${slug}`} className="float-right ml-6 mb-4 shrink-0 no-underline">
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
  )
}

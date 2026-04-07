import { getAllAuthors } from '@/lib/search'
import AuthorList from './AuthorList'

export const metadata = {
  title: 'Browse Authors',
  description: 'Explore all authors on TropeQuest: find books by your favourite romance, romantasy, and thriller writers.',
  alternates: { canonical: '/author' },
  openGraph: {
    title: 'Browse Authors | TropeQuest',
    description: 'Explore all authors on TropeQuest.',
    url: '/author',
  },
}

export const revalidate = 3600

export default async function AuthorsPage() {
  const authors = await getAllAuthors()
  const sorted  = [...authors].sort((a, b) => a.localeCompare(b))

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-2">Browse Authors</h1>
      <p className="text-slate mb-6">{authors.length} authors on TropeQuest</p>
      <AuthorList authors={sorted} />
    </div>
  )
}

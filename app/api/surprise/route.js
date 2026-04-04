import { getRandomBooks } from '@/lib/search'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const excludeParam = searchParams.get('exclude') ?? ''
  const excludeIds = excludeParam ? excludeParam.split(',') : []
  const books = await getRandomBooks(15, excludeIds)
  return Response.json({ books })
}

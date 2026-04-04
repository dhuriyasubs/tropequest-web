import { getSurpriseBooks } from '@/lib/search'
import { createSupabaseServer } from '@/lib/supabase'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const excludeParam = searchParams.get('exclude') ?? ''
  const excludeIds = excludeParam ? excludeParam.split(',') : []

  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const books = await getSurpriseBooks(user?.id ?? null, excludeIds)
  return Response.json({ books })
}

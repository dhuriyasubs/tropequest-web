import { supabaseAdmin } from '@/lib/supabase'
import { getPersonalizedBooks, getFeaturedBooks } from '@/lib/search'

const SITE = 'https://tropequest.com'

// Books to recommend for one user — their trope/author picks if they set
// any, otherwise just trending titles. Already-known books (shelf or TBR,
// any status) are excluded so the digest never recommends what they've
// already saved.
export async function getDigestBooks(userId) {
  const [interestsRes, shelfRes, tbrRes] = await Promise.all([
    supabaseAdmin.from('user_interests').select('tropes, subjects, authors').eq('user_id', userId).single(),
    supabaseAdmin.from('shelf').select('book_id').eq('user_id', userId),
    supabaseAdmin.from('tbr').select('book_id').eq('user_id', userId),
  ])

  const excludeIds = [
    ...(shelfRes.data ?? []).map(r => r.book_id),
    ...(tbrRes.data ?? []).map(r => r.book_id),
  ]

  const interests = interestsRes.data
  const hasPicks = (interests?.tropes?.length || interests?.subjects?.length || interests?.authors?.length)

  if (hasPicks) {
    const books = await getPersonalizedBooks({ ...interests, excludeIds })
    if (books.length) return { books: books.slice(0, 6), topTrope: interests.tropes?.[0] ?? null }
  }

  const featured = await getFeaturedBooks(18)
  const excludeSet = new Set(excludeIds)
  return { books: featured.filter(b => !excludeSet.has(b.id)).slice(0, 6), topTrope: null }
}

export function buildDigestEmail({ userId, books, topTrope }) {
  const subject = topTrope ? `New ${topTrope} picks for you 📚` : 'Books picked for you on TropeQuest 📚'
  const unsubscribeUrl = `${SITE}/api/email-unsubscribe?u=${userId}`

  const cards = books.map(b => `
    <table role="presentation" width="100%" style="margin-bottom:20px">
      <tr>
        <td width="72" valign="top">
          ${b.cover_url
            ? `<img src="${b.cover_url}" width="64" alt="" style="border-radius:6px;display:block" />`
            : ''}
        </td>
        <td valign="top" style="padding-left:14px">
          <a href="${SITE}/books/${b.slug}" style="color:#1a1a2e;font-weight:600;font-size:15px;text-decoration:none">${b.title}</a>
          <div style="color:#6b7280;font-size:13px;margin-top:2px">${b.author}</div>
        </td>
      </tr>
    </table>
  `).join('')

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:24px 20px">
      <p style="font-family:Georgia,serif;font-weight:700;font-size:20px;color:#c084a0;margin:0 0 20px">TropeQuest</p>
      <h1 style="font-family:Georgia,serif;font-size:20px;color:#1a1a2e;margin:0 0 4px">
        ${topTrope ? `Fresh ${topTrope.toLowerCase()} picks` : "Books we think you'll love"}
      </h1>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Based on what you've read and saved.</p>
      ${cards}
      <a href="${SITE}/search" style="display:inline-block;background:#c084a0;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 20px;border-radius:10px;margin-top:8px">
        Browse more books →
      </a>
      <p style="color:#9ca3af;font-size:11px;margin-top:40px;border-top:1px solid #eee;padding-top:16px">
        You're getting this because you have a TropeQuest account.
        <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline">Unsubscribe</a>
      </p>
    </div>
  `

  return { subject, html }
}

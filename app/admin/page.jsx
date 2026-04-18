import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer, supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'
import TagAudit from './TagAudit'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin' }

const modules = [
  { href: '/admin/books',      label: 'Add / Edit Books',   description: 'Search and update book fields, tropes, genres, buy links' },
  { href: '/admin/author-bio', label: 'Author Bio',  description: 'Add or edit structured author bios with paste-to-parse' },
  { href: '/admin/series-bio', label: 'Series Bio',  description: 'Add or edit series reading order, intro, and tips' },
]

const STAT_FIELDS = [
  { key: 'zero_tropes',            label: 'Tropes' },
  { key: 'zero_genres',            label: 'Genres' },
  { key: 'zero_time_period',       label: 'Time Period' },
  { key: 'zero_relationship_type', label: 'Relationship' },
  { key: 'zero_story_tags',        label: 'Story Tags' },
  { key: 'zero_content_warnings',  label: 'Content Warnings' },
  { key: 'zero_representation',    label: 'Representation' },
  { key: 'zero_setting_tags',      label: 'Setting' },
  { key: 'zero_geography_tags',    label: 'Geography' },
  { key: 'missing_description',    label: 'Description' },
  { key: 'missing_cover',          label: 'Cover' },
  { key: 'missing_rating',         label: 'Rating' },
]

async function fetchStats() {
  try {
    const arr = f => `${f}.is.null,${f}.eq.{}`
    const c = filter => filter(supabaseAdmin.from('books').select('*', { count: 'exact', head: true }))
    const [total, tropes, genres, timePeriod, relType, storyTags, cw, rep, setting, geo, desc, cover, rating] = await Promise.all([
      supabaseAdmin.from('books').select('*', { count: 'exact', head: true }),
      c(q => q.or(arr('tropes'))),
      c(q => q.or(arr('genres'))),
      c(q => q.or(arr('time_period'))),
      c(q => q.or(arr('relationship_type'))),
      c(q => q.or(arr('story_tags'))),
      c(q => q.or(arr('content_warnings'))),
      c(q => q.or(arr('representation'))),
      c(q => q.or(arr('setting_tags'))),
      c(q => q.or(arr('geography_tags'))),
      c(q => q.or('description.is.null,description.eq.')),
      c(q => q.or('cover_url.is.null,cover_url.eq.')),
      c(q => q.is('rating', null)),
    ])
    return {
      total:                    total.count       ?? 0,
      zero_tropes:              tropes.count      ?? 0,
      zero_genres:              genres.count      ?? 0,
      zero_time_period:         timePeriod.count  ?? 0,
      zero_relationship_type:   relType.count     ?? 0,
      zero_story_tags:          storyTags.count   ?? 0,
      zero_content_warnings:    cw.count          ?? 0,
      zero_representation:      rep.count         ?? 0,
      zero_setting_tags:        setting.count     ?? 0,
      zero_geography_tags:      geo.count         ?? 0,
      missing_description:      desc.count        ?? 0,
      missing_cover:            cover.count       ?? 0,
      missing_rating:           rating.count      ?? 0,
    }
  } catch {
    return null
  }
}

export default async function AdminPage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')
  if (!isAdmin(user)) return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-serif text-2xl font-bold mb-2">Not Authorized</h1>
      <p className="text-slate text-sm">You do not have permission to access this page.</p>
    </div>
  )

  const stats = await fetchStats()

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-2">Admin</h1>
      <p className="text-slate text-sm mb-8">TropeQuest content management.</p>

      {stats && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate uppercase tracking-wide">Missing fields</p>
            <p className="text-xs text-slate">{stats.total} books total</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {STAT_FIELDS.map(({ key, label }) => {
              const count = stats[key] ?? 0
              const pct = stats.total ? count / stats.total : 0
              const color = pct === 0
                ? 'bg-green-50 border-green-200 text-green-700'
                : pct < 0.3
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              return (
                <div key={key} className={`border rounded-lg px-3 py-2 ${color}`}>
                  <p className="text-[11px] font-medium">{label}</p>
                  <p className="text-lg font-bold leading-tight">{count}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <TagAudit />

      <div className="space-y-3">
        {modules.map(m => (
          <Link key={m.href} href={m.href}
            className="flex items-center justify-between border border-gray-200 rounded-xl px-5 py-4 hover:bg-petal/10 transition-colors group">
            <div>
              <p className="font-semibold text-sm group-hover:text-bloom transition-colors">{m.label}</p>
              <p className="text-xs text-slate mt-0.5">{m.description}</p>
            </div>
            <span className="text-slate text-lg">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

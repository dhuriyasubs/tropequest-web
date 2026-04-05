import Link from 'next/link'

// crumbs: [{ label: 'Home', href: '/' }, { label: 'Tropes', href: '/tropes' }, { label: 'Enemies to Lovers' }]
// Last crumb has no href — it's the current page.
export default function Breadcrumb({ crumbs }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center flex-wrap gap-1 text-sm text-slate/60">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span className="select-none">/</span>}
              {isLast || !crumb.href ? (
                <span className="text-ink font-medium line-clamp-1 max-w-[200px]">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-bloom transition-colors">
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

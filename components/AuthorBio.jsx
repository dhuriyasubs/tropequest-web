export default function AuthorBio({ bio }) {
  if (!bio) return null

  const { intro, profile, writing_style, series, reader_tip } = bio

  return (
    <div className="max-w-2xl mb-12 space-y-6">
      {/* Intro */}
      {intro && (
        <p className="text-sm text-slate leading-relaxed">{intro}</p>
      )}

      {/* Profile grid */}
      {profile && Object.keys(profile).length > 0 && (
        <div className="bg-petal/10 rounded-xl p-5">
          <h2 className="font-serif text-base font-semibold mb-3">Profile &amp; Career</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {Object.entries(profile).map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs font-semibold text-bloom uppercase tracking-wide">{key}</dt>
                <dd className="text-sm text-slate mt-0.5">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Writing style */}
      {writing_style && (
        <div>
          <h2 className="font-serif text-base font-semibold mb-2">Writing Style &amp; Impact</h2>
          <p className="text-sm text-slate leading-relaxed">{writing_style}</p>
        </div>
      )}

      {/* Series chronology */}
      {series?.length > 0 && (
        <div>
          <h2 className="font-serif text-base font-semibold mb-3">Major Series Chronology</h2>
          <div className="space-y-3">
            {series.map((s, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-bloom mt-1.5 shrink-0" />
                  {i < series.length - 1 && <div className="w-px flex-1 bg-bloom/20 mt-1" />}
                </div>
                <div className="pb-3">
                  <p className="text-sm font-semibold">{s.name}
                    {s.years && <span className="font-normal text-slate ml-2">· {s.years}</span>}
                  </p>
                  {s.description && (
                    <p className="text-sm text-slate mt-0.5">{s.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reader tip */}
      {reader_tip && (
        <div className="border-l-2 border-bloom/40 pl-4">
          <p className="text-xs font-semibold text-bloom mb-1">Reader Tip</p>
          <p className="text-sm text-slate leading-relaxed">{reader_tip}</p>
        </div>
      )}
    </div>
  )
}

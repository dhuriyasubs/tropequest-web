export default function ShelfLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="h-8 w-28 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-4 w-16 bg-gray-100 rounded animate-pulse mt-2" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-9 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-9 w-9 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
        {/* Status filter tabs */}
        <div className="flex gap-2 mt-3">
          {[80, 96, 104, 80].map((w, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded-full animate-pulse" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* Book rows */}
      <div className="space-y-8">
        {[1, 2].map(section => (
          <div key={section}>
            <div className="h-5 w-40 bg-gray-100 rounded animate-pulse mb-3" />
            <div className="grid gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white">
                  <div className="w-14 shrink-0 rounded-lg bg-gray-100 animate-pulse" style={{ aspectRatio: '2/3' }} />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

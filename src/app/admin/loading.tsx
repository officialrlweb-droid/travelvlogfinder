export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      <div className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-emerald-100">
        <div className="tvf-indeterminate-bar h-full w-1/2 rounded-full bg-emerald-700" />
      </div>

      <div className="h-18 bg-emerald-950" />

      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-6 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="h-20 animate-pulse rounded-2xl border border-stone-200 bg-white"
            />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-28 animate-pulse rounded-2xl border border-stone-200 bg-white"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

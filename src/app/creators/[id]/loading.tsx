export default function CreatorProfileLoading() {
  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      {/* Top progress bar */}
      <div className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-emerald-100">
        <div className="tvf-indeterminate-bar h-full w-1/2 rounded-full bg-emerald-700" />
      </div>

      {/* Sticky top bar skeleton */}
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="h-5 w-16 animate-pulse rounded bg-stone-200" />
          <div className="h-5 w-32 animate-pulse rounded bg-stone-200" />
          <div className="h-5 w-16 animate-pulse rounded bg-stone-200" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 pt-6 sm:px-6 sm:pt-8">
        {/* Profile header skeleton */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-9">
            <div className="h-24 w-24 shrink-0 animate-pulse rounded-full bg-stone-200 sm:h-28 sm:w-28" />
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="h-7 w-56 animate-pulse rounded-lg bg-stone-200" />
                <div className="flex gap-2">
                  <div className="h-10 w-32 animate-pulse rounded-lg bg-stone-200" />
                  <div className="h-10 w-20 animate-pulse rounded-lg bg-stone-100" />
                </div>
              </div>
              <div className="flex gap-6">
                <div className="h-5 w-20 animate-pulse rounded bg-stone-100" />
                <div className="h-5 w-28 animate-pulse rounded bg-stone-100" />
                <div className="h-5 w-20 animate-pulse rounded bg-stone-100" />
              </div>
              <div className="h-4 w-64 animate-pulse rounded bg-stone-100" />
            </div>
          </div>

          <div className="mt-7 flex gap-4 border-t border-stone-100 pt-5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex flex-col items-center gap-1.5">
                <div className="h-14 w-14 animate-pulse rounded-full bg-stone-100" />
                <div className="h-3 w-12 animate-pulse rounded bg-stone-100" />
              </div>
            ))}
          </div>
        </div>

        {/* Video grid skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
            >
              <div className="aspect-video w-full animate-pulse bg-stone-200" />
              <div className="space-y-2 p-3.5">
                <div className="h-4 w-5/6 animate-pulse rounded bg-stone-200" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

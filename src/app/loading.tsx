import { BrandMark } from "@/components/BrandLogo";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f6f7f4]">
      {/* Slim top indeterminate loading bar */}
      <div className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-emerald-100">
        <div className="tvf-indeterminate-bar h-full w-1/2 rounded-full bg-emerald-700" />
      </div>

      {/* Header skeleton */}
      <div className="bg-emerald-950/95 pb-20 pt-6 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-10 w-10 shrink-0 rounded-xl ring-1 ring-white/20" />
            <span className="text-lg font-extrabold tracking-tight">
              TravelVlogFinder
            </span>
          </div>
          <div className="mt-7 space-y-2.5">
            <div className="h-8 w-72 animate-pulse rounded-lg bg-white/15 sm:w-96" />
            <div className="h-4 w-64 animate-pulse rounded bg-white/10 sm:w-80" />
          </div>
        </div>
      </div>

      {/* Search card & results skeletons */}
      <div className="mx-auto -mt-14 max-w-5xl space-y-5 px-4 sm:px-6">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="h-12 animate-pulse rounded-xl bg-stone-100" />
            <div className="h-12 animate-pulse rounded-xl bg-stone-100" />
            <div className="h-12 animate-pulse rounded-xl bg-stone-100" />
          </div>
          <div className="mt-4 h-12 animate-pulse rounded-xl bg-stone-100" />
        </div>

        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="h-6 w-56 animate-pulse rounded-lg bg-stone-200" />
              <div className="h-7 w-32 animate-pulse rounded-full bg-emerald-50" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="h-16 animate-pulse rounded-xl bg-stone-100" />
              <div className="h-16 animate-pulse rounded-xl bg-stone-100" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="h-36 animate-pulse rounded-xl bg-stone-100" />
              <div className="h-36 animate-pulse rounded-xl bg-stone-100" />
              <div className="h-36 animate-pulse rounded-xl bg-stone-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function CreatorNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
        <Compass className="h-7 w-7" />
      </span>
      <h1 className="mt-4 text-2xl font-extrabold text-stone-900">
        Creator profile not found
      </h1>
      <p className="mt-2 max-w-md text-sm text-stone-600">
        This creator profile may have been removed or the link might be
        outdated.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-bold text-white hover:bg-emerald-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Kerala creators
      </Link>
    </div>
  );
}

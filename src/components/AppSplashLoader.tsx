"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "./BrandLogo";

/**
 * Full-screen brand loading animation shown on initial app load / browser refresh.
 * Because RootLayout stays mounted across Next.js client navigations, it plays smoothly
 * on app launch/reload without interrupting in-app route clicks.
 */
export function AppSplashLoader() {
  const [phase, setPhase] = useState<"visible" | "fading" | "hidden">(
    "visible"
  );

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setPhase("fading");
    }, 1100);

    const hideTimer = setTimeout(() => {
      setPhase("hidden");
    }, 1480);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (phase === "hidden") {
    return null;
  }

  return (
    <div
      aria-label="Loading TravelVlogFinder"
      role="status"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#f6f7f4] px-6 transition-all duration-350 ease-out ${
        phase === "fading"
          ? "pointer-events-none scale-[1.02] opacity-0"
          : "scale-100 opacity-100"
      }`}
    >
      <div className="relative flex items-center justify-center">
        <span
          aria-hidden="true"
          className="tvf-ring-motion absolute h-24 w-24 rounded-full border-2 border-emerald-700/35"
        />
        <span
          aria-hidden="true"
          className="tvf-ring-motion absolute h-20 w-20 rounded-full border border-emerald-600/25"
          style={{ animationDelay: "350ms" }}
        />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-xl shadow-emerald-950/20">
          <BrandMark className="tvf-compass-motion h-16 w-16" />
        </span>
      </div>

      <p className="mt-6 text-xl font-extrabold tracking-tight text-stone-900">
        TravelVlogFinder
      </p>
      <p className="mt-1 text-xs font-medium tracking-wide text-stone-500">
        Kerala, India · Finding creators for your trip
      </p>

      <div className="mt-6 h-1.5 w-44 overflow-hidden rounded-full bg-stone-200">
        <div className="tvf-splash-bar h-full w-full rounded-full bg-emerald-700" />
      </div>
    </div>
  );
}

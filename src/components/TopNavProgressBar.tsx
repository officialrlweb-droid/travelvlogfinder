"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Slim top emerald loading bar triggered immediately on internal route clicks
 * so switching between Search, Creator Profiles, Submit, and Admin always feels responsive.
 */
export function TopNavProgressBar() {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);

  // Stop loading bar whenever route pathname finishes updating
  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  useEffect(() => {
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) {
        return;
      }

      const nextPath = href.split("?")[0].split("#")[0];
      if (nextPath === pathname) {
        return;
      }

      setNavigating(true);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      fallbackTimer = setTimeout(() => setNavigating(false), 4000);
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [pathname]);

  if (!navigating) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[90] h-1 overflow-hidden bg-emerald-100/90"
    >
      <div className="tvf-indeterminate-bar h-full w-1/2 rounded-full bg-emerald-700" />
    </div>
  );
}

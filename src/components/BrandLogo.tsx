import { useId } from "react";

interface BrandMarkProps {
  className?: string;
}

/**
 * Custom TravelVlogFinder emblem:
 * Location pin + video play aperture + subtle Kerala coastal horizon curve.
 */
export function BrandMark({ className = "h-10 w-10" }: BrandMarkProps) {
  const gradId = useId();

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="6"
          y1="4"
          x2="42"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#137A5B" />
          <stop offset="100%" stopColor="#064030" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill={`url(#${gradId})`} />
      <path
        d="M24 8.5C16.95 8.5 11.25 14.12 11.25 21.05C11.25 29.35 21.15 37.55 23.18 39.12C23.66 39.5 24.34 39.5 24.82 39.12C26.85 37.55 36.75 29.35 36.75 21.05C36.75 14.12 31.05 8.5 24 8.5Z"
        fill="#FFFFFF"
      />
      <path
        d="M21.2 16.25C21.2 15.55 21.96 15.12 22.56 15.48L29.68 19.78C30.26 20.13 30.26 20.97 29.68 21.32L22.56 25.62C21.96 25.98 21.2 25.55 21.2 24.85V16.25Z"
        fill="#0B523D"
      />
      <path
        d="M15.5 41.4C18.3 40.1 21.1 39.6 24 39.6C26.9 39.6 29.7 40.1 32.5 41.4"
        stroke="#6EE7B7"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

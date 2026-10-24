import type { SVGProps } from 'react';

/**
 * Navigation icons, drawn with currentColor (same shapes as /public/home.svg etc.):
 * Hugeicons "home-04" (MIT), ProIcons "search" (MIT), Lucide "heart" (ISC),
 * TDesign "user-1" (MIT) — stroke widths and sizes matched to each other.
 */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path
        transform="translate(12 12) scale(0.89) translate(-12 -12)"
        strokeWidth={2.25}
        d="M3 11.99v2.51c0 3.3 0 4.95 1.025 5.975S6.7 21.5 10 21.5h4c3.3 0 4.95 0 5.975-1.025S21 17.8 21 14.5v-2.51c0-1.682 0-2.522-.356-3.25s-1.02-1.244-2.346-2.276l-2-1.555C14.233 3.303 13.2 2.5 12 2.5s-2.233.803-4.298 2.409l-2 1.555C4.375 7.496 3.712 8.012 3.356 8.74S3 10.308 3 11.99M16 17H8"
      />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path
        transform="translate(12 12) scale(0.93) translate(-12 -12)"
        strokeWidth={2.37}
        d="M15.553 15.553a7.06 7.06 0 1 0-9.985-9.985a7.06 7.06 0 0 0 9.985 9.985m0 0L20 20"
      />
    </svg>
  );
}

export function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path
        transform="translate(12 12.4) scale(0.9) translate(-12 -12)"
        strokeWidth={2.22}
        d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676a.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"
      />
    </svg>
  );
}

export function ProfileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path d="M19.5 20v-1a4 4 0 0 0-4-4h-7a4 4 0 0 0-4 4v1M16 7.5a4 4 0 1 1-8 0a4 4 0 0 1 8 0Z" />
    </svg>
  );
}
